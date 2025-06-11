import { PersonaProfile, SimulationTurn } from '../types';
import { behaviorStateTracker } from './behaviorStateTracker';
import { conversationStateManager } from './conversationStateManager';

export interface TurnDecision {
  nextSpeaker: PersonaProfile;
  reason: 'natural_flow' | 'balance_needed' | 'interruption' | 'moderator_prompt';
  confidence: number;
  shouldModeratorIntervene: boolean;
}

export class TurnManager {
  private lastSpeaker?: string;
  private consecutiveTurns: Map<string, number> = new Map();
  private silentPersonas: Set<string> = new Set();

  decideNextSpeaker(
    conversationState: SimulationTurn[],
    personas: PersonaProfile[],
    currentTopic: string
  ): TurnDecision {
    const recentTurns = conversationState.slice(-3);
    const participationStats = conversationStateManager.getParticipationStats();
    
    // Check for interruption opportunities
    const interruptionCandidate = this.checkForInterruptions(personas, recentTurns);
    if (interruptionCandidate) {
      return {
        nextSpeaker: interruptionCandidate,
        reason: 'interruption',
        confidence: 0.8,
        shouldModeratorIntervene: false
      };
    }

    // Check participation balance
    const balanceCandidate = this.checkParticipationBalance(personas, participationStats);
    if (balanceCandidate) {
      return {
        nextSpeaker: balanceCandidate,
        reason: 'balance_needed',
        confidence: 0.7,
        shouldModeratorIntervene: true
      };
    }

    // Natural flow based on engagement
    const naturalCandidate = this.selectByEngagement(personas, currentTopic, recentTurns);
    if (naturalCandidate) {
      return {
        nextSpeaker: naturalCandidate,
        reason: 'natural_flow',
        confidence: 0.9,
        shouldModeratorIntervene: false
      };
    }

    // Fallback to least active
    const leastActive = this.selectLeastActive(personas, participationStats);
    return {
      nextSpeaker: leastActive,
      reason: 'balance_needed',
      confidence: 0.5,
      shouldModeratorIntervene: true
    };
  }

  handleInterruption(
    interruptingPersona: PersonaProfile,
    currentSpeaker: string,
    context: string
  ): {
    allowInterruption: boolean;
    interruptionStyle: 'polite' | 'aggressive' | 'passionate';
    interruptionText?: string;
  } {
    const behaviorState = behaviorStateTracker.getPersonaBehaviorState(interruptingPersona.id);
    
    if (!behaviorState) {
      return { allowInterruption: false, interruptionStyle: 'polite' };
    }

    // Calculate interruption probability
    let interruptionScore = 0;

    // Personality factors
    if (interruptingPersona.personality.extraversion >= 4) interruptionScore += 0.3;
    if (interruptingPersona.personality.agreeableness <= 2) interruptionScore += 0.2;

    // Emotional state factors
    if (behaviorState.emotionalState.frustration > 0.7) interruptionScore += 0.4;
    if (behaviorState.emotionalState.engagement > 0.8) interruptionScore += 0.3;

    // Topic relevance
    if (behaviorState.topicRelevanceScore > 0.8) interruptionScore += 0.2;

    // Determine style
    let style: 'polite' | 'aggressive' | 'passionate' = 'polite';
    if (behaviorState.emotionalState.frustration > 0.8) {
      style = 'aggressive';
    } else if (behaviorState.emotionalState.engagement > 0.8) {
      style = 'passionate';
    }

    const allowInterruption = interruptionScore > 0.6;

    let interruptionText;
    if (allowInterruption) {
      interruptionText = this.generateInterruptionText(interruptingPersona, style, context);
    }

    return {
      allowInterruption,
      interruptionStyle: style,
      interruptionText
    };
  }

  manageParticipationBalance(
    personas: PersonaProfile[],
    turnCounts: Map<string, number>
  ): {
    needsBalancing: boolean;
    encourageParticipation: string[];
    limitParticipation: string[];
    moderatorAction?: string;
  } {
    const totalTurns = Array.from(turnCounts.values()).reduce((sum, count) => sum + count, 0);
    const avgTurns = totalTurns / personas.length;

    const dominators = personas.filter(p => 
      (turnCounts.get(p.name) || 0) > avgTurns * 1.5
    ).map(p => p.name);

    const quietParticipants = personas.filter(p => 
      (turnCounts.get(p.name) || 0) < avgTurns * 0.5
    ).map(p => p.name);

    const needsBalancing = dominators.length > 0 && quietParticipants.length > 0;

    let moderatorAction;
    if (needsBalancing) {
      if (quietParticipants.length === 1) {
        moderatorAction = `${quietParticipants[0]}, I'd love to hear your thoughts on this.`;
      } else {
        moderatorAction = `Let's hear from some other perspectives. ${quietParticipants[0]} or ${quietParticipants[1]}, what do you think?`;
      }
    }

    return {
      needsBalancing,
      encourageParticipation: quietParticipants,
      limitParticipation: dominators,
      moderatorAction
    };
  }

  updateTurnHistory(speaker: string): void {
    this.lastSpeaker = speaker;
    
    // Update consecutive turns
    this.consecutiveTurns.set(speaker, (this.consecutiveTurns.get(speaker) || 0) + 1);
    
    // Reset other speakers' consecutive counts
    this.consecutiveTurns.forEach((count, speakerName) => {
      if (speakerName !== speaker) {
        this.consecutiveTurns.set(speakerName, 0);
      }
    });

    // Remove from silent list
    this.silentPersonas.delete(speaker);
  }

  private checkForInterruptions(
    personas: PersonaProfile[],
    recentTurns: SimulationTurn[]
  ): PersonaProfile | null {
    if (recentTurns.length === 0) return null;

    const lastTurn = recentTurns[recentTurns.length - 1];
    
    // Check each persona for interruption probability
    for (const persona of personas) {
      if (persona.name === lastTurn.speaker) continue; // Can't interrupt yourself

      const shouldInterrupt = behaviorStateTracker.shouldInterrupt(
        persona,
        lastTurn.speaker,
        lastTurn.text
      );

      if (shouldInterrupt.shouldInterrupt && shouldInterrupt.confidence > 0.7) {
        return persona;
      }
    }

    return null;
  }

  private checkParticipationBalance(
    personas: PersonaProfile[],
    participationStats: { [speaker: string]: number }
  ): PersonaProfile | null {
    const totalTurns = Object.values(participationStats).reduce((sum, count) => sum + count, 0);
    const avgTurns = totalTurns / personas.length;

    // Find personas who haven't participated enough
    const underParticipated = personas.filter(persona => 
      (participationStats[persona.name] || 0) < avgTurns * 0.5
    );

    if (underParticipated.length > 0) {
      // Prefer extroverted personas among the under-participated
      const extroverted = underParticipated.filter(p => p.personality.extraversion >= 3);
      return extroverted.length > 0 ? extroverted[0] : underParticipated[0];
    }

    return null;
  }

  private selectByEngagement(
    personas: PersonaProfile[],
    currentTopic: string,
    recentTurns: SimulationTurn[]
  ): PersonaProfile | null {
    // Score personas by engagement with current topic
    const engagementScores = personas.map(persona => {
      const behaviorState = behaviorStateTracker.getPersonaBehaviorState(persona.id);
      
      let score = 0;
      
      // Base personality engagement
      score += persona.personality.extraversion * 0.2;
      score += persona.personality.openness * 0.1;
      
      // Current emotional state
      if (behaviorState) {
        score += behaviorState.emotionalState.engagement * 0.4;
        score += behaviorState.topicRelevanceScore * 0.3;
      }

      // Recent participation (slight penalty for recent speakers)
      const recentSpeaker = recentTurns.find(turn => turn.speaker === persona.name);
      if (recentSpeaker) {
        score -= 0.2;
      }

      return { persona, score };
    });

    // Sort by engagement score
    engagementScores.sort((a, b) => b.score - a.score);

    // Return highest engaged persona (with some randomness)
    if (Math.random() < 0.8) {
      return engagementScores[0].persona;
    } else if (engagementScores.length > 1) {
      return engagementScores[1].persona;
    }

    return engagementScores[0].persona;
  }

  private selectLeastActive(
    personas: PersonaProfile[],
    participationStats: { [speaker: string]: number }
  ): PersonaProfile {
    let leastActive = personas[0];
    let lowestCount = participationStats[leastActive.name] || 0;

    for (const persona of personas) {
      const count = participationStats[persona.name] || 0;
      if (count < lowestCount) {
        leastActive = persona;
        lowestCount = count;
      }
    }

    return leastActive;
  }

  private generateInterruptionText(
    persona: PersonaProfile,
    style: 'polite' | 'aggressive' | 'passionate',
    context: string
  ): string {
    const interruptions = {
      polite: [
        "Sorry to interrupt, but",
        "If I may add",
        "Excuse me, I just wanted to say"
      ],
      aggressive: [
        "Wait, that's not right",
        "Hold on a second",
        "Actually, no"
      ],
      passionate: [
        "[INTERRUPTS] This is really important -",
        "[PASSIONATE] I have to say something about this",
        "[URGENT] Wait, we need to talk about"
      ]
    };

    const options = interruptions[style];
    return options[Math.floor(Math.random() * options.length)];
  }

  reset(): void {
    this.lastSpeaker = undefined;
    this.consecutiveTurns.clear();
    this.silentPersonas.clear();
  }
}

export const turnManager = new TurnManager();