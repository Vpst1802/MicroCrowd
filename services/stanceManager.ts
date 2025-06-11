import { PersonaProfile, SimulationTurn } from '../types';
import { controversyStanceAssigner, AssignedStance } from './controversyStanceAssigner';
import { disagreementEnforcer } from './disagreementEnforcer';

export interface TopicStance {
  position: string;
  strength: number; // 0-1 scale
  arguments: string[];
  personalReasons: string[];
  emotionalTriggers: string[];
}

export interface DisagreementContext {
  topic: string;
  currentConsensus: number; // 0-1 scale (1 = complete agreement)
  needsDisagreement: boolean;
  targetPersona?: PersonaProfile;
  disagreementType: 'mild' | 'moderate' | 'strong';
}

export class StanceManager {
  private assignedStances: Map<string, Map<PersonaProfile, AssignedStance>> = new Map();
  private topicRegistry: Map<string, string[]> = new Map();

  assignStances(personas: PersonaProfile[], topic: string): Map<PersonaProfile, AssignedStance> {
    // Use the existing controversy stance assigner
    const stances = controversyStanceAssigner.assignPoliticalPositions(personas, topic);
    
    // Store for this topic
    this.assignedStances.set(topic, stances);
    
    // Register topic
    if (!this.topicRegistry.has(topic)) {
      this.topicRegistry.set(topic, []);
    }

    console.log(`Assigned stances for topic "${topic}" to ${personas.length} personas`);
    
    // Log stance distribution for debugging
    const stanceDistribution = new Map<string, number>();
    stances.forEach(assignedStance => {
      const position = assignedStance.stance.position;
      stanceDistribution.set(position, (stanceDistribution.get(position) || 0) + 1);
    });
    
    console.log('Stance distribution:', Object.fromEntries(stanceDistribution));
    
    return stances;
  }

  getContentiousStances(topic: string): string[] {
    // Define contentious stances for different topics
    const contentiousTopics: { [key: string]: string[] } = {
      'gun_laws': ['pro_gun_rights', 'gun_control_advocate', 'moderate_regulation'],
      'climate_change': ['environmental_activist', 'economic_pragmatist', 'climate_skeptic'],
      'immigration': ['pro_immigration', 'immigration_restriction', 'balanced_approach'],
      'healthcare': ['universal_healthcare', 'free_market', 'mixed_system'],
      'abortion': ['pro_choice', 'pro_life', 'moderate_position'],
      'taxation': ['low_tax_advocate', 'progressive_taxation', 'moderate_fiscal'],
      'education': ['public_education_supporter', 'school_choice_advocate', 'mixed_approach']
    };

    // Check for topic keywords
    const topicLower = topic.toLowerCase();
    for (const [key, stances] of Object.entries(contentiousTopics)) {
      if (topicLower.includes(key.replace('_', ' ')) || topicLower.includes(key)) {
        return stances;
      }
    }

    // Default moderate stances for unknown topics
    return ['supportive', 'skeptical', 'neutral'];
  }

  distributeOpposingViews(personas: PersonaProfile[], stances: string[]): Map<PersonaProfile, string> {
    const distribution = new Map<PersonaProfile, string>();
    
    // Ensure we have disagreement by distributing different stances
    personas.forEach((persona, index) => {
      const stanceIndex = index % stances.length;
      distribution.set(persona, stances[stanceIndex]);
    });

    // Verify we have at least 2 different stances
    const uniqueStances = new Set(distribution.values());
    if (uniqueStances.size === 1 && stances.length > 1) {
      // Force disagreement by changing the last persona's stance
      const lastPersona = personas[personas.length - 1];
      const alternativeStance = stances.find(s => s !== distribution.get(lastPersona));
      if (alternativeStance) {
        distribution.set(lastPersona, alternativeStance);
      }
    }

    return distribution;
  }

  enforceDisagreement(
    persona: PersonaProfile,
    previousResponse: string,
    topic: string,
    conversationHistory: SimulationTurn[]
  ): string | null {
    // Get disagreement analysis
    const analysis = disagreementEnforcer.requiresDisagreement(topic, conversationHistory.slice(-5));
    
    if (!analysis.needsDisagreement) {
      return null;
    }

    // Get persona's assigned stance
    const topicStances = this.assignedStances.get(topic);
    if (!topicStances) {
      return null;
    }

    const assignedStance = topicStances.get(persona);
    if (!assignedStance) {
      return null;
    }

    // Generate disagreement response
    const disagreementResponse = controversyStanceAssigner.generateDisagreementResponse(
      persona,
      previousResponse,
      assignedStance
    );

    console.log(`Generated disagreement for ${persona.name} on ${topic}:`, disagreementResponse);
    
    return disagreementResponse;
  }

  analyzeConsensusLevel(conversationHistory: SimulationTurn[]): number {
    const recentTurns = conversationHistory.slice(-6);
    
    if (recentTurns.length === 0) return 0.5;

    const agreementIndicators = ['agree', 'exactly', 'absolutely', 'yes', 'right', 'correct', 'true'];
    const disagreementIndicators = ['disagree', 'no', 'wrong', 'but', 'however', 'actually', 'different'];

    let agreementCount = 0;
    let disagreementCount = 0;

    recentTurns.forEach(turn => {
      const text = turn.text.toLowerCase();
      
      agreementIndicators.forEach(indicator => {
        if (text.includes(indicator)) agreementCount++;
      });
      
      disagreementIndicators.forEach(indicator => {
        if (text.includes(indicator)) disagreementCount++;
      });
    });

    const totalIndicators = agreementCount + disagreementCount;
    if (totalIndicators === 0) return 0.5; // Neutral

    return agreementCount / totalIndicators;
  }

  requiresDisagreement(topic: string, conversationHistory: SimulationTurn[]): DisagreementContext {
    const consensusLevel = this.analyzeConsensusLevel(conversationHistory);
    const isControversial = this.isControversialTopic(topic);
    
    let needsDisagreement = false;
    let disagreementType: 'mild' | 'moderate' | 'strong' = 'mild';

    // Controversial topics should have more disagreement
    if (isControversial && consensusLevel > 0.7) {
      needsDisagreement = true;
      disagreementType = 'strong';
    } else if (consensusLevel > 0.8) {
      needsDisagreement = true;
      disagreementType = 'moderate';
    } else if (consensusLevel > 0.9) {
      needsDisagreement = true;
      disagreementType = 'mild';
    }

    return {
      topic,
      currentConsensus: consensusLevel,
      needsDisagreement,
      disagreementType
    };
  }

  generateCounterArgument(persona: PersonaProfile, previousResponse: string, topic: string): string {
    const topicStances = this.assignedStances.get(topic);
    if (!topicStances) {
      return this.generateGenericDisagreement(persona, previousResponse);
    }

    const assignedStance = topicStances.get(persona);
    if (!assignedStance) {
      return this.generateGenericDisagreement(persona, previousResponse);
    }

    return controversyStanceAssigner.generateDisagreementResponse(
      persona,
      previousResponse,
      assignedStance
    );
  }

  getPersonaStance(persona: PersonaProfile, topic: string): AssignedStance | null {
    const topicStances = this.assignedStances.get(topic);
    return topicStances?.get(persona) || null;
  }

  private isControversialTopic(topic: string): boolean {
    const controversialKeywords = [
      'gun', 'weapon', 'firearm',
      'climate', 'environment', 'global warming',
      'immigration', 'border', 'refugee',
      'abortion', 'reproductive',
      'healthcare', 'insurance',
      'taxation', 'taxes',
      'police', 'law enforcement'
    ];

    const topicLower = topic.toLowerCase();
    return controversialKeywords.some(keyword => topicLower.includes(keyword));
  }

  private generateGenericDisagreement(persona: PersonaProfile, previousResponse: string): string {
    const disagreements = [
      "I have to disagree with that perspective.",
      "That's not how I see it at all.",
      "I think there's another way to look at this.",
      "Actually, I have a different opinion.",
      "I'm not convinced by that argument."
    ];

    const response = disagreements[Math.floor(Math.random() * disagreements.length)];
    
    // Add personality-based modification
    if (persona.personality.agreeableness <= 2) {
      return "[FIRM] " + response;
    } else if (persona.personality.neuroticism >= 4) {
      return "[HESITANT] " + response;
    }

    return response;
  }

  exportStanceData(topic: string): any {
    const topicStances = this.assignedStances.get(topic);
    if (!topicStances) return null;

    const exportData: any = {
      topic,
      participants: [],
      stanceDistribution: {}
    };

    topicStances.forEach((assignedStance, persona) => {
      exportData.participants.push({
        name: persona.name,
        stance: assignedStance.stance.position,
        emotionalInvestment: assignedStance.emotionalInvestment,
        arguments: assignedStance.stance.arguments,
        personalConnections: assignedStance.personalConnections
      });

      // Count stance distribution
      const position = assignedStance.stance.position;
      exportData.stanceDistribution[position] = (exportData.stanceDistribution[position] || 0) + 1;
    });

    return exportData;
  }

  reset(): void {
    this.assignedStances.clear();
    this.topicRegistry.clear();
  }
}

export const stanceManager = new StanceManager();