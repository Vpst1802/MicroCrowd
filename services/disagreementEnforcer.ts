import { PersonaProfile, SimulationTurn } from '../types';
import { AssignedStance } from './controversyStanceAssigner';

export interface DisagreementAnalysis {
  consensusLevel: number; // 0-1 scale (1 = complete consensus)
  controversialTopic: boolean;
  needsDisagreement: boolean;
  targetPersona?: PersonaProfile;
  disagreementType: 'mild' | 'moderate' | 'strong';
  reason: string;
}

export interface DisagreementInjection {
  shouldInject: boolean;
  targetPersona: PersonaProfile;
  disagreementPrompt: string;
  emotionalIntensity: 'low' | 'medium' | 'high';
  disagreementStyle: 'logical' | 'emotional' | 'personal_experience';
}

export class DisagreementEnforcer {
  private controversialTopics = new Set([
    'gun', 'weapon', 'firearm', 'second amendment',
    'climate', 'environment', 'global warming', 'carbon',
    'immigration', 'border', 'refugee', 'asylum',
    'healthcare', 'insurance', 'medical', 'medicare',
    'abortion', 'reproductive', 'pro-life', 'pro-choice',
    'taxation', 'taxes', 'government spending', 'welfare',
    'police', 'law enforcement', 'justice', 'prison',
    'education', 'school', 'university', 'student debt',
    'economy', 'recession', 'unemployment', 'minimum wage',
    'religion', 'church', 'faith', 'prayer',
    'technology', 'privacy', 'surveillance', 'data',
    'military', 'war', 'defense', 'veteran'
  ]);

  private agreementIndicators = [
    'i agree', 'exactly', 'absolutely', 'definitely', 'totally',
    'that\'s right', 'yes', 'same here', 'me too', 'i think so too',
    'good point', 'makes sense', 'true', 'correct', 'precisely'
  ];

  private disagreementIndicators = [
    'i disagree', 'no', 'wrong', 'not really', 'actually',
    'however', 'but', 'on the contrary', 'i don\'t think',
    'that\'s not', 'i\'m not sure', 'different view'
  ];

  requiresDisagreement(topic: string, recentResponses: SimulationTurn[]): DisagreementAnalysis {
    const isControversial = this.isControversialTopic(topic);
    const consensusLevel = this.calculateConsensusLevel(recentResponses);
    
    let needsDisagreement = false;
    let disagreementType: 'mild' | 'moderate' | 'strong' = 'mild';
    let reason = '';

    // High consensus on controversial topics definitely needs disagreement
    if (isControversial && consensusLevel > 0.7) {
      needsDisagreement = true;
      disagreementType = 'strong';
      reason = 'High consensus on controversial topic is unrealistic';
    }
    // Moderate consensus on any topic for too long needs some disagreement
    else if (consensusLevel > 0.6 && recentResponses.length > 4) {
      needsDisagreement = true;
      disagreementType = 'moderate';
      reason = 'Sustained agreement needs natural disagreement';
    }
    // Even non-controversial topics need some variety
    else if (consensusLevel > 0.8 && recentResponses.length > 6) {
      needsDisagreement = true;
      disagreementType = 'mild';
      reason = 'Complete consensus is unnatural even on non-controversial topics';
    }

    return {
      consensusLevel,
      controversialTopic: isControversial,
      needsDisagreement,
      disagreementType,
      reason
    };
  }

  generateCounterPosition(
    persona: PersonaProfile, 
    agreeableResponse: string, 
    assignedStance: AssignedStance,
    recentContext: SimulationTurn[]
  ): string {
    const { stance, emotionalInvestment } = assignedStance;
    
    // Determine disagreement style based on persona
    const style = this.determineDisagreementStyle(persona, emotionalInvestment);
    
    // Generate counter-argument based on assigned stance
    const counterArgument = this.selectCounterArgument(stance, agreeableResponse);
    const personalConnection = this.selectPersonalConnection(assignedStance);
    
    // Build disagreement response
    let disagreementResponse = '';
    
    // Add emotional intensity marker
    if (emotionalInvestment > 0.7) {
      disagreementResponse += '[PASSIONATE] ';
    } else if (emotionalInvestment > 0.5) {
      disagreementResponse += '[FIRM] ';
    }
    
    // Add disagreement opener
    const opener = this.getDisagreementOpener(style, emotionalInvestment);
    disagreementResponse += opener + ' ';
    
    // Add core counter-argument
    disagreementResponse += counterArgument + '. ';
    
    // Add personal connection if emotionally invested
    if (emotionalInvestment > 0.6 && personalConnection) {
      disagreementResponse += personalConnection + ' ';
    }
    
    // Add concern or fear if highly invested
    if (emotionalInvestment > 0.8 && stance.concerns.length > 0) {
      const concern = stance.concerns[Math.floor(Math.random() * stance.concerns.length)];
      disagreementResponse += `I'm worried about ${concern.toLowerCase()}.`;
    }

    return disagreementResponse.trim();
  }

  injectDisagreement(
    personas: PersonaProfile[],
    recentResponses: SimulationTurn[],
    assignedStances: Map<PersonaProfile, AssignedStance>,
    topic: string
  ): DisagreementInjection | null {
    const analysis = this.requiresDisagreement(topic, recentResponses);
    
    if (!analysis.needsDisagreement) {
      return null;
    }

    // Find best persona to inject disagreement
    const targetPersona = this.selectDisagreementPersona(personas, recentResponses, assignedStances);
    if (!targetPersona) return null;

    const assignedStance = assignedStances.get(targetPersona);
    if (!assignedStance) return null;

    // Generate disagreement prompt
    const disagreementPrompt = this.generateDisagreementPrompt(
      targetPersona, 
      assignedStance, 
      analysis, 
      recentResponses
    );

    const emotionalIntensity = this.determineEmotionalIntensity(assignedStance.emotionalInvestment);
    const disagreementStyle = this.determineDisagreementStyle(targetPersona, assignedStance.emotionalInvestment);

    return {
      shouldInject: true,
      targetPersona,
      disagreementPrompt,
      emotionalIntensity,
      disagreementStyle
    };
  }

  private isControversialTopic(topic: string): boolean {
    const topicLower = topic.toLowerCase();
    return Array.from(this.controversialTopics).some(keyword => 
      topicLower.includes(keyword)
    );
  }

  private calculateConsensusLevel(recentResponses: SimulationTurn[]): number {
    if (recentResponses.length === 0) return 0;

    let agreementCount = 0;
    let disagreementCount = 0;

    recentResponses.forEach(response => {
      const text = response.text.toLowerCase();
      
      // Count agreement indicators
      this.agreementIndicators.forEach(indicator => {
        if (text.includes(indicator)) agreementCount++;
      });
      
      // Count disagreement indicators
      this.disagreementIndicators.forEach(indicator => {
        if (text.includes(indicator)) disagreementCount++;
      });
    });

    const totalIndicators = agreementCount + disagreementCount;
    if (totalIndicators === 0) return 0.5; // Neutral if no clear indicators

    return agreementCount / totalIndicators;
  }

  private determineDisagreementStyle(persona: PersonaProfile, emotionalInvestment: number): 'logical' | 'emotional' | 'personal_experience' {
    // High openness + high emotional investment = emotional style
    if (persona.personality.openness >= 4 && emotionalInvestment > 0.7) {
      return 'emotional';
    }
    
    // High conscientiousness + education = logical style
    if (persona.personality.conscientiousness >= 4 || 
        persona.background.education.toLowerCase().includes('college') ||
        persona.occupation.title.toLowerCase().includes('analyst')) {
      return 'logical';
    }
    
    // Default to personal experience for relatability
    return 'personal_experience';
  }

  private selectCounterArgument(stance: any, agreeableResponse: string): string {
    // Select argument that most directly counters the agreeable response
    const responseWords = agreeableResponse.toLowerCase().split(/\s+/);
    
    let bestArgument = stance.arguments[0]; // Default to first argument
    let maxRelevance = 0;
    
    stance.arguments.forEach((argument: string) => {
      const argumentWords = argument.toLowerCase().split(/\s+/);
      const relevance = this.calculateWordOverlap(responseWords, argumentWords);
      
      if (relevance > maxRelevance) {
        maxRelevance = relevance;
        bestArgument = argument;
      }
    });
    
    return bestArgument;
  }

  private selectPersonalConnection(assignedStance: AssignedStance): string | null {
    if (assignedStance.personalConnections.length === 0) return null;
    
    // Prefer connections that feel more personal/emotional
    const personalConnections = assignedStance.personalConnections.filter(conn => 
      conn.toLowerCase().includes('my') || 
      conn.toLowerCase().includes('family') ||
      conn.toLowerCase().includes('experience')
    );
    
    if (personalConnections.length > 0) {
      return personalConnections[Math.floor(Math.random() * personalConnections.length)];
    }
    
    return assignedStance.personalConnections[0];
  }

  private getDisagreementOpener(style: 'logical' | 'emotional' | 'personal_experience', emotionalInvestment: number): string {
    const openers = {
      logical: [
        'I have to disagree with that analysis because',
        'The data actually shows',
        'That\'s not supported by evidence -',
        'I think that misses the key point:',
        'Actually, research indicates'
      ],
      emotional: [
        'I strongly disagree because',
        'That really bothers me -',
        'I can\'t accept that perspective because',
        'No, that\'s completely wrong!',
        'I feel very differently about this'
      ],
      personal_experience: [
        'That hasn\'t been my experience at all -',
        'I\'ve seen the opposite happen when',
        'From what I\'ve lived through,',
        'In my situation,',
        'Based on what I\'ve witnessed,'
      ]
    };

    const styleOpeners = openers[style];
    const intensity = emotionalInvestment > 0.7 ? 'high' : emotionalInvestment > 0.4 ? 'medium' : 'low';
    
    // For high intensity, prefer more direct openers
    if (intensity === 'high') {
      return styleOpeners[Math.floor(Math.random() * Math.min(2, styleOpeners.length))];
    }
    
    return styleOpeners[Math.floor(Math.random() * styleOpeners.length)];
  }

  private selectDisagreementPersona(
    personas: PersonaProfile[],
    recentResponses: SimulationTurn[],
    assignedStances: Map<PersonaProfile, AssignedStance>
  ): PersonaProfile | null {
    // Prefer personas who haven't spoken recently but have strong stances
    const recentSpeakers = new Set(recentResponses.slice(-3).map(r => r.speaker));
    
    let candidates = personas.filter(persona => 
      !recentSpeakers.has(persona.name) && assignedStances.has(persona)
    );
    
    // If no recent non-speakers, include all personas with stances
    if (candidates.length === 0) {
      candidates = personas.filter(persona => assignedStances.has(persona));
    }
    
    if (candidates.length === 0) return null;
    
    // Prefer personas with higher emotional investment
    candidates.sort((a, b) => {
      const aInvestment = assignedStances.get(a)?.emotionalInvestment || 0;
      const bInvestment = assignedStances.get(b)?.emotionalInvestment || 0;
      return bInvestment - aInvestment;
    });
    
    // Prefer personalities that are more likely to disagree
    candidates.sort((a, b) => {
      const aDisagreeable = (5 - a.personality.agreeableness) + a.personality.extraversion;
      const bDisagreeable = (5 - b.personality.agreeableness) + b.personality.extraversion;
      return bDisagreeable - aDisagreeable;
    });
    
    return candidates[0];
  }

  private generateDisagreementPrompt(
    persona: PersonaProfile,
    assignedStance: AssignedStance,
    analysis: DisagreementAnalysis,
    recentResponses: SimulationTurn[]
  ): string {
    const lastResponse = recentResponses[recentResponses.length - 1];
    const consensusStatement = recentResponses.slice(-3)
      .map(r => r.text)
      .join(' ');

    let prompt = `You are ${persona.name}. The recent discussion has shown too much agreement (${Math.round(analysis.consensusLevel * 100)}% consensus). `;
    
    prompt += `Your assigned stance is: ${assignedStance.stance.position}. `;
    
    prompt += `You need to express disagreement with the current consensus. `;
    
    if (analysis.controversialTopic) {
      prompt += `This is a controversial topic where people with your background would have strong opinions. `;
    }
    
    prompt += `Recent consensus statement: "${consensusStatement}" `;
    
    prompt += `Your response should:
1. Clearly disagree with the consensus
2. Present your stance: ${assignedStance.stance.position}
3. Use one of your key arguments: ${assignedStance.stance.arguments.join(' OR ')}
4. Show emotional investment level: ${assignedStance.emotionalInvestment > 0.7 ? 'HIGH' : 'MODERATE'}
5. Include personal connection: ${assignedStance.personalConnections[0]}`;

    return prompt;
  }

  private determineEmotionalIntensity(emotionalInvestment: number): 'low' | 'medium' | 'high' {
    if (emotionalInvestment > 0.7) return 'high';
    if (emotionalInvestment > 0.4) return 'medium';
    return 'low';
  }

  private calculateWordOverlap(words1: string[], words2: string[]): number {
    const set1 = new Set(words1.filter(w => w.length > 3));
    const set2 = new Set(words2.filter(w => w.length > 3));
    
    const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
    const union = new Set([...Array.from(set1), ...Array.from(set2)]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

export const disagreementEnforcer = new DisagreementEnforcer();