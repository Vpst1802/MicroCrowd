import OpenAI from 'openai';
import { PartialPersonaProfile, PersonaProfile, SimulationTurn } from "../types";
import { 
    OPENAI_MODEL_NAME, 
    PERSONA_GENERATION_PROMPT_CONTEXT_FOR_CSV,
    SIMULATION_RESPONSE_PROMPT,
    AI_MODERATOR_PROMPT
} from "../constants";
import { conversationOrchestrator } from './conversationOrchestrator';

const getApiKey = (): string => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set.");
  }
  return apiKey;
};

let openai: OpenAI | null = null;

const getOpenAIInstance = (): OpenAI => {
  if (!openai) {
    try {
      openai = new OpenAI({
        apiKey: getApiKey(),
        dangerouslyAllowBrowser: true
      });
    } catch (error) {
      console.error("Failed to initialize OpenAI:", error);
      throw error; 
    }
  }
  return openai;
};

const parseJsonFromResponse = <T>(text: string, context: string): T => {
    let jsonStr = text.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }
    try {
      return JSON.parse(jsonStr) as T;
    } catch (e) {
      console.error(`Failed to parse JSON for ${context}:`, e, "Original text:", text, "Processed string:", jsonStr);
      throw new Error(`AI returned malformed JSON for ${context}. Raw: ${text.substring(0,100)}...`);
    }
}

const handleOpenAIApiError = (error: unknown, context: string): Error => {
    console.error(`Error ${context}:`, error);
    let errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('quota exceeded')) {
        return new Error(`OpenAI Rate Limit Exceeded: Too many requests. Please wait a moment and try again, or reduce simulation complexity (e.g., fewer personas/turns). Original: ${errorMessage.substring(0, 150)}`);
    }
    if (errorMessage.toLowerCase().includes('invalid api key') || errorMessage.toLowerCase().includes('authentication')) {
        return new Error(`OpenAI API Key is not valid. Please check your API_KEY. Original error: ${errorMessage}`);
    }
    return new Error(`Failed during ${context}. OpenAI API error: ${errorMessage}`);
};

export const generatePersonaFromData = async (csvRowData: Record<string, string>): Promise<PersonaProfile> => {
  const openaiInstance = getOpenAIInstance();
  const csvDataString = JSON.stringify(csvRowData);
  const prompt = PERSONA_GENERATION_PROMPT_CONTEXT_FOR_CSV.replace('{csvDataString}', csvDataString);

  try {
    const response = await openaiInstance.chat.completions.create({
      model: OPENAI_MODEL_NAME,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const responseText = response.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("OpenAI returned empty response");
    }

    const partialProfile = parseJsonFromResponse<PartialPersonaProfile>(responseText, "persona generation");
    
    if (!partialProfile.name || !partialProfile.age || !partialProfile.occupation || !partialProfile.personality || !partialProfile.generatedSummary) {
        console.error("Generated persona missing fields:", partialProfile);
        throw new Error("Generated persona is missing one or more required fields (name, age, occupation, personality, summary).");
    }

    return {
      ...partialProfile,
      id: crypto.randomUUID(),
      sourceData: csvRowData, 
    };

  } catch (error) {
    throw handleOpenAIApiError(error, `persona generation for ${csvRowData.name || 'unknown data'}`);
  }
};

export const generateMultiplePersonasFromCSVData = async (csvDataArray: Record<string, string>[]): Promise<PersonaProfile[]> => {
  const personaPromises: Promise<PersonaProfile>[] = csvDataArray.map(rowData => generatePersonaFromData(rowData));
  return Promise.all(personaPromises);
};

export async function* getPersonaSimulationResponse(
    persona: PersonaProfile,
    simulationTopic: string,
    researchGoal: string,
    conversationHistory: SimulationTurn[],
    latestQuestionOrStatement: string,
    allParticipants: PersonaProfile[] = []
): AsyncGenerator<string, void, undefined> {
    const openaiInstance = getOpenAIInstance();

    // Initialize conversation orchestrator if this is the first call
    if (conversationHistory.length === 0 || !localStorage.getItem(`conversation_initialized_${simulationTopic}`)) {
        conversationOrchestrator.initializeConversation(simulationTopic, allParticipants, researchGoal);
        localStorage.setItem(`conversation_initialized_${simulationTopic}`, 'true');
    }

    // Use conversation orchestrator to prepare enhanced response
    const responseGeneration = conversationOrchestrator.preparePersonaResponse(
        persona,
        simulationTopic,
        conversationHistory,
        latestQuestionOrStatement,
        allParticipants
    );

    if (!responseGeneration.shouldProceed) {
        console.warn('Response generation blocked:', responseGeneration.validationIssues);
        yield `[System: Response validation failed for ${persona.name}]`;
        return;
    }

    // Use enhanced prompt from orchestrator
    const enhancedPrompt = responseGeneration.enhancedPrompt;
    
    try {
        // Adjust temperature based on personality and emotional state
        let baseTemp = 0.9;
        
        // Higher temperature for high emotional intensity
        if (responseGeneration.responseModifiers.emotionalIntensity === 'high') {
            baseTemp = 1.1;
        } else if (responseGeneration.responseModifiers.emotionalIntensity === 'low') {
            baseTemp = 0.7;
        }

        // Personality-based temperature variation
        const personalityVariation = (persona.personality.openness - 3) * 0.1;
        const extraversionVariation = (persona.personality.extraversion - 3) * 0.05;
        const finalTemp = Math.max(0.6, Math.min(1.3, baseTemp + personalityVariation + extraversionVariation));

        // Adjust max tokens based on response length modifier
        let maxTokens = 150; // Default
        if (responseGeneration.responseModifiers.responseLength === 'short') {
            maxTokens = 80;
        } else if (responseGeneration.responseModifiers.responseLength === 'long') {
            maxTokens = 250;
        }

        const stream = await openaiInstance.chat.completions.create({
            model: OPENAI_MODEL_NAME,
            messages: [
                {
                    role: "user",
                    content: enhancedPrompt
                }
            ],
            temperature: finalTemp,
            max_tokens: maxTokens,
            stream: true
        });

        let generatedResponse = '';
        
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                generatedResponse += content;
                yield content;
            }
        }

        // Post-process the response with enhanced conversation orchestrator
        const validation = conversationOrchestrator.validateAndProcessResponse(
            persona,
            generatedResponse,
            conversationHistory,
            allParticipants
        );

        if (!validation.isValid && validation.validationIssues.length > 0) {
            console.warn(`🔍 Response validation issues for ${persona.name}:`, validation.validationIssues);
            if (validation.referenceIssues.length > 0) {
                console.warn(`📝 Reference issues detected:`, validation.referenceIssues);
            }
        }

        // Log successful response generation
        console.log(`Enhanced response generated for ${persona.name} with emotional intensity: ${responseGeneration.responseModifiers.emotionalIntensity}`);

    } catch (error) {
        throw handleOpenAIApiError(error, `streaming enhanced simulation response for ${persona.name}`);
    }
}

export async function* getAIModeratorAction(
    researchGoal: string,
    discussionGuide: string,
    transcript: SimulationTurn[],
    participatingPersonas: PersonaProfile[]
): AsyncGenerator<string, void, undefined> {
    const openaiInstance = getOpenAIInstance();

    const participantNamesString = participatingPersonas.map(p => p.name).join(', ');
    
    const relevantTranscript = transcript.slice(-12);
    const transcriptString = relevantTranscript.map(turn => `${turn.speaker}: ${turn.text}`).join('\n');

    // Analyze discussion guide progress
    const discussionGuideLines = discussionGuide.split('\n').filter(line => line.trim());
    const moderatorTurns = transcript.filter(turn => turn.speaker === 'Moderator');
    const turnCount = moderatorTurns.length;
    
    // Analyze conversation dynamics for moderator context
    const recentParticipantTurns = transcript.slice(-6).filter(t => t.speaker !== 'Moderator');
    const agreementWords = ['agree', 'exactly', 'totally', 'same', 'yeah', 'definitely', 'absolutely'];
    const agreementCount = recentParticipantTurns.reduce((count, turn) => {
        return count + agreementWords.filter(word => turn.text.toLowerCase().includes(word)).length;
    }, 0);
    
    const avgResponseLength = recentParticipantTurns.reduce((sum, turn) => sum + turn.text.length, 0) / Math.max(1, recentParticipantTurns.length);
    
    // Detect participation patterns
    const participationCounts = participatingPersonas.reduce((counts, persona) => {
        counts[persona.name] = transcript.filter(t => t.speaker === persona.name).length;
        return counts;
    }, {} as Record<string, number>);
    
    const totalTurns = Object.values(participationCounts).reduce((sum, count) => sum + count, 0);
    const avgTurns = totalTurns / participatingPersonas.length;
    
    const dominators = participatingPersonas.filter(p => participationCounts[p.name] > avgTurns * 1.5).map(p => p.name);
    const quietParticipants = participatingPersonas.filter(p => participationCounts[p.name] < avgTurns * 0.5).map(p => p.name);
    
    // Get conversation insights from orchestrator
    let conversationInsights = null;
    try {
        conversationInsights = conversationOrchestrator.getConversationInsights(transcript, participatingPersonas);
    } catch (error) {
        console.warn('Could not get conversation insights:', error);
    }

    // Add context about discussion stage and dynamics
    let stageContext = '';
    if (turnCount === 0) {
        stageContext = '\n\nCONTEXT: This is the very beginning. Start with a warm welcome and introduce the FIRST topic from your discussion guide exactly as written.';
    } else if (turnCount < 3) {
        stageContext = '\n\nCONTEXT: Early stage - stay focused on the FIRST topic from your discussion guide. Probe deeper with follow-up questions before moving on.';
    } else {
        const topicsExplored = Math.floor(turnCount / 2);
        if (topicsExplored < discussionGuideLines.length) {
            stageContext = `\n\nCONTEXT: Discussion turn ${turnCount + 1}. You've covered roughly ${topicsExplored} topics. Focus on the NEXT unaddressed topic from your discussion guide, or probe deeper on current topic if participants need more exploration.`;
        } else {
            stageContext = `\n\nCONTEXT: Discussion turn ${turnCount + 1}. You've covered most topics. Continue with remaining discussion guide items or probe for deeper insights on key topics.`;
        }
    }

    // Add enhanced conversation insights
    if (conversationInsights) {
        stageContext += `\n\nENHANCED CONVERSATION ANALYSIS:`;
        stageContext += `\nConsensus Level: ${Math.round(conversationInsights.consensusLevel * 100)}%`;
        
        if (conversationInsights.flowRecommendations.length > 0) {
            const topRecommendation = conversationInsights.flowRecommendations[0];
            stageContext += `\nTop Recommendation: ${topRecommendation.action} - ${topRecommendation.reason}`;
            if (topRecommendation.suggestedIntervention) {
                stageContext += `\nSuggested: "${topRecommendation.suggestedIntervention}"`;
            }
        }

        // Participation balance insights
        const participationEntries = Object.entries(conversationInsights.participationBalance);
        const totalTurns = participationEntries.reduce((sum, [, count]) => sum + count, 0);
        if (totalTurns > 0) {
            const imbalancedParticipants = participationEntries.filter(([name, count]) => {
                const percentage = (count / totalTurns) * 100;
                return percentage > 50 || percentage < 10;
            });
            
            if (imbalancedParticipants.length > 0) {
                stageContext += `\nParticipation Imbalance Detected: Consider balancing airtime`;
            }
        }
    }
    
    // TinyTroupe-style conversation dynamics context
    const interventionContext = localStorage.getItem('currentInterventionContext');
    let dynamicsContext = '';
    
    if (interventionContext) {
        const intervention = JSON.parse(interventionContext);
        dynamicsContext = `\nCURRENT INTERVENTION CONTEXT:\nPriority: ${intervention.priority}\nInstruction: ${intervention.instruction}\nTone: ${intervention.tone}\n`;
        localStorage.removeItem('currentInterventionContext'); // Clear after use
    } else {
        // Provide general conversation state awareness
        dynamicsContext = `\nCONVERSATION STATE AWARENESS:\n`;
        
        if (agreementCount >= 3) {
            dynamicsContext += `- Agreement level: HIGH (${agreementCount} indicators) - Consider exploring different perspectives\n`;
        }
        
        if (dominators.length > 0) {
            dynamicsContext += `- Participation: ${dominators.join(', ')} speaking frequently - May need to balance airtime\n`;
        }
        
        if (quietParticipants.length > 0) {
            dynamicsContext += `- Quiet voices: ${quietParticipants.join(', ')} - Natural opportunity to include them\n`;
        }
        
        if (avgResponseLength < 30) {
            dynamicsContext += `- Energy level: LOW (short responses) - May need to revitalize discussion\n`;
        }
        
        dynamicsContext += `- Discussion momentum: ${turnCount < 3 ? 'BUILDING' : turnCount < 8 ? 'ACTIVE' : 'MATURE'}\n`;
        dynamicsContext += `- Natural intervention needed: ${turnCount > 6 && moderatorTurns.length < 2 ? 'YES' : 'MINIMAL'}\n`;
    }
    
    stageContext += dynamicsContext;
    stageContext += '\n\nREMEMBER: Use minimal intervention. Let natural conversation flow unless research goals require guidance.';

    const prompt = AI_MODERATOR_PROMPT
        .replace('{researchGoal}', researchGoal)
        .replace('{discussionGuide}', discussionGuide)
        .replace('{participantNamesString}', participantNamesString)
        .replace('{transcriptString}', transcript.length > 0 ? transcriptString : "The focus group has not started yet.")
        .replace('{conversationDynamicsContext}', dynamicsContext) + stageContext;

    try {
        const stream = await openaiInstance.chat.completions.create({
            model: OPENAI_MODEL_NAME,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.6, // Lower temperature for more consistent, professional moderation
            stream: true
        });
        
        let firstChunk = true;
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                let text = content;
                if (firstChunk) {
                    // Clean up any formatting artifacts
                    if (text.toLowerCase().startsWith("moderator's next utterance:")) {
                        text = text.substring("moderator's next utterance:".length).trimStart();
                    }
                    if (text.toLowerCase().startsWith("moderator:")) {
                        text = text.substring("moderator:".length).trimStart();
                    }
                    if (text.startsWith("**")) {
                        text = text.replace(/^\*\*[^*]+\*\*:?\s*/, '');
                    }
                    firstChunk = false;
                }
                yield text;
            }
        }
    } catch (error) {
        throw handleOpenAIApiError(error, "streaming AI moderator action");
    }
}

export function resetConversationEngine(topic?: string): void {
    // Clear all conversation state
    if (topic) {
        localStorage.removeItem(`conversation_initialized_${topic}`);
        // Clear all stance data for this topic
        Object.keys(localStorage).forEach(key => {
            if (key.includes(`stance_`) && key.includes(`_${topic}`)) {
                localStorage.removeItem(key);
            }
        });
    } else {
        // Clear all conversation-related localStorage
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('conversation_initialized_') || 
                key.startsWith('stance_') || 
                key.includes('PersonaContext') ||
                key.includes('InterventionContext')) {
                localStorage.removeItem(key);
            }
        });
    }
    
    console.log('Conversation engine reset for', topic || 'all topics');
}

export function getConversationEngineStatus(): {
    isActive: boolean;
    currentTopics: string[];
    activeStances: number;
} {
    const conversationKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('conversation_initialized_')
    );
    
    const currentTopics = conversationKeys.map(key => 
        key.replace('conversation_initialized_', '')
    );
    
    const stanceKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('stance_')
    );
    
    return {
        isActive: conversationKeys.length > 0,
        currentTopics,
        activeStances: stanceKeys.length
    };
}