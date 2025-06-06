import OpenAI from 'openai';
import { PartialPersonaProfile, PersonaProfile, SimulationTurn } from "../types";
import { 
    OPENAI_MODEL_NAME, 
    PERSONA_GENERATION_PROMPT_CONTEXT_FOR_CSV,
    SIMULATION_RESPONSE_PROMPT,
    AI_MODERATOR_PROMPT
} from "../constants";

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
    latestQuestionOrStatement: string
): AsyncGenerator<string, void, undefined> {
    const openaiInstance = getOpenAIInstance();

    // Create rich persona context for authentic responses
    const personaProfileString = JSON.stringify({
        name: persona.name,
        age: persona.age,
        gender: persona.gender,
        location: persona.location,
        occupation: persona.occupation,
        personality: persona.personality,
        preferences: persona.preferences,
        behaviors: persona.behaviors,
        goals: persona.goals,
        background: persona.background,
        generatedSummary: persona.generatedSummary
    }, null, 2);

    const recentHistory = conversationHistory.slice(-5);
    const conversationHistoryString = recentHistory
        .map(turn => `${turn.speaker}: ${turn.text}`)
        .join('\n');

    const prompt = SIMULATION_RESPONSE_PROMPT
        .replace('{personaName}', persona.name)
        .replace('{personaProfileString}', personaProfileString)
        .replace('{simulationTopic}', simulationTopic)
        .replace('{latestQuestionOrStatement}', latestQuestionOrStatement)
        .replace('{extraversion}', persona.personality.extraversion.toString());
    
    try {
        // Adjust temperature based on personality for more natural variation
        const baseTemp = 0.9;
        const personalityVariation = (persona.personality.openness - 3) * 0.1; // More open = more creative responses
        const extraversionVariation = (persona.personality.extraversion - 3) * 0.05; // More extroverted = more varied responses
        const finalTemp = Math.max(0.7, Math.min(1.2, baseTemp + personalityVariation + extraversionVariation));

        const stream = await openaiInstance.chat.completions.create({
            model: OPENAI_MODEL_NAME,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: finalTemp,
            max_tokens: 150, // Limit response length to encourage brevity
            stream: true
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                yield content;
            }
        }

    } catch (error) {
        throw handleOpenAIApiError(error, `streaming simulation response for ${persona.name}`);
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
    
    // Add context about discussion stage and guide progress
    let stageContext = '';
    if (turnCount === 0) {
        stageContext = '\n\nCONTEXT: This is the very beginning. Start with a warm welcome and introduce the FIRST topic from your discussion guide exactly as written.';
    } else if (turnCount < 3) {
        stageContext = '\n\nCONTEXT: Early stage - stay focused on the FIRST topic from your discussion guide. Probe deeper with follow-up questions before moving on.';
    } else {
        const topicsExplored = Math.floor(turnCount / 2); // Rough estimate of topics covered
        if (topicsExplored < discussionGuideLines.length) {
            stageContext = `\n\nCONTEXT: Discussion turn ${turnCount + 1}. You've covered roughly ${topicsExplored} topics. Focus on the NEXT unaddressed topic from your discussion guide, or probe deeper on current topic if participants need more exploration.`;
        } else {
            stageContext = `\n\nCONTEXT: Discussion turn ${turnCount + 1}. You've covered most topics. Continue with remaining discussion guide items or probe for deeper insights on key topics.`;
        }
    }
    
    // Add specific instruction about guide adherence
    stageContext += '\n\nIMPORTANT: Your discussion guide is your script. Follow it line by line. Each topic/question in the guide should be addressed before moving to the next.';

    const prompt = AI_MODERATOR_PROMPT
        .replace('{researchGoal}', researchGoal)
        .replace('{discussionGuide}', discussionGuide)
        .replace('{participantNamesString}', participantNamesString)
        .replace('{transcriptString}', transcript.length > 0 ? transcriptString : "The focus group has not started yet.") + stageContext;

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