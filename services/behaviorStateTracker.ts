import { PersonaProfile, SimulationTurn } from '../types';

export interface EmotionalState {
  energy: number; // 0-1 scale
  engagement: number; // 0-1 scale
  frustration: number; // 0-1 scale
  confidence: number; // 0-1 scale
  agreeableness: number; // 0-1 scale (can differ from base personality)
}

export interface BehaviorState {
  personaId: string;
  emotionalState: EmotionalState;
  turnsSinceLastSpoke: number;
  topicRelevanceScore: number;
  interruptionTendency: number;
  dominanceLevel: number;
  participationPattern: 'active' | 'moderate' | 'passive' | 'withdrawn';
  lastUpdated: string;
}

export interface InterruptionTrigger {
  shouldInterrupt: boolean;
  confidence: number;
  reason?: string;
  interruptionStyle?: 'aggressive' | 'polite' | 'passionate';
}

export class BehaviorStateTracker {
  private behaviorStates: Map<string, BehaviorState> = new Map();
  private conversationHistory: SimulationTurn[] = [];
  private conversationStartTime: string = new Date().toISOString();

  initializePersonaBehavior(persona: PersonaProfile): void {
    const initialState: BehaviorState = {
      personaId: persona.id,
      emotionalState: {
        energy: this.calculateInitialEnergy(persona),
        engagement: this.calculateInitialEngagement(persona),
        frustration: 0.1, // Start with minimal frustration
        confidence: this.calculateInitialConfidence(persona),
        agreeableness: persona.personality.agreeableness / 5 // Convert to 0-1 scale
      },
      turnsSinceLastSpoke: 0,
      topicRelevanceScore: 0.5, // Neutral until topic is determined
      interruptionTendency: this.calculateInterruptionTendency(persona),
      dominanceLevel: this.calculateDominanceLevel(persona),
      participationPattern: this.determineInitialParticipationPattern(persona),
      lastUpdated: new Date().toISOString()
    };

    this.behaviorStates.set(persona.id, initialState);
  }

  updateEmotionalState(persona: PersonaProfile, conversationContext: SimulationTurn[]): void {
    const state = this.behaviorStates.get(persona.id);
    if (!state) return;

    const recentTurns = conversationContext.slice(-5);
    const currentTime = new Date();
    const conversationDuration = (currentTime.getTime() - new Date(this.conversationStartTime).getTime()) / (1000 * 60); // minutes

    // Update emotional state based on conversation dynamics
    this.updateEnergy(state, conversationDuration, recentTurns);
    this.updateEngagement(state, recentTurns, persona);
    this.updateFrustration(state, recentTurns, persona);
    this.updateConfidence(state, recentTurns, persona);
    this.updateAgreableness(state, recentTurns, persona);

    // Update participation tracking
    this.updateParticipationPattern(state, recentTurns);
    this.updateTopicRelevance(state, conversationContext, persona);

    state.lastUpdated = new Date().toISOString();
  }

  shouldInterrupt(persona: PersonaProfile, currentSpeaker: string, statementContent: string): InterruptionTrigger {
    const state = this.behaviorStates.get(persona.id);
    if (!state || currentSpeaker === persona.name) {
      return { shouldInterrupt: false, confidence: 0 };
    }

    let interruptionScore = 0;
    let reason = '';
    let style: 'aggressive' | 'polite' | 'passionate' = 'polite';

    // Base interruption tendency from personality
    interruptionScore += state.interruptionTendency * 0.3;

    // High engagement + high frustration = more likely to interrupt
    if (state.emotionalState.engagement > 0.7 && state.emotionalState.frustration > 0.6) {
      interruptionScore += 0.4;
      reason = 'high engagement and frustration';
      style = 'passionate';
    }

    // Dominant personalities interrupt more when disagreeing
    if (state.dominanceLevel > 0.7 && this.detectDisagreement(statementContent, persona)) {
      interruptionScore += 0.5;
      reason = 'disagreement with dominant personality';
      style = 'aggressive';
    }

    // Low agreeableness + strong opinion = more interruptions
    if (state.emotionalState.agreeableness < 0.4 && state.topicRelevanceScore > 0.8) {
      interruptionScore += 0.3;
      reason = 'strong opinion on relevant topic';
      style = 'aggressive';
    }

    // Long silence increases interruption probability for extroverts
    if (state.turnsSinceLastSpoke > 3 && persona.personality.extraversion >= 4) {
      interruptionScore += 0.2;
      reason = 'extrovert breaking long silence';
      style = 'polite';
    }

    // Reduce interruption for withdrawn personas
    if (state.participationPattern === 'withdrawn' || state.participationPattern === 'passive') {
      interruptionScore *= 0.3;
    }

    // Add randomness for natural variation
    interruptionScore += (Math.random() - 0.5) * 0.2;

    const shouldInterrupt = interruptionScore > 0.6;
    const confidence = Math.min(1, interruptionScore);

    return {
      shouldInterrupt,
      confidence,
      reason: shouldInterrupt ? reason : undefined,
      interruptionStyle: shouldInterrupt ? style : undefined
    };
  }

  getBehaviorModifiers(personaId: string): {
    responseLength: 'short' | 'medium' | 'long';
    emotionalIntensity: 'low' | 'medium' | 'high';
    agreementTendency: 'disagreeable' | 'neutral' | 'agreeable';
    participationStyle: string;
  } {
    const state = this.behaviorStates.get(personaId);
    if (!state) {
      return {
        responseLength: 'medium',
        emotionalIntensity: 'medium',
        agreementTendency: 'neutral',
        participationStyle: 'moderate'
      };
    }

    const responseLength = this.determineResponseLength(state);
    const emotionalIntensity = this.determineEmotionalIntensity(state);
    const agreementTendency = this.determineAgreementTendency(state);

    return {
      responseLength,
      emotionalIntensity,
      agreementTendency,
      participationStyle: state.participationPattern
    };
  }

  getPersonaBehaviorState(personaId: string): BehaviorState | undefined {
    return this.behaviorStates.get(personaId);
  }

  updateTurnHistory(turn: SimulationTurn): void {
    this.conversationHistory.push(turn);
    
    // Update turns since last spoke for all personas
    this.behaviorStates.forEach((state, personaId) => {
      if (turn.speaker === this.getPersonaName(personaId)) {
        state.turnsSinceLastSpoke = 0;
      } else if (turn.speaker !== 'Moderator') {
        state.turnsSinceLastSpoke++;
      }
    });
  }

  resetConversation(): void {
    this.conversationHistory = [];
    this.conversationStartTime = new Date().toISOString();
    this.behaviorStates.clear();
  }

  private calculateInitialEnergy(persona: PersonaProfile): number {
    // Base energy from extraversion and conscientiousness
    let energy = (persona.personality.extraversion + persona.personality.conscientiousness) / 10;
    
    // Age factor - younger people have more energy
    if (persona.age < 30) energy += 0.1;
    else if (persona.age > 60) energy -= 0.1;
    
    // Life stage factor
    if (persona.background.life_stage.toLowerCase().includes('student')) energy += 0.15;
    if (persona.background.life_stage.toLowerCase().includes('retired')) energy -= 0.1;
    
    return Math.max(0.1, Math.min(1, energy));
  }

  private calculateInitialEngagement(persona: PersonaProfile): number {
    // Base engagement from openness and conscientiousness
    let engagement = (persona.personality.openness + persona.personality.conscientiousness) / 10;
    
    // Occupation factor
    if (persona.occupation.title.toLowerCase().includes('teacher') ||
        persona.occupation.title.toLowerCase().includes('consultant') ||
        persona.occupation.title.toLowerCase().includes('manager')) {
      engagement += 0.1;
    }
    
    return Math.max(0.2, Math.min(1, engagement));
  }

  private calculateInitialConfidence(persona: PersonaProfile): number {
    // Base confidence from extraversion and low neuroticism
    let confidence = (persona.personality.extraversion + (5 - persona.personality.neuroticism)) / 10;
    
    // Experience and education boost confidence
    if (persona.occupation.experience > 10) confidence += 0.1;
    if (persona.background.education.toLowerCase().includes('masters') ||
        persona.background.education.toLowerCase().includes('phd')) confidence += 0.1;
    
    return Math.max(0.2, Math.min(1, confidence));
  }

  private calculateInterruptionTendency(persona: PersonaProfile): number {
    // High extraversion + low agreeableness = high interruption tendency
    let tendency = (persona.personality.extraversion + (5 - persona.personality.agreeableness)) / 10;
    
    // Occupation modifiers
    if (persona.occupation.title.toLowerCase().includes('sales') ||
        persona.occupation.title.toLowerCase().includes('lawyer') ||
        persona.occupation.title.toLowerCase().includes('manager')) {
      tendency += 0.1;
    }
    
    return Math.max(0, Math.min(1, tendency));
  }

  private calculateDominanceLevel(persona: PersonaProfile): number {
    // Extraversion + conscientiousness + low agreeableness
    let dominance = (persona.personality.extraversion + persona.personality.conscientiousness + (5 - persona.personality.agreeableness)) / 15;
    
    // Leadership roles increase dominance
    if (persona.occupation.title.toLowerCase().includes('director') ||
        persona.occupation.title.toLowerCase().includes('ceo') ||
        persona.occupation.title.toLowerCase().includes('president')) {
      dominance += 0.2;
    }
    
    return Math.max(0, Math.min(1, dominance));
  }

  private determineInitialParticipationPattern(persona: PersonaProfile): 'active' | 'moderate' | 'passive' | 'withdrawn' {
    const socialScore = persona.personality.extraversion + persona.personality.agreeableness - persona.personality.neuroticism;
    
    if (socialScore >= 8) return 'active';
    if (socialScore >= 5) return 'moderate';
    if (socialScore >= 2) return 'passive';
    return 'withdrawn';
  }

  private updateEnergy(state: BehaviorState, conversationDuration: number, recentTurns: SimulationTurn[]): void {
    // Energy decreases over time
    const energyDecay = conversationDuration * 0.02; // 2% per minute
    state.emotionalState.energy = Math.max(0.1, state.emotionalState.energy - energyDecay);
    
    // Speaking boosts energy temporarily for extroverts
    const hasSpokenRecently = recentTurns.some(turn => turn.speaker === this.getPersonaName(state.personaId));
    if (hasSpokenRecently && state.emotionalState.energy < 0.8) {
      state.emotionalState.energy += 0.1;
    }
  }

  private updateEngagement(state: BehaviorState, recentTurns: SimulationTurn[], persona: PersonaProfile): void {
    // Engagement increases with topic relevance
    if (state.topicRelevanceScore > 0.7) {
      state.emotionalState.engagement = Math.min(1, state.emotionalState.engagement + 0.1);
    }
    
    // Engagement decreases if not speaking for a while
    if (state.turnsSinceLastSpoke > 4) {
      state.emotionalState.engagement = Math.max(0.1, state.emotionalState.engagement - 0.1);
    }
    
    // High openness maintains engagement better
    if (persona.personality.openness >= 4) {
      state.emotionalState.engagement = Math.min(1, state.emotionalState.engagement + 0.05);
    }
  }

  private updateFrustration(state: BehaviorState, recentTurns: SimulationTurn[], persona: PersonaProfile): void {
    // Frustration increases when interrupted or ignored
    if (state.turnsSinceLastSpoke > 5 && state.emotionalState.engagement > 0.6) {
      state.emotionalState.frustration = Math.min(1, state.emotionalState.frustration + 0.15);
    }
    
    // High neuroticism personalities get frustrated faster
    if (persona.personality.neuroticism >= 4) {
      state.emotionalState.frustration = Math.min(1, state.emotionalState.frustration + 0.05);
    }
    
    // Frustration decreases slowly when participating
    const hasSpokenRecently = recentTurns.some(turn => turn.speaker === this.getPersonaName(state.personaId));
    if (hasSpokenRecently) {
      state.emotionalState.frustration = Math.max(0, state.emotionalState.frustration - 0.1);
    }
  }

  private updateConfidence(state: BehaviorState, recentTurns: SimulationTurn[], persona: PersonaProfile): void {
    // Confidence boosts when speaking on relevant topics
    if (state.topicRelevanceScore > 0.8) {
      state.emotionalState.confidence = Math.min(1, state.emotionalState.confidence + 0.1);
    }
    
    // Confidence decreases when not participating in highly relevant discussions
    if (state.turnsSinceLastSpoke > 3 && state.topicRelevanceScore > 0.7) {
      state.emotionalState.confidence = Math.max(0.1, state.emotionalState.confidence - 0.05);
    }
  }

  private updateAgreableness(state: BehaviorState, recentTurns: SimulationTurn[], persona: PersonaProfile): void {
    // Agreeableness decreases with frustration
    if (state.emotionalState.frustration > 0.7) {
      state.emotionalState.agreeableness = Math.max(0, state.emotionalState.agreeableness - 0.1);
    }
    
    // Agreeableness recovers slowly
    if (state.emotionalState.frustration < 0.3) {
      const baseAgreeableness = persona.personality.agreeableness / 5;
      if (state.emotionalState.agreeableness < baseAgreeableness) {
        state.emotionalState.agreeableness = Math.min(baseAgreeableness, state.emotionalState.agreeableness + 0.05);
      }
    }
  }

  private updateParticipationPattern(state: BehaviorState, recentTurns: SimulationTurn[]): void {
    const recentParticipation = recentTurns.filter(turn => turn.speaker === this.getPersonaName(state.personaId)).length;
    const totalRecentTurns = recentTurns.filter(turn => turn.speaker !== 'Moderator').length;
    
    if (totalRecentTurns === 0) return;
    
    const participationRatio = recentParticipation / totalRecentTurns;
    
    if (participationRatio > 0.4) state.participationPattern = 'active';
    else if (participationRatio > 0.2) state.participationPattern = 'moderate';
    else if (participationRatio > 0.05) state.participationPattern = 'passive';
    else state.participationPattern = 'withdrawn';
  }

  private updateTopicRelevance(state: BehaviorState, conversationContext: SimulationTurn[], persona: PersonaProfile): void {
    // Analyze recent conversation for topic relevance to persona's expertise/interests
    const recentContent = conversationContext.slice(-5).map(turn => turn.text).join(' ');
    
    let relevanceScore = 0;
    
    // Check against expertise areas
    if (persona.expertise_areas) {
      persona.expertise_areas.forEach(area => {
        if (recentContent.toLowerCase().includes(area.toLowerCase())) {
          relevanceScore += 0.3;
        }
      });
    }
    
    // Check against interests
    persona.preferences.interests.forEach(interest => {
      if (recentContent.toLowerCase().includes(interest.toLowerCase())) {
        relevanceScore += 0.2;
      }
    });
    
    // Check against values
    persona.preferences.values.forEach(value => {
      if (recentContent.toLowerCase().includes(value.toLowerCase())) {
        relevanceScore += 0.2;
      }
    });
    
    // Check against occupation
    if (recentContent.toLowerCase().includes(persona.occupation.title.toLowerCase()) ||
        recentContent.toLowerCase().includes(persona.occupation.industry.toLowerCase())) {
      relevanceScore += 0.3;
    }
    
    state.topicRelevanceScore = Math.min(1, relevanceScore);
  }

  private detectDisagreement(statementContent: string, persona: PersonaProfile): boolean {
    // Simple keyword-based disagreement detection
    const disagreementIndicators = ['wrong', 'disagree', 'incorrect', 'no way', 'absolutely not'];
    return disagreementIndicators.some(indicator => 
      statementContent.toLowerCase().includes(indicator)
    );
  }

  private determineResponseLength(state: BehaviorState): 'short' | 'medium' | 'long' {
    if (state.emotionalState.energy < 0.3 || state.participationPattern === 'withdrawn') {
      return 'short';
    } else if (state.emotionalState.engagement > 0.7 && state.topicRelevanceScore > 0.6) {
      return 'long';
    }
    return 'medium';
  }

  private determineEmotionalIntensity(state: BehaviorState): 'low' | 'medium' | 'high' {
    const intensityScore = state.emotionalState.engagement + state.emotionalState.frustration + state.topicRelevanceScore;
    
    if (intensityScore > 2) return 'high';
    if (intensityScore > 1) return 'medium';
    return 'low';
  }

  private determineAgreementTendency(state: BehaviorState): 'disagreeable' | 'neutral' | 'agreeable' {
    if (state.emotionalState.agreeableness > 0.7) return 'agreeable';
    if (state.emotionalState.agreeableness < 0.3) return 'disagreeable';
    return 'neutral';
  }

  private getPersonaName(personaId: string): string {
    // This would need to be implemented to map persona IDs to names
    // For now, return the ID (this should be improved in integration)
    return personaId;
  }
}

export const behaviorStateTracker = new BehaviorStateTracker();