import { PersonaProfile, SimulationTurn } from '../types';
import { conversationTracker } from './conversationTracker';
import { behaviorStateTracker } from './behaviorStateTracker';

export interface ConversationState {
  speakers: Map<string, PersonaProfile>;
  statements: Map<string, SimulationTurn[]>;
  turnHistory: SimulationTurn[];
  currentTurn: number;
  activeStances: Map<string, any>;
  behaviorStates: Map<string, any>;
}

export class ConversationStateManager {
  private state: ConversationState;

  constructor() {
    this.state = {
      speakers: new Map(),
      statements: new Map(),
      turnHistory: [],
      currentTurn: 0,
      activeStances: new Map(),
      behaviorStates: new Map()
    };
  }

  initializeConversation(personas: PersonaProfile[]): void {
    // Initialize speakers
    personas.forEach(persona => {
      this.state.speakers.set(persona.name, persona);
      this.state.statements.set(persona.name, []);
    });

    // Reset trackers
    conversationTracker.reset();
    behaviorStateTracker.resetConversation();

    console.log(`Conversation state initialized with ${personas.length} personas`);
  }

  addStatement(speaker: string, content: string, turn?: number): SimulationTurn {
    const statement: SimulationTurn = {
      speaker,
      text: content,
      timestamp: new Date().toISOString(),
      turn_number: turn || this.state.currentTurn++
    };

    // Update state
    this.state.turnHistory.push(statement);
    
    const speakerStatements = this.state.statements.get(speaker) || [];
    speakerStatements.push(statement);
    this.state.statements.set(speaker, speakerStatements);

    // Update trackers
    conversationTracker.addTurn(statement);
    behaviorStateTracker.updateTurnHistory(statement);

    return statement;
  }

  validateReference(speaker: string, reference: string, referencedSpeaker: string): {
    isValid: boolean;
    correction?: string;
    exactQuote?: string;
  } {
    const validation = conversationTracker.validateReference(speaker, reference, referencedSpeaker);
    
    if (!validation.isValid) {
      // Suggest available references
      const availableRefs = conversationTracker.getAvailableReferences(speaker, reference);
      if (availableRefs.length > 0) {
        return {
          isValid: false,
          correction: `Try referencing: "${availableRefs[0].statement}"`
        };
      }
    }

    return {
      isValid: validation.isValid,
      exactQuote: validation.exactQuote
    };
  }

  getConversationHistory(limit?: number): SimulationTurn[] {
    if (limit) {
      return this.state.turnHistory.slice(-limit);
    }
    return [...this.state.turnHistory];
  }

  getSpeakerStatements(speaker: string): SimulationTurn[] {
    return this.state.statements.get(speaker) || [];
  }

  getParticipationStats(): { [speaker: string]: number } {
    const stats: { [speaker: string]: number } = {};
    
    this.state.speakers.forEach((persona, name) => {
      stats[name] = this.state.statements.get(name)?.length || 0;
    });

    return stats;
  }

  analyzeConversationFlow(): {
    totalTurns: number;
    avgTurnsPerSpeaker: number;
    dominantSpeakers: string[];
    quietSpeakers: string[];
    consensusLevel: number;
  } {
    const participationStats = this.getParticipationStats();
    const totalTurns = Object.values(participationStats).reduce((sum, count) => sum + count, 0);
    const speakers = Object.keys(participationStats);
    const avgTurns = totalTurns / speakers.length;

    const dominantSpeakers = speakers.filter(speaker => 
      participationStats[speaker] > avgTurns * 1.5
    );

    const quietSpeakers = speakers.filter(speaker => 
      participationStats[speaker] < avgTurns * 0.5
    );

    // Simple consensus analysis
    const recentTurns = this.state.turnHistory.slice(-6);
    const agreementWords = ['agree', 'exactly', 'yes', 'right', 'absolutely'];
    const disagreementWords = ['disagree', 'no', 'wrong', 'but', 'however'];
    
    let agreementCount = 0;
    let disagreementCount = 0;
    
    recentTurns.forEach(turn => {
      const text = turn.text.toLowerCase();
      agreementWords.forEach(word => {
        if (text.includes(word)) agreementCount++;
      });
      disagreementWords.forEach(word => {
        if (text.includes(word)) disagreementCount++;
      });
    });

    const totalSentiment = agreementCount + disagreementCount;
    const consensusLevel = totalSentiment > 0 ? agreementCount / totalSentiment : 0.5;

    return {
      totalTurns,
      avgTurnsPerSpeaker: avgTurns,
      dominantSpeakers,
      quietSpeakers,
      consensusLevel
    };
  }

  exportConversationData(): {
    conversation: SimulationTurn[];
    participants: PersonaProfile[];
    analytics: any;
    duration: number;
  } {
    const startTime = this.state.turnHistory[0]?.timestamp;
    const endTime = this.state.turnHistory[this.state.turnHistory.length - 1]?.timestamp;
    
    let duration = 0;
    if (startTime && endTime) {
      duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    }

    return {
      conversation: this.getConversationHistory(),
      participants: Array.from(this.state.speakers.values()),
      analytics: this.analyzeConversationFlow(),
      duration
    };
  }

  reset(): void {
    this.state = {
      speakers: new Map(),
      statements: new Map(),
      turnHistory: [],
      currentTurn: 0,
      activeStances: new Map(),
      behaviorStates: new Map()
    };

    conversationTracker.reset();
    behaviorStateTracker.resetConversation();
  }
}

export const conversationStateManager = new ConversationStateManager();