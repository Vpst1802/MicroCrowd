import { PersonaProfile } from '../types';

export interface ControversialStance {
  position: string;
  arguments: string[];
  concerns: string[];
  personalConnections: string[];
  emotionalInvestment: number; // 0-1 scale
}

export interface AssignedStance {
  persona: PersonaProfile;
  stance: ControversialStance;
  personalConnections: string[];
  emotionalInvestment: number;
}

export class ControversyStanceAssigner {
  private topicStances: Map<string, Map<string, ControversialStance>> = new Map();

  constructor() {
    this.initializeControversialTopics();
  }

  private initializeControversialTopics(): void {
    // Gun Laws
    this.topicStances.set('gun_laws', new Map([
      ['pro_gun_rights', {
        position: 'Strong supporter of gun rights and Second Amendment',
        arguments: ['Constitutional right', 'Self-defense necessity', 'Government overreach concerns', 'Rural protection needs'],
        concerns: ['Government tyranny', 'Personal safety', 'Constitutional erosion', 'Criminal advantage'],
        personalConnections: ['Family hunting tradition', 'Rural upbringing', 'Military/law enforcement background'],
        emotionalInvestment: 0.8
      }],
      ['gun_control_advocate', {
        position: 'Strong advocate for comprehensive gun control',
        arguments: ['Public safety priority', 'Mass shooting prevention', 'Domestic violence reduction', 'Suicide prevention'],
        concerns: ['School safety', 'Urban violence', 'Easy access to weapons', 'International comparisons'],
        personalConnections: ['Urban environment', 'Teaching profession', 'Personal loss experience'],
        emotionalInvestment: 0.9
      }],
      ['moderate_regulation', {
        position: 'Supports reasonable regulations while respecting rights',
        arguments: ['Background checks', 'Training requirements', 'Safe storage laws', 'Mental health focus'],
        concerns: ['Balance of rights and safety', 'Practical enforcement', 'Bipartisan solutions'],
        personalConnections: ['Suburban background', 'Law enforcement family', 'Professional experience'],
        emotionalInvestment: 0.6
      }]
    ]));

    // Climate Change
    this.topicStances.set('climate_change', new Map([
      ['environmental_activist', {
        position: 'Urgent action needed to address climate crisis',
        arguments: ['Scientific consensus', 'Future generations', 'Economic transition benefits', 'Moral imperative'],
        concerns: ['Irreversible damage', 'Corporate resistance', 'Political inaction', 'Time running out'],
        personalConnections: ['Outdoor lifestyle', 'Environmental education', 'Climate impact witness'],
        emotionalInvestment: 0.9
      }],
      ['economic_pragmatist', {
        position: 'Climate action must balance economic realities',
        arguments: ['Job protection', 'Gradual transition', 'Economic competitiveness', 'Practical solutions'],
        concerns: ['Economic disruption', 'Working class impact', 'International competition', 'Energy costs'],
        personalConnections: ['Manufacturing work', 'Union membership', 'Economic pressure experience'],
        emotionalInvestment: 0.7
      }],
      ['climate_skeptic', {
        position: 'Questions climate change urgency and solutions',
        arguments: ['Natural cycles', 'Economic costs', 'Uncertainty in predictions', 'Technology solutions'],
        concerns: ['Government overreach', 'Economic damage', 'Energy independence', 'Scientific uncertainty'],
        personalConnections: ['Energy industry', 'Rural lifestyle', 'Traditional values'],
        emotionalInvestment: 0.6
      }]
    ]));

    // Healthcare
    this.topicStances.set('healthcare', new Map([
      ['universal_healthcare', {
        position: 'Healthcare is a human right requiring universal coverage',
        arguments: ['Moral imperative', 'Economic efficiency', 'International examples', 'Preventive care'],
        concerns: ['Access inequality', 'Bankruptcy from medical bills', 'Insurance industry profits'],
        personalConnections: ['Personal medical crisis', 'Healthcare work', 'Family illness'],
        emotionalInvestment: 0.8
      }],
      ['free_market', {
        position: 'Market-based solutions provide best healthcare outcomes',
        arguments: ['Innovation incentives', 'Choice and competition', 'Quality care', 'Economic freedom'],
        concerns: ['Government inefficiency', 'Reduced innovation', 'Loss of choice', 'Economic burden'],
        personalConnections: ['Business ownership', 'Quality insurance experience', 'Economic philosophy'],
        emotionalInvestment: 0.7
      }],
      ['mixed_system', {
        position: 'Hybrid public-private system offers best balance',
        arguments: ['Safety net with choice', 'Cost controls with innovation', 'Gradual reform', 'Proven models'],
        concerns: ['System complexity', 'Implementation challenges', 'Political feasibility'],
        personalConnections: ['Healthcare administration', 'Policy studies', 'Comparative research'],
        emotionalInvestment: 0.5
      }]
    ]));

    // Immigration
    this.topicStances.set('immigration', new Map([
      ['pro_immigration', {
        position: 'Immigration enriches society and economy',
        arguments: ['Economic benefits', 'Cultural diversity', 'Humanitarian obligation', 'Historical tradition'],
        concerns: ['Anti-immigrant sentiment', 'Policy restrictions', 'Enforcement overreach'],
        personalConnections: ['Immigrant family', 'Diverse community', 'International travel'],
        emotionalInvestment: 0.8
      }],
      ['immigration_restriction', {
        position: 'Immigration needs stronger controls and enforcement',
        arguments: ['Rule of law', 'Economic protection', 'Security concerns', 'Cultural cohesion'],
        concerns: ['Illegal immigration', 'Job competition', 'Security threats', 'Resource strain'],
        personalConnections: ['Working class background', 'Border community', 'Security profession'],
        emotionalInvestment: 0.7
      }],
      ['balanced_approach', {
        position: 'Immigration requires both compassion and control',
        arguments: ['Comprehensive reform', 'Skilled worker programs', 'Humanitarian protection', 'Border security'],
        concerns: ['System dysfunction', 'Polarized debate', 'Practical solutions'],
        personalConnections: ['Legal immigration experience', 'Policy studies', 'Community service'],
        emotionalInvestment: 0.6
      }]
    ]));
  }

  assignPoliticalPositions(personas: PersonaProfile[], topic: string): Map<PersonaProfile, AssignedStance> {
    const assignments = new Map<PersonaProfile, AssignedStance>();
    const availableStances = this.topicStances.get(topic.toLowerCase());

    if (!availableStances) {
      // Return empty assignments for unknown topics
      return assignments;
    }

    const stanceKeys = Array.from(availableStances.keys());
    
    // Ensure we have disagreement by distributing stances
    personas.forEach((persona, index) => {
      const stanceKey = this.selectStanceForPersona(persona, stanceKeys, topic);
      const stance = availableStances.get(stanceKey)!;
      
      const personalConnections = this.generatePersonalConnections(persona, stance);
      const emotionalInvestment = this.calculateEmotionalInvestment(persona, stance);

      assignments.set(persona, {
        persona,
        stance,
        personalConnections,
        emotionalInvestment
      });
    });

    // Ensure we have at least 2 different stances for disagreement
    this.ensureDisagreement(assignments, availableStances);

    return assignments;
  }

  generateDisagreementResponse(persona: PersonaProfile, opposingStatement: string, assignedStance: AssignedStance): string {
    const { stance, personalConnections, emotionalInvestment } = assignedStance;
    
    // Generate disagreement based on persona's assigned stance
    const intensityMarkers = emotionalInvestment > 0.7 ? ['[PASSIONATE]', '[FRUSTRATED]'] : 
                            emotionalInvestment > 0.5 ? ['[CONCERNED]', '[FIRM]'] : 
                            ['[THOUGHTFUL]', '[MEASURED]'];
    
    const intensityMarker = intensityMarkers[Math.floor(Math.random() * intensityMarkers.length)];
    
    const disagreementStarters = [
      "I have to disagree with that because",
      "That's not how I see it at all -",
      "I understand that perspective, but",
      "Actually, I think that's completely wrong because",
      "Hold on, that doesn't match my experience"
    ];
    
    const starter = disagreementStarters[Math.floor(Math.random() * disagreementStarters.length)];
    
    const personalConnection = personalConnections[Math.floor(Math.random() * personalConnections.length)];
    const coreArgument = stance.arguments[Math.floor(Math.random() * stance.arguments.length)];
    
    return `${intensityMarker} ${starter} ${coreArgument.toLowerCase()}. ${personalConnection}`;
  }

  private selectStanceForPersona(persona: PersonaProfile, availableStances: string[], topic: string): string {
    // Use persona demographics to influence stance selection
    const { location, occupation, age, personality, background } = persona;
    
    // Scoring system for stance alignment
    const scores = new Map<string, number>();
    availableStances.forEach(stance => scores.set(stance, 0));

    if (topic === 'gun_laws') {
      // Rural, older, military/police backgrounds lean pro-gun
      if (location.toLowerCase().includes('rural') || location.toLowerCase().includes('texas') || 
          location.toLowerCase().includes('montana') || location.toLowerCase().includes('wyoming')) {
        scores.set('pro_gun_rights', (scores.get('pro_gun_rights') || 0) + 3);
      }
      
      if (occupation.title.toLowerCase().includes('police') || 
          occupation.title.toLowerCase().includes('military') ||
          occupation.title.toLowerCase().includes('security')) {
        scores.set('pro_gun_rights', (scores.get('pro_gun_rights') || 0) + 2);
      }
      
      // Urban, education, younger lean gun control
      if (location.toLowerCase().includes('york') || location.toLowerCase().includes('angeles') ||
          location.toLowerCase().includes('chicago') || location.toLowerCase().includes('boston')) {
        scores.set('gun_control_advocate', (scores.get('gun_control_advocate') || 0) + 3);
      }
      
      if (occupation.title.toLowerCase().includes('teacher') || 
          occupation.title.toLowerCase().includes('professor') ||
          occupation.title.toLowerCase().includes('social')) {
        scores.set('gun_control_advocate', (scores.get('gun_control_advocate') || 0) + 2);
      }
      
      if (age < 35) {
        scores.set('gun_control_advocate', (scores.get('gun_control_advocate') || 0) + 1);
      }
    }

    if (topic === 'climate_change') {
      // Younger, higher education, urban lean environmental
      if (age < 40) {
        scores.set('environmental_activist', (scores.get('environmental_activist') || 0) + 2);
      }
      
      if (background.education.toLowerCase().includes('college') || 
          background.education.toLowerCase().includes('university')) {
        scores.set('environmental_activist', (scores.get('environmental_activist') || 0) + 1);
      }
      
      // Energy/manufacturing workers lean pragmatist/skeptic
      if (occupation.industry.toLowerCase().includes('energy') ||
          occupation.industry.toLowerCase().includes('oil') ||
          occupation.industry.toLowerCase().includes('manufacturing')) {
        scores.set('economic_pragmatist', (scores.get('economic_pragmatist') || 0) + 2);
        scores.set('climate_skeptic', (scores.get('climate_skeptic') || 0) + 1);
      }
    }

    // Add personality-based modifiers
    if (personality.openness >= 4) {
      // More open personalities lean toward progressive stances
      if (topic === 'gun_laws') scores.set('gun_control_advocate', (scores.get('gun_control_advocate') || 0) + 1);
      if (topic === 'climate_change') scores.set('environmental_activist', (scores.get('environmental_activist') || 0) + 1);
    }
    
    if (personality.conscientiousness >= 4) {
      // More conscientious personalities lean toward moderate positions
      availableStances.forEach(stance => {
        if (stance.includes('moderate') || stance.includes('balanced') || stance.includes('mixed')) {
          scores.set(stance, (scores.get(stance) || 0) + 1);
        }
      });
    }

    // Select stance with highest score (with some randomness)
    const sortedStances = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
    
    // Add randomness - sometimes pick second highest to ensure variety
    if (Math.random() < 0.3 && sortedStances.length > 1) {
      return sortedStances[1][0];
    }
    
    return sortedStances[0][0];
  }

  private generatePersonalConnections(persona: PersonaProfile, stance: ControversialStance): string[] {
    const connections: string[] = [];
    
    // Add generic personal connections from stance
    connections.push(...stance.personalConnections);
    
    // Add persona-specific connections
    if (persona.background.experiences) {
      const relevantExperience = persona.background.experiences.find(exp => 
        stance.personalConnections.some(conn => 
          exp.toLowerCase().includes(conn.toLowerCase()) || 
          conn.toLowerCase().includes(exp.toLowerCase())
        )
      );
      
      if (relevantExperience) {
        connections.push(`From my experience with ${relevantExperience.toLowerCase()}`);
      }
    }
    
    // Add occupation-based connections
    if (persona.occupation.title) {
      connections.push(`As someone working in ${persona.occupation.title.toLowerCase()}`);
    }
    
    // Add location-based connections
    if (persona.location) {
      connections.push(`Living in ${persona.location}, I've seen how`);
    }
    
    return connections;
  }

  private calculateEmotionalInvestment(persona: PersonaProfile, stance: ControversialStance): number {
    let investment = stance.emotionalInvestment;
    
    // Adjust based on personality
    if (persona.personality.neuroticism >= 4) investment += 0.1;
    if (persona.personality.openness >= 4) investment += 0.05;
    if (persona.personality.agreeableness <= 2) investment += 0.1;
    
    // Adjust based on personal relevance
    if (persona.goals.fears.some(fear => 
      stance.concerns.some(concern => 
        fear.toLowerCase().includes(concern.toLowerCase())))) {
      investment += 0.15;
    }
    
    return Math.min(1.0, investment);
  }

  private ensureDisagreement(assignments: Map<PersonaProfile, AssignedStance>, availableStances: Map<string, ControversialStance>): void {
    const stanceCounts = new Map<string, number>();
    
    // Count current stance distribution
    assignments.forEach(assignment => {
      const stancePosition = assignment.stance.position;
      stanceCounts.set(stancePosition, (stanceCounts.get(stancePosition) || 0) + 1);
    });
    
    // If everyone has the same stance, force some disagreement
    if (stanceCounts.size === 1 && assignments.size > 1) {
      const personas = Array.from(assignments.keys());
      const stanceKeys = Array.from(availableStances.keys());
      
      // Reassign the last persona to a different stance
      const lastPersona = personas[personas.length - 1];
      const currentStanceKey = Array.from(availableStances.entries())
        .find(([_, stance]) => stance.position === assignments.get(lastPersona)!.stance.position)?.[0];
      
      const alternativeStanceKey = stanceKeys.find(key => key !== currentStanceKey) || stanceKeys[1];
      const alternativeStance = availableStances.get(alternativeStanceKey)!;
      
      const personalConnections = this.generatePersonalConnections(lastPersona, alternativeStance);
      const emotionalInvestment = this.calculateEmotionalInvestment(lastPersona, alternativeStance);
      
      assignments.set(lastPersona, {
        persona: lastPersona,
        stance: alternativeStance,
        personalConnections,
        emotionalInvestment
      });
    }
  }
}

export const controversyStanceAssigner = new ControversyStanceAssigner();