import { PersonaProfile, SimulationTurn } from '../types';
import { conversationTracker, ValidationResult } from './conversationTracker';
import { controversyStanceAssigner, AssignedStance } from './controversyStanceAssigner';
import { responseStyleManager, PersonaResponseStyle } from './responseStyleManager';
import { behaviorStateTracker, BehaviorState } from './behaviorStateTracker';
import { conversationFlowController, FlowRecommendation } from './conversationFlowController';
import { disagreementEnforcer, DisagreementInjection } from './disagreementEnforcer';

export interface ConversationContext {
  topic: string;
  researchGoal: string;
  participants: PersonaProfile[];
  conversationHistory: SimulationTurn[];
  assignedStances: Map<PersonaProfile, AssignedStance>;
  personaStyles: Map<string, PersonaResponseStyle>;
  currentPersona: PersonaProfile;
}

export interface ResponseGeneration {
  shouldProceed: boolean;
  validationIssues: string[];
  enhancedPrompt: string;
  responseModifiers: {
    emotionalIntensity: 'low' | 'medium' | 'high';
    responseLength: 'short' | 'medium' | 'long';
    agreementTendency: 'disagreeable' | 'neutral' | 'agreeable';
    forceDisagreement: boolean;
    disagreementPrompt?: string;
  };
}

export class ConversationOrchestrator {
  private isInitialized = false;

  initializeConversation(
    topic: string,
    participants: PersonaProfile[],
    researchGoal: string
  ): void {
    // Reset all services
    conversationTracker.reset();
    conversationFlowController.resetConversation(topic);
    behaviorStateTracker.resetConversation();
    responseStyleManager.clearPersonaStyles();

    // Initialize behavior tracking for all participants
    participants.forEach(persona => {
      behaviorStateTracker.initializePersonaBehavior(persona);
      responseStyleManager.generatePersonaStyle(persona);
    });

    // Assign controversial stances for disagreement
    const assignedStances = controversyStanceAssigner.assignPoliticalPositions(participants, topic);
    
    // Store stances in localStorage for persistence during conversation
    participants.forEach(persona => {
      const stance = assignedStances.get(persona);
      if (stance) {
        localStorage.setItem(`stance_${persona.name}_${topic}`, JSON.stringify(stance));
      }
    });

    this.isInitialized = true;
  }

  preparePersonaResponse(
    persona: PersonaProfile,
    topic: string,
    conversationHistory: SimulationTurn[],
    latestStatement: string,
    allParticipants: PersonaProfile[]
  ): ResponseGeneration {
    if (!this.isInitialized) {
      throw new Error('Conversation orchestrator not initialized. Call initializeConversation first.');
    }

    const validationIssues: string[] = [];
    let shouldProceed = true;

    // Update conversation tracker
    conversationHistory.forEach(turn => {
      conversationTracker.addTurn(turn);
      behaviorStateTracker.updateTurnHistory(turn);
    });

    // Update behavior state
    behaviorStateTracker.updateEmotionalState(persona, conversationHistory);

    // Get current behavior modifiers
    const behaviorModifiers = behaviorStateTracker.getBehaviorModifiers(persona.id);

    // Check for disagreement injection needs
    const assignedStances = this.loadAssignedStances(allParticipants, topic);
    const disagreementInjection = disagreementEnforcer.injectDisagreement(
      allParticipants,
      conversationHistory.slice(-5),
      assignedStances,
      topic
    );

    // Check if this persona should be forced to disagree
    let forceDisagreement = false;
    let disagreementPrompt = '';
    
    if (disagreementInjection && disagreementInjection.targetPersona.id === persona.id) {
      forceDisagreement = true;
      disagreementPrompt = disagreementInjection.disagreementPrompt;
    }

    // Get conversation flow recommendations
    const flowRecommendations = conversationFlowController.analyzeConversationFlow(
      conversationHistory,
      allParticipants
    );

    // Build enhanced prompt with all context
    const enhancedPrompt = this.buildEnhancedPrompt(
      persona,
      topic,
      conversationHistory,
      latestStatement,
      allParticipants,
      assignedStances,
      behaviorModifiers,
      forceDisagreement,
      disagreementPrompt
    );

    return {
      shouldProceed,
      validationIssues,
      enhancedPrompt,
      responseModifiers: {
        emotionalIntensity: behaviorModifiers.emotionalIntensity,
        responseLength: behaviorModifiers.responseLength,
        agreementTendency: behaviorModifiers.agreementTendency,
        forceDisagreement,
        disagreementPrompt: forceDisagreement ? disagreementPrompt : undefined
      }
    };
  }

  validateAndProcessResponse(
    persona: PersonaProfile,
    generatedResponse: string,
    conversationHistory: SimulationTurn[]
  ): {
    isValid: boolean;
    processedResponse: string;
    validationIssues: string[];
  } {
    const validationIssues: string[] = [];

    // Detect invalid references
    const referenceIssues = conversationTracker.detectInvalidReferences(generatedResponse, persona.name);
    validationIssues.push(...referenceIssues);

    // Apply persona-specific linguistic patterns
    let processedResponse = responseStyleManager.varyLinguisticPatterns(persona, generatedResponse);

    // Remove shared template patterns if detected
    processedResponse = this.removeSharedPatterns(processedResponse);

    return {
      isValid: validationIssues.length === 0,
      processedResponse,
      validationIssues
    };
  }

  shouldPersonaInterrupt(
    persona: PersonaProfile,
    currentSpeaker: string,
    statementContent: string
  ): {
    shouldInterrupt: boolean;
    interruptionText?: string;
  } {
    const interruptionTrigger = behaviorStateTracker.shouldInterrupt(
      persona,
      currentSpeaker,
      statementContent
    );

    if (interruptionTrigger.shouldInterrupt) {
      const assignedStance = this.getPersonaStance(persona);
      let interruptionText = '';

      if (assignedStance && interruptionTrigger.interruptionStyle === 'passionate') {
        interruptionText = `[INTERRUPTS] ${controversyStanceAssigner.generateDisagreementResponse(
          persona,
          statementContent,
          assignedStance
        )}`;
      } else {
        interruptionText = `[INTERRUPTS] ${this.generateGenericInterruption(persona, interruptionTrigger.interruptionStyle || 'polite')}`;
      }

      return {
        shouldInterrupt: true,
        interruptionText
      };
    }

    return { shouldInterrupt: false };
  }

  getConversationInsights(conversationHistory: SimulationTurn[], participants: PersonaProfile[]): {
    flowRecommendations: FlowRecommendation[];
    participationBalance: { [name: string]: number };
    consensusLevel: number;
    topicSuggestions: string[];
  } {
    const flowRecommendations = conversationFlowController.analyzeConversationFlow(
      conversationHistory,
      participants
    );

    const participationBalance: { [name: string]: number } = {};
    participants.forEach(participant => {
      participationBalance[participant.name] = conversationTracker.getParticipantTurnCount(participant.name);
    });

    const recentTurns = conversationHistory.slice(-5);
    const disagreementAnalysis = disagreementEnforcer.requiresDisagreement('general', recentTurns);
    
    return {
      flowRecommendations,
      participationBalance,
      consensusLevel: disagreementAnalysis.consensusLevel,
      topicSuggestions: this.generateTopicSuggestions(conversationHistory)
    };
  }

  private buildEnhancedPrompt(
    persona: PersonaProfile,
    topic: string,
    conversationHistory: SimulationTurn[],
    latestStatement: string,
    allParticipants: PersonaProfile[],
    assignedStances: Map<PersonaProfile, AssignedStance>,
    behaviorModifiers: any,
    forceDisagreement: boolean,
    disagreementPrompt: string
  ): string {
    let prompt = '';

    // If forced disagreement, use disagreement prompt
    if (forceDisagreement) {
      prompt = disagreementPrompt + '\n\n';
    }

    // Add persona identity
    const personaStance = assignedStances.get(persona);
    if (personaStance) {
      prompt += `ASSIGNED CONTROVERSIAL STANCE:\nPosition: ${personaStance.stance.position}\n`;
      prompt += `Key Arguments: ${personaStance.stance.arguments.join(', ')}\n`;
      prompt += `Emotional Investment: ${personaStance.emotionalInvestment > 0.7 ? 'HIGH' : 'MODERATE'}\n\n`;
    }

    // Add behavior state context
    const behaviorState = behaviorStateTracker.getPersonaBehaviorState(persona.id);
    if (behaviorState) {
      prompt += `CURRENT EMOTIONAL STATE:\n`;
      prompt += `Energy: ${Math.round(behaviorState.emotionalState.energy * 100)}%\n`;
      prompt += `Engagement: ${Math.round(behaviorState.emotionalState.engagement * 100)}%\n`;
      prompt += `Frustration: ${Math.round(behaviorState.emotionalState.frustration * 100)}%\n`;
      prompt += `Participation Pattern: ${behaviorState.participationPattern}\n\n`;
    }

    // Add conversation validation context
    const availableReferences = conversationTracker.getAvailableReferences(persona.name, topic);
    if (availableReferences.length > 0) {
      prompt += `AVAILABLE REFERENCES (use ONLY these if referencing others):\n`;
      availableReferences.slice(0, 3).forEach(ref => {
        prompt += `- ${ref.speaker}: "${ref.statement}"\n`;
      });
      prompt += '\n';
    }

    // Add response style context
    const personaStyle = responseStyleManager.getResponseTemplate(persona.id, 'normal', behaviorModifiers.emotionalIntensity === 'high' ? 1 : 0.5);
    prompt += `YOUR SPEAKING STYLE: ${personaStyle.vocabularyLevel} vocabulary, ${personaStyle.responseLength} responses, ${personaStyle.emotionalExpression} emotional expression\n\n`;

    // Add mandatory rules
    prompt += `MANDATORY CONVERSATION RULES:
1. ONLY reference participants who have actually spoken: ${allParticipants.map(p => p.name).join(', ')}
2. If referencing someone, quote their exact words or clearly state you don't recall
3. Express your assigned stance authentically - no artificial consensus
4. Match your current emotional state and behavior pattern
5. Use your personal speaking style and vocabulary level\n\n`;

    prompt += `Current stimulus: "${latestStatement}"\n`;
    prompt += `Your response should be ${behaviorModifiers.responseLength} and ${behaviorModifiers.emotionalIntensity} intensity.`;

    return prompt;
  }

  private loadAssignedStances(participants: PersonaProfile[], topic: string): Map<PersonaProfile, AssignedStance> {
    const stances = new Map<PersonaProfile, AssignedStance>();
    
    participants.forEach(persona => {
      const stanceData = localStorage.getItem(`stance_${persona.name}_${topic}`);
      if (stanceData) {
        try {
          const stance = JSON.parse(stanceData);
          stances.set(persona, stance);
        } catch (e) {
          console.warn(`Failed to load stance for ${persona.name}:`, e);
        }
      }
    });

    return stances;
  }

  private getPersonaStance(persona: PersonaProfile): AssignedStance | null {
    // Try to load from current conversation context or localStorage
    // This is a simplified version - in practice, you'd need to track the current topic
    const stanceKeys = Object.keys(localStorage).filter(key => key.startsWith(`stance_${persona.name}_`));
    
    if (stanceKeys.length > 0) {
      try {
        return JSON.parse(localStorage.getItem(stanceKeys[0]) || '{}');
      } catch (e) {
        return null;
      }
    }
    
    return null;
  }

  private removeSharedPatterns(response: string): string {
    // Remove common shared template patterns
    const sharedPatterns = [
      /When I was living in .+?\.\.\. \.\.\.which reminds me of .+?/gi,
      /Um, yeah, I totally agree/gi,
      /I think earlier/gi,
      /Like someone mentioned/gi,
      /As was discussed/gi
    ];

    let cleaned = response;
    sharedPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    return cleaned.trim();
  }

  private generateGenericInterruption(persona: PersonaProfile, style: string): string {
    const interruptions = {
      polite: ["Excuse me, but", "If I may", "Sorry to interrupt, but"],
      aggressive: ["Wait, that's wrong", "No, that's not right", "Actually"],
      passionate: ["Hold on!", "Wait a minute!", "I have to say something"]
    };

    const options = interruptions[style as keyof typeof interruptions] || interruptions.polite;
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateTopicSuggestions(conversationHistory: SimulationTurn[]): string[] {
    // Analyze conversation for potential new topics
    const recentContent = conversationHistory.slice(-10).map(turn => turn.text).join(' ');
    
    // Simple keyword-based topic suggestions
    const suggestions = [];
    
    if (recentContent.toLowerCase().includes('work') || recentContent.toLowerCase().includes('job')) {
      suggestions.push('workplace experiences and challenges');
    }
    
    if (recentContent.toLowerCase().includes('family') || recentContent.toLowerCase().includes('children')) {
      suggestions.push('family dynamics and parenting approaches');
    }
    
    if (recentContent.toLowerCase().includes('technology') || recentContent.toLowerCase().includes('digital')) {
      suggestions.push('technology adoption and digital privacy');
    }
    
    return suggestions;
  }
}

export const conversationOrchestrator = new ConversationOrchestrator();