import { PersonaProfile } from '../types';

export interface ResponseTemplate {
  opener: string[];
  connectors: string[];
  closers: string[];
  emphasisMarkers: string[];
  uncertaintyMarkers: string[];
}

export interface PersonaResponseStyle {
  personaId: string;
  template: ResponseTemplate;
  speechPatterns: string[];
  vocabularyLevel: 'simple' | 'moderate' | 'complex';
  responseLength: 'brief' | 'moderate' | 'verbose';
  emotionalExpression: 'reserved' | 'moderate' | 'expressive';
}

export class ResponseStyleManager {
  private personaStyles: Map<string, PersonaResponseStyle> = new Map();
  private baseTemplates: Map<string, ResponseTemplate> = new Map();

  constructor() {
    this.initializeBaseTemplates();
  }

  private initializeBaseTemplates(): void {
    // Analytical/Professional Style
    this.baseTemplates.set('analytical', {
      opener: [
        "Looking at this from a data perspective,",
        "Based on my experience in {occupation},",
        "The key factor here is",
        "What we need to consider is",
        "From a practical standpoint,"
      ],
      connectors: [
        "Furthermore,",
        "Additionally,",
        "However,",
        "On the other hand,",
        "More importantly,"
      ],
      closers: [
        "That's my assessment based on the evidence.",
        "I think that's the most logical approach.",
        "The data supports this conclusion.",
        "This approach has worked in my field.",
        "That's what the research indicates."
      ],
      emphasisMarkers: ["clearly", "definitely", "obviously", "certainly"],
      uncertaintyMarkers: ["possibly", "potentially", "it seems", "I believe"]
    });

    // Emotional/Expressive Style
    this.baseTemplates.set('emotional', {
      opener: [
        "Oh my goodness,",
        "I feel so strongly about this -",
        "This really hits home for me because",
        "I get so frustrated when",
        "It breaks my heart that"
      ],
      connectors: [
        "And another thing,",
        "Plus,",
        "But here's what really gets me:",
        "And don't even get me started on",
        "What makes it worse is"
      ],
      closers: [
        "Sorry, I get passionate about this stuff.",
        "It just really matters to me, you know?",
        "I hope that makes sense.",
        "Am I the only one who feels this way?",
        "This is so important to get right."
      ],
      emphasisMarkers: ["absolutely", "totally", "completely", "so much"],
      uncertaintyMarkers: ["I think", "maybe", "I guess", "kind of"]
    });

    // Conversational/Casual Style
    this.baseTemplates.set('casual', {
      opener: [
        "You know what,",
        "I mean,",
        "Here's the thing -",
        "Honestly,",
        "So like,"
      ],
      connectors: [
        "But yeah,",
        "And like,",
        "Plus,",
        "Also,",
        "But then again,"
      ],
      closers: [
        "That's just my two cents.",
        "But what do I know?",
        "Just saying.",
        "Know what I mean?",
        "That's how I see it anyway."
      ],
      emphasisMarkers: ["totally", "really", "super", "way"],
      uncertaintyMarkers: ["like", "sort of", "I guess", "maybe"]
    });

    // Authoritative/Dominant Style
    this.baseTemplates.set('authoritative', {
      opener: [
        "Let me be clear:",
        "The reality is",
        "What you need to understand is",
        "I've been saying this for years -",
        "The fact of the matter is"
      ],
      connectors: [
        "Moreover,",
        "Furthermore,",
        "In fact,",
        "What's more,",
        "Beyond that,"
      ],
      closers: [
        "End of story.",
        "That's just how it is.",
        "No question about it.",
        "Period.",
        "Case closed."
      ],
      emphasisMarkers: ["absolutely", "definitely", "without question", "undoubtedly"],
      uncertaintyMarkers: ["arguably", "conceivably", "presumably"]
    });

    // Hesitant/Withdrawn Style
    this.baseTemplates.set('hesitant', {
      opener: [
        "Well, I'm not sure, but...",
        "I don't know if this is right, but",
        "Maybe it's just me, but",
        "I could be wrong, but",
        "I don't really know much about this, but"
      ],
      connectors: [
        "I think...",
        "Maybe...",
        "I'm not sure, but",
        "It seems like",
        "I guess"
      ],
      closers: [
        "But I could be wrong.",
        "I don't know, what do you think?",
        "That's just my opinion though.",
        "But maybe I'm missing something.",
        "I'm probably not the best person to ask."
      ],
      emphasisMarkers: ["probably", "mostly", "generally", "usually"],
      uncertaintyMarkers: ["maybe", "possibly", "I think", "perhaps", "sort of"]
    });

    // Storytelling/Personal Style
    this.baseTemplates.set('storytelling', {
      opener: [
        "You know, this reminds me of when",
        "I remember back when I was",
        "My {family_member} always used to say",
        "Growing up in {location}, we",
        "There was this one time when"
      ],
      connectors: [
        "And then,",
        "So anyway,",
        "Which reminds me,",
        "Speaking of which,",
        "That's like when"
      ],
      closers: [
        "So that's why I feel this way.",
        "And that's stayed with me ever since.",
        "That experience really shaped my thinking.",
        "I'll never forget that lesson.",
        "That's where I'm coming from on this."
      ],
      emphasisMarkers: ["really", "always", "never", "completely"],
      uncertaintyMarkers: ["I think", "seemed like", "probably", "maybe"]
    });
  }

  getResponseTemplate(personaId: string, emotionalState: string, topicEngagement: number): PersonaResponseStyle {
    // Return cached style if exists
    if (this.personaStyles.has(personaId)) {
      return this.personaStyles.get(personaId)!;
    }

    // This should not happen in normal flow, return a default
    return this.createDefaultStyle(personaId);
  }

  generatePersonaStyle(persona: PersonaProfile): PersonaResponseStyle {
    const styleKey = this.determineStyleType(persona);
    const baseTemplate = this.baseTemplates.get(styleKey)!;
    
    const personalizedTemplate = this.personalizeTemplate(baseTemplate, persona);
    const speechPatterns = this.generateSpeechPatterns(persona);
    const vocabularyLevel = this.determineVocabularyLevel(persona);
    const responseLength = this.determineResponseLength(persona);
    const emotionalExpression = this.determineEmotionalExpression(persona);

    const style: PersonaResponseStyle = {
      personaId: persona.id,
      template: personalizedTemplate,
      speechPatterns,
      vocabularyLevel,
      responseLength,
      emotionalExpression
    };

    this.personaStyles.set(persona.id, style);
    return style;
  }

  varyLinguisticPatterns(persona: PersonaProfile, baseResponse: string): string {
    const style = this.personaStyles.get(persona.id);
    if (!style) return baseResponse;

    let variedResponse = baseResponse;

    // Apply speech patterns
    style.speechPatterns.forEach(pattern => {
      if (Math.random() < 0.3) { // 30% chance to apply each pattern
        variedResponse = this.applyPattern(variedResponse, pattern, persona);
      }
    });

    // Adjust vocabulary level
    variedResponse = this.adjustVocabulary(variedResponse, style.vocabularyLevel);

    // Apply emotional expression level
    variedResponse = this.adjustEmotionalExpression(variedResponse, style.emotionalExpression);

    return variedResponse;
  }

  private determineStyleType(persona: PersonaProfile): string {
    const { personality, occupation, age, background } = persona;

    // High conscientiousness + low agreeableness = Authoritative
    if (personality.conscientiousness >= 4 && personality.agreeableness <= 2) {
      return 'authoritative';
    }

    // High neuroticism + low extraversion = Hesitant
    if (personality.neuroticism >= 4 && personality.extraversion <= 2) {
      return 'hesitant';
    }

    // High openness + high extraversion = Emotional/Expressive
    if (personality.openness >= 4 && personality.extraversion >= 4) {
      return 'emotional';
    }

    // High openness + storytelling occupation/interests = Storytelling
    if (personality.openness >= 4 || 
        occupation.title.toLowerCase().includes('writer') ||
        occupation.title.toLowerCase().includes('teacher') ||
        persona.preferences.interests.some(interest => 
          ['storytelling', 'history', 'literature', 'travel'].includes(interest.toLowerCase()))) {
      return 'storytelling';
    }

    // Professional occupation = Analytical
    if (occupation.title.toLowerCase().includes('analyst') ||
        occupation.title.toLowerCase().includes('engineer') ||
        occupation.title.toLowerCase().includes('manager') ||
        occupation.title.toLowerCase().includes('director') ||
        background.education.toLowerCase().includes('masters') ||
        background.education.toLowerCase().includes('phd')) {
      return 'analytical';
    }

    // Default to casual for younger personas or service industries
    return 'casual';
  }

  private personalizeTemplate(template: ResponseTemplate, persona: PersonaProfile): ResponseTemplate {
    const personalized: ResponseTemplate = {
      opener: [...template.opener],
      connectors: [...template.connectors],
      closers: [...template.closers],
      emphasisMarkers: [...template.emphasisMarkers],
      uncertaintyMarkers: [...template.uncertaintyMarkers]
    };

    // Replace placeholders in templates
    const replacements = {
      '{occupation}': persona.occupation.title.toLowerCase(),
      '{location}': persona.location,
      '{family_member}': this.getRandomFamilyMember(persona),
      '{industry}': persona.occupation.industry.toLowerCase()
    };

    Object.keys(replacements).forEach(placeholder => {
      const replacement = replacements[placeholder as keyof typeof replacements];
      personalized.opener = personalized.opener.map(item => item.replace(placeholder, replacement));
      personalized.connectors = personalized.connectors.map(item => item.replace(placeholder, replacement));
      personalized.closers = personalized.closers.map(item => item.replace(placeholder, replacement));
    });

    return personalized;
  }

  private generateSpeechPatterns(persona: PersonaProfile): string[] {
    const patterns: string[] = [];

    // Age-based patterns
    if (persona.age < 30) {
      patterns.push('use_modern_slang', 'shorter_sentences', 'question_tags');
    } else if (persona.age > 50) {
      patterns.push('formal_language', 'longer_explanations', 'reference_past');
    }

    // Location-based patterns
    if (persona.location.toLowerCase().includes('south')) {
      patterns.push('southern_politeness', 'storytelling_tendency');
    } else if (persona.location.toLowerCase().includes('new york')) {
      patterns.push('direct_communication', 'fast_paced');
    }

    // Personality-based patterns
    if (persona.personality.agreeableness >= 4) {
      patterns.push('diplomatic_language', 'agreement_seeking');
    }
    
    if (persona.personality.neuroticism >= 4) {
      patterns.push('self_doubt_expressions', 'hedge_words');
    }

    if (persona.personality.openness >= 4) {
      patterns.push('creative_expressions', 'metaphor_usage');
    }

    // Occupation-based patterns
    if (persona.occupation.title.toLowerCase().includes('tech')) {
      patterns.push('technical_metaphors', 'precise_language');
    } else if (persona.occupation.title.toLowerCase().includes('sales')) {
      patterns.push('persuasive_language', 'enthusiasm_markers');
    }

    return patterns;
  }

  private determineVocabularyLevel(persona: PersonaProfile): 'simple' | 'moderate' | 'complex' {
    let score = 0;

    // Education level
    if (persona.background.education.toLowerCase().includes('phd')) score += 3;
    else if (persona.background.education.toLowerCase().includes('masters')) score += 2;
    else if (persona.background.education.toLowerCase().includes('college')) score += 1;

    // Occupation
    if (persona.occupation.title.toLowerCase().includes('professor') ||
        persona.occupation.title.toLowerCase().includes('researcher') ||
        persona.occupation.title.toLowerCase().includes('analyst')) score += 2;
    else if (persona.occupation.title.toLowerCase().includes('manager') ||
             persona.occupation.title.toLowerCase().includes('director')) score += 1;

    // Personality
    if (persona.personality.openness >= 4) score += 1;
    if (persona.personality.conscientiousness >= 4) score += 1;

    if (score >= 4) return 'complex';
    if (score >= 2) return 'moderate';
    return 'simple';
  }

  private determineResponseLength(persona: PersonaProfile): 'brief' | 'moderate' | 'verbose' {
    if (persona.personality.extraversion >= 4 && persona.personality.openness >= 4) {
      return 'verbose';
    } else if (persona.personality.extraversion <= 2 || persona.personality.neuroticism >= 4) {
      return 'brief';
    }
    return 'moderate';
  }

  private determineEmotionalExpression(persona: PersonaProfile): 'reserved' | 'moderate' | 'expressive' {
    const emotionalScore = persona.personality.extraversion + persona.personality.neuroticism - persona.personality.agreeableness;
    
    if (emotionalScore >= 6) return 'expressive';
    if (emotionalScore <= 2) return 'reserved';
    return 'moderate';
  }

  private applyPattern(response: string, pattern: string, persona: PersonaProfile): string {
    switch (pattern) {
      case 'use_modern_slang':
        return response.replace(/\bvery\b/g, 'super').replace(/\breally\b/g, 'totally');
      
      case 'southern_politeness':
        if (!response.toLowerCase().includes('please') && Math.random() < 0.5) {
          return response + ', if you don\'t mind me saying.';
        }
        return response;
      
      case 'direct_communication':
        return response.replace(/I think maybe/g, 'I think').replace(/sort of/g, '');
      
      case 'self_doubt_expressions':
        if (Math.random() < 0.3) {
          return 'I might be wrong, but ' + response.toLowerCase();
        }
        return response;
      
      case 'technical_metaphors':
        return response.replace(/like/g, 'similar to how').replace(/process/g, 'workflow');
      
      case 'storytelling_tendency':
        if (Math.random() < 0.4) {
          return response + ' That reminds me of something similar I experienced.';
        }
        return response;
      
      default:
        return response;
    }
  }

  private adjustVocabulary(response: string, level: 'simple' | 'moderate' | 'complex'): string {
    const vocabularyMaps = {
      simple: {
        'utilize': 'use',
        'implement': 'do',
        'facilitate': 'help',
        'comprehensive': 'complete',
        'significant': 'big'
      },
      complex: {
        'use': 'utilize',
        'do': 'implement',
        'help': 'facilitate',
        'complete': 'comprehensive',
        'big': 'significant'
      }
    };

    if (level === 'simple') {
      Object.entries(vocabularyMaps.simple).forEach(([complex, simple]) => {
        response = response.replace(new RegExp(`\\b${complex}\\b`, 'gi'), simple);
      });
    } else if (level === 'complex') {
      Object.entries(vocabularyMaps.complex).forEach(([simple, complex]) => {
        response = response.replace(new RegExp(`\\b${simple}\\b`, 'gi'), complex);
      });
    }

    return response;
  }

  private adjustEmotionalExpression(response: string, level: 'reserved' | 'moderate' | 'expressive'): string {
    if (level === 'expressive') {
      // Add more emotional markers
      response = response.replace(/I think/g, 'I really think');
      response = response.replace(/\./g, '!');
    } else if (level === 'reserved') {
      // Remove emotional markers
      response = response.replace(/!/g, '.');
      response = response.replace(/really /g, '');
      response = response.replace(/totally /g, '');
    }

    return response;
  }

  private getRandomFamilyMember(persona: PersonaProfile): string {
    const members = ['father', 'mother', 'grandfather', 'grandmother', 'uncle', 'aunt'];
    return members[Math.floor(Math.random() * members.length)];
  }

  private createDefaultStyle(personaId: string): PersonaResponseStyle {
    return {
      personaId,
      template: this.baseTemplates.get('casual')!,
      speechPatterns: ['casual_speech'],
      vocabularyLevel: 'moderate',
      responseLength: 'moderate',
      emotionalExpression: 'moderate'
    };
  }

  clearPersonaStyles(): void {
    this.personaStyles.clear();
  }
}

export const responseStyleManager = new ResponseStyleManager();