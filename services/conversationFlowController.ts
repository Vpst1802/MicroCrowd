import { PersonaProfile, SimulationTurn } from '../types';

export interface ConversationState {
  topic: string;
  subtopicDepth: number;
  energyLevel: 'high' | 'medium' | 'low';
  participationBalance: 'balanced' | 'dominated' | 'silent';
  agreementLevel: 'high_consensus' | 'mixed' | 'polarized';
  stagnation: boolean;
  currentFocus: string;
  timeElapsed: number; // minutes
}

export interface FlowRecommendation {
  action: 'continue' | 'probe_deeper' | 'change_subtopic' | 'change_topic' | 'balance_participation' | 'inject_energy';
  reason: string;
  suggestedIntervention?: string;
  targetPersona?: string;
  priority: 'low' | 'medium' | 'high';
}

export class ConversationFlowController {
  private conversationState: ConversationState;
  private participationHistory: Map<string, number[]> = new Map(); // Track turns per time period
  private topicHistory: string[] = [];
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
    this.conversationState = {
      topic: '',
      subtopicDepth: 0,
      energyLevel: 'medium',
      participationBalance: 'balanced',
      agreementLevel: 'mixed',
      stagnation: false,
      currentFocus: '',
      timeElapsed: 0
    };
  }

  shouldContinueTopic(conversationState: SimulationTurn[], currentTopic: string): boolean {
    this.updateConversationState(conversationState, currentTopic);
    
    // Continue if we haven't explored deeply enough
    if (this.conversationState.subtopicDepth < 2) return true;
    
    // Continue if energy is high and participation is balanced
    if (this.conversationState.energyLevel === 'high' && 
        this.conversationState.participationBalance === 'balanced') return true;
    
    // Don't continue if stagnated or too much consensus
    if (this.conversationState.stagnation || 
        this.conversationState.agreementLevel === 'high_consensus') return false;
    
    // Continue if discussion is polarized (productive disagreement)
    if (this.conversationState.agreementLevel === 'polarized') return true;
    
    // Default to continuing for a reasonable time
    return this.conversationState.timeElapsed < 10; // 10 minutes per topic max
  }

  triggerTopicShift(currentEnergyLevel: number, participantEngagement: Map<string, number>): {
    shouldShift: boolean;
    reason: string;
    newTopicSuggestion?: string;
  } {
    const avgEngagement = Array.from(participantEngagement.values())
      .reduce((sum, engagement) => sum + engagement, 0) / participantEngagement.size;

    // Shift if energy is too low
    if (currentEnergyLevel < 0.3 && avgEngagement < 0.4) {
      return {
        shouldShift: true,
        reason: 'Low energy and engagement levels',
        newTopicSuggestion: 'More engaging or personal topic'
      };
    }

    // Shift if stagnated
    if (this.conversationState.stagnation) {
      return {
        shouldShift: true,
        reason: 'Conversation has stagnated',
        newTopicSuggestion: 'Related but fresh perspective'
      };
    }

    // Shift if too much consensus without depth
    if (this.conversationState.agreementLevel === 'high_consensus' && 
        this.conversationState.subtopicDepth < 2) {
      return {
        shouldShift: true,
        reason: 'Superficial consensus reached',
        newTopicSuggestion: 'More controversial or nuanced aspect'
      };
    }

    // Shift if discussion has gone on too long
    if (this.conversationState.timeElapsed > 15) {
      return {
        shouldShift: true,
        reason: 'Topic has been exhausted',
        newTopicSuggestion: 'Next planned discussion topic'
      };
    }

    return { shouldShift: false, reason: 'Topic still productive' };
  }

  manageParticipationBalance(speakerTurnCounts: Map<string, number>, participants: PersonaProfile[]): FlowRecommendation[] {
    const recommendations: FlowRecommendation[] = [];
    const totalTurns = Array.from(speakerTurnCounts.values()).reduce((sum, count) => sum + count, 0);
    const avgTurns = totalTurns / participants.length;

    // Identify dominant and quiet participants
    const dominators: string[] = [];
    const quietParticipants: string[] = [];

    participants.forEach(participant => {
      const turnCount = speakerTurnCounts.get(participant.name) || 0;
      
      if (turnCount > avgTurns * 1.5) {
        dominators.push(participant.name);
      } else if (turnCount < avgTurns * 0.5) {
        quietParticipants.push(participant.name);
      }
    });

    // Generate recommendations for balance
    if (dominators.length > 0 && quietParticipants.length > 0) {
      recommendations.push({
        action: 'balance_participation',
        reason: `${dominators.join(', ')} dominating while ${quietParticipants.join(', ')} are quiet`,
        suggestedIntervention: `Gently redirect to quieter participants: "${quietParticipants[0]}, what's your experience with this?"`,
        targetPersona: quietParticipants[0],
        priority: 'medium'
      });
    }

    // Special handling for very quiet participants
    if (quietParticipants.length > participants.length / 2) {
      recommendations.push({
        action: 'inject_energy',
        reason: 'Too many participants are withdrawn',
        suggestedIntervention: 'Ask a more engaging or personal question to revitalize discussion',
        priority: 'high'
      });
    }

    return recommendations;
  }

  analyzeConversationFlow(conversationHistory: SimulationTurn[], participants: PersonaProfile[]): FlowRecommendation[] {
    const recommendations: FlowRecommendation[] = [];
    
    // Update state
    this.updateConversationState(conversationHistory, this.conversationState.topic);
    
    // Check for stagnation
    if (this.detectStagnation(conversationHistory)) {
      recommendations.push({
        action: 'change_subtopic',
        reason: 'Conversation showing signs of stagnation',
        suggestedIntervention: 'Introduce a new angle or ask for specific examples',
        priority: 'high'
      });
    }

    // Check energy levels
    if (this.conversationState.energyLevel === 'low') {
      recommendations.push({
        action: 'inject_energy',
        reason: 'Low energy detected in responses',
        suggestedIntervention: 'Ask a provocative question or introduce a scenario',
        priority: 'medium'
      });
    }

    // Check agreement levels
    if (this.conversationState.agreementLevel === 'high_consensus') {
      recommendations.push({
        action: 'probe_deeper',
        reason: 'Too much agreement - may be superficial',
        suggestedIntervention: 'Challenge the consensus: "Does everyone really feel the same way?"',
        priority: 'medium'
      });
    }

    // Check participation balance
    const turnCounts = this.calculateTurnCounts(conversationHistory, participants);
    const balanceRecommendations = this.manageParticipationBalance(turnCounts, participants);
    recommendations.push(...balanceRecommendations);

    // Check topic depth
    if (this.conversationState.subtopicDepth < 1 && conversationHistory.length > 8) {
      recommendations.push({
        action: 'probe_deeper',
        reason: 'Discussion remaining surface-level',
        suggestedIntervention: 'Ask for specific examples or personal experiences',
        priority: 'medium'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private updateConversationState(conversationHistory: SimulationTurn[], currentTopic: string): void {
    const now = new Date();
    this.conversationState.timeElapsed = (now.getTime() - this.startTime.getTime()) / (1000 * 60);
    this.conversationState.topic = currentTopic;
    
    // Update energy level
    this.conversationState.energyLevel = this.calculateEnergyLevel(conversationHistory);
    
    // Update participation balance
    this.conversationState.participationBalance = this.calculateParticipationBalance(conversationHistory);
    
    // Update agreement level
    this.conversationState.agreementLevel = this.calculateAgreementLevel(conversationHistory);
    
    // Update subtopic depth
    this.conversationState.subtopicDepth = this.calculateSubtopicDepth(conversationHistory);
    
    // Update stagnation status
    this.conversationState.stagnation = this.detectStagnation(conversationHistory);
    
    // Update current focus
    this.conversationState.currentFocus = this.identifyCurrentFocus(conversationHistory);
  }

  private calculateEnergyLevel(conversationHistory: SimulationTurn[]): 'high' | 'medium' | 'low' {
    const recentTurns = conversationHistory.slice(-5);
    const avgLength = recentTurns.reduce((sum, turn) => sum + turn.text.length, 0) / recentTurns.length;
    
    // Count energy indicators
    const energyIndicators = ['!', 'really', 'absolutely', 'definitely', 'passionate', 'excited'];
    const energyCount = recentTurns.reduce((count, turn) => {
      return count + energyIndicators.filter(indicator => 
        turn.text.toLowerCase().includes(indicator)
      ).length;
    }, 0);

    if (avgLength > 100 && energyCount > 3) return 'high';
    if (avgLength > 50 && energyCount > 1) return 'medium';
    return 'low';
  }

  private calculateParticipationBalance(conversationHistory: SimulationTurn[]): 'balanced' | 'dominated' | 'silent' {
    const recentTurns = conversationHistory.slice(-8).filter(turn => turn.speaker !== 'Moderator');
    const speakerCounts = new Map<string, number>();
    
    recentTurns.forEach(turn => {
      speakerCounts.set(turn.speaker, (speakerCounts.get(turn.speaker) || 0) + 1);
    });

    const speakers = Array.from(speakerCounts.keys());
    const counts = Array.from(speakerCounts.values());
    
    if (speakers.length === 0) return 'silent';
    
    const maxCount = Math.max(...counts);
    const avgCount = counts.reduce((sum, count) => sum + count, 0) / counts.length;
    
    if (maxCount > avgCount * 2) return 'dominated';
    if (speakers.length >= 2 && counts.every(count => Math.abs(count - avgCount) <= 1)) return 'balanced';
    
    return 'silent';
  }

  private calculateAgreementLevel(conversationHistory: SimulationTurn[]): 'high_consensus' | 'mixed' | 'polarized' {
    const recentTurns = conversationHistory.slice(-6);
    
    const agreementWords = ['agree', 'exactly', 'yes', 'right', 'absolutely', 'definitely'];
    const disagreementWords = ['disagree', 'no', 'wrong', 'but', 'however', 'actually'];
    
    let agreementCount = 0;
    let disagreementCount = 0;
    
    recentTurns.forEach(turn => {
      const text = turn.text.toLowerCase();
      agreementCount += agreementWords.filter(word => text.includes(word)).length;
      disagreementCount += disagreementWords.filter(word => text.includes(word)).length;
    });

    const total = agreementCount + disagreementCount;
    if (total === 0) return 'mixed';
    
    const agreementRatio = agreementCount / total;
    
    if (agreementRatio > 0.7) return 'high_consensus';
    if (agreementRatio < 0.3) return 'polarized';
    return 'mixed';
  }

  private calculateSubtopicDepth(conversationHistory: SimulationTurn[]): number {
    // Simple heuristic: count how many times the conversation has gone deeper
    const depthIndicators = ['because', 'specifically', 'for example', 'in particular', 'let me explain'];
    
    return conversationHistory.slice(-10).reduce((depth, turn) => {
      const hasDepthIndicator = depthIndicators.some(indicator => 
        turn.text.toLowerCase().includes(indicator)
      );
      return hasDepthIndicator ? depth + 0.5 : depth;
    }, 0);
  }

  private detectStagnation(conversationHistory: SimulationTurn[]): boolean {
    const recentTurns = conversationHistory.slice(-6);
    
    // Check for repetitive content
    const uniqueContent = new Set(recentTurns.map(turn => 
      turn.text.toLowerCase().replace(/[^a-z\s]/g, '').trim()
    ));
    
    if (uniqueContent.size < recentTurns.length * 0.7) return true;
    
    // Check for very short responses
    const avgLength = recentTurns.reduce((sum, turn) => sum + turn.text.length, 0) / recentTurns.length;
    if (avgLength < 30) return true;
    
    // Check for lack of engagement markers
    const engagementMarkers = ['?', '!', 'why', 'how', 'what', 'really', 'interesting'];
    const engagementCount = recentTurns.reduce((count, turn) => {
      return count + engagementMarkers.filter(marker => 
        turn.text.toLowerCase().includes(marker)
      ).length;
    }, 0);
    
    return engagementCount < 2;
  }

  private identifyCurrentFocus(conversationHistory: SimulationTurn[]): string {
    const recentContent = conversationHistory.slice(-3)
      .map(turn => turn.text)
      .join(' ')
      .toLowerCase();
    
    // Extract key themes from recent content
    const words = recentContent.split(/\s+/)
      .filter(word => word.length > 4)
      .filter(word => !['this', 'that', 'with', 'they', 'their', 'there', 'where', 'when'].includes(word));
    
    const wordFreq = words.reduce((freq, word) => {
      freq[word] = (freq[word] || 0) + 1;
      return freq;
    }, {} as Record<string, number>);
    
    const topWord = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)[0];
    
    return topWord ? topWord[0] : 'general discussion';
  }

  private calculateTurnCounts(conversationHistory: SimulationTurn[], participants: PersonaProfile[]): Map<string, number> {
    const turnCounts = new Map<string, number>();
    
    participants.forEach(participant => {
      const count = conversationHistory.filter(turn => turn.speaker === participant.name).length;
      turnCounts.set(participant.name, count);
    });
    
    return turnCounts;
  }

  resetConversation(newTopic: string): void {
    this.startTime = new Date();
    this.participationHistory.clear();
    this.topicHistory = [];
    this.conversationState = {
      topic: newTopic,
      subtopicDepth: 0,
      energyLevel: 'medium',
      participationBalance: 'balanced',
      agreementLevel: 'mixed',
      stagnation: false,
      currentFocus: '',
      timeElapsed: 0
    };
  }
}

export const conversationFlowController = new ConversationFlowController();