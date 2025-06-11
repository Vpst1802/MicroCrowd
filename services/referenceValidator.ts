import { SimulationTurn, PersonaProfile } from '../types';
import { conversationTracker } from './conversationTracker';

export interface ReferenceExtraction {
  type: 'speaker_reference' | 'vague_reference' | 'temporal_reference';
  speaker?: string;
  phrase: string;
  position: { start: number; end: number };
  isValid: boolean;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  correctedResponse: string;
  issues: ReferenceExtraction[];
  warnings: string[];
}

export class ReferenceValidator {
  // Patterns for detecting different types of references
  private readonly SPEAKER_PATTERNS = [
    /\b([A-Z][a-z]+)\s+(said|mentioned|talked about|argued|stated|claimed|suggested)\b/gi,
    /\bwhen\s+([A-Z][a-z]+)\s+(said|mentioned|talked about)\b/gi,
    /\bas\s+([A-Z][a-z]+)\s+(mentioned|pointed out|said)\b/gi
  ];

  private readonly VAGUE_PATTERNS = [
    /\bsomeone\s+(mentioned|said|talked about|argued)\b/gi,
    /\bas\s+(was\s+)?(mentioned|discussed|said)\s+(earlier|before)\b/gi,
    /\blike\s+(they|someone)\s+said\b/gi,
    /\bbuilding\s+on\s+what\s+(was\s+)?(discussed|mentioned)\b/gi,
    /\bearlier\s+(in\s+the\s+)?(discussion|conversation)\b/gi
  ];

  private readonly TEMPORAL_PATTERNS = [
    /\b(earlier|before|previously)\s+([A-Z][a-z]+)?\s*(said|mentioned|talked about)\b/gi,
    /\bI\s+think\s+(earlier|before)\b/gi
  ];

  private readonly FORBIDDEN_PHRASES = [
    "When I was living in",
    "which reminds me of",
    "In my experience as a",
    "My family went through something similar",
    "I think earlier",
    "Um, I totally agree",
    "You know what, that's interesting because"
  ];

  validateResponse(
    response: string,
    conversationHistory: SimulationTurn[],
    currentSpeaker: string,
    participants: PersonaProfile[]
  ): ValidationResult {
    const issues: ReferenceExtraction[] = [];
    const warnings: string[] = [];
    let correctedResponse = response;

    // Extract all references
    const references = this.extractReferences(response);
    
    // Validate each reference
    for (const ref of references) {
      const validation = this.validateSingleReference(ref, conversationHistory, participants);
      
      if (!validation.isValid) {
        issues.push(ref);
        
        if (validation.correction) {
          correctedResponse = correctedResponse.replace(ref.phrase, validation.correction);
        } else {
          warnings.push(`Invalid reference: "${ref.phrase}"`);
        }
      }
    }

    // Check for forbidden template phrases
    const templateIssues = this.checkForbiddenPhrases(response);
    if (templateIssues.length > 0) {
      warnings.push(...templateIssues);
      correctedResponse = this.removeForbiddenPhrases(correctedResponse);
    }

    // Check for vague references
    const vagueRefs = this.detectVagueReferences(response);
    if (vagueRefs.length > 0) {
      issues.push(...vagueRefs);
      warnings.push('Vague references detected - should be specific or removed');
    }

    return {
      isValid: issues.length === 0 && warnings.length === 0,
      correctedResponse,
      issues,
      warnings
    };
  }

  extractReferences(response: string): ReferenceExtraction[] {
    const references: ReferenceExtraction[] = [];

    // Extract speaker references
    for (const pattern of this.SPEAKER_PATTERNS) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        references.push({
          type: 'speaker_reference',
          speaker: match[1],
          phrase: match[0],
          position: { start: match.index, end: match.index + match[0].length },
          isValid: false // Will be validated separately
        });
      }
    }

    // Extract vague references
    for (const pattern of this.VAGUE_PATTERNS) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        references.push({
          type: 'vague_reference',
          phrase: match[0],
          position: { start: match.index, end: match.index + match[0].length },
          isValid: false
        });
      }
    }

    // Extract temporal references
    for (const pattern of this.TEMPORAL_PATTERNS) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        references.push({
          type: 'temporal_reference',
          speaker: match[2], // Might be undefined
          phrase: match[0],
          position: { start: match.index, end: match.index + match[0].length },
          isValid: false
        });
      }
    }

    return references;
  }

  private validateSingleReference(
    ref: ReferenceExtraction,
    conversationHistory: SimulationTurn[],
    participants: PersonaProfile[]
  ): { isValid: boolean; correction?: string } {
    if (ref.type === 'vague_reference') {
      return { isValid: false };
    }

    if (ref.speaker) {
      // Check if speaker exists
      const speakerExists = participants.some(p => p.name === ref.speaker);
      if (!speakerExists) {
        return { 
          isValid: false, 
          correction: `[Reference to non-existent participant removed]`
        };
      }

      // Check if speaker has actually said something
      const speakerStatements = conversationHistory.filter(turn => turn.speaker === ref.speaker);
      if (speakerStatements.length === 0) {
        return { 
          isValid: false, 
          correction: `[${ref.speaker} hasn't spoken yet]`
        };
      }

      // For now, we'll trust the reference if the speaker exists and has spoken
      // More sophisticated validation would check for semantic similarity
      return { isValid: true };
    }

    return { isValid: false };
  }

  existsInHistory(reference: ReferenceExtraction, conversationHistory: SimulationTurn[]): boolean {
    if (reference.type === 'vague_reference') {
      return false; // Vague references are never valid
    }

    if (reference.speaker) {
      // Check if the speaker has made any statements
      return conversationHistory.some(turn => turn.speaker === reference.speaker);
    }

    return false;
  }

  fixInvalidReference(
    reference: ReferenceExtraction,
    conversationHistory: SimulationTurn[]
  ): string {
    if (reference.type === 'vague_reference') {
      return '[Vague reference removed]';
    }

    if (reference.speaker) {
      const speakerStatements = conversationHistory.filter(turn => turn.speaker === reference.speaker);
      
      if (speakerStatements.length === 0) {
        return `[${reference.speaker} hasn't spoken yet]`;
      }

      // Suggest the most recent statement
      const recentStatement = speakerStatements[speakerStatements.length - 1];
      return `When ${reference.speaker} said "${recentStatement.text.substring(0, 50)}..."`;
    }

    return '[Invalid reference removed]';
  }

  private checkForbiddenPhrases(response: string): string[] {
    const issues: string[] = [];
    
    for (const phrase of this.FORBIDDEN_PHRASES) {
      if (response.toLowerCase().includes(phrase.toLowerCase())) {
        issues.push(`Forbidden template phrase detected: "${phrase}"`);
      }
    }

    return issues;
  }

  private removeForbiddenPhrases(response: string): string {
    let cleaned = response;
    
    for (const phrase of this.FORBIDDEN_PHRASES) {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      cleaned = cleaned.replace(regex, '[Template phrase removed]');
    }

    return cleaned;
  }

  private detectVagueReferences(response: string): ReferenceExtraction[] {
    const vagueRefs: ReferenceExtraction[] = [];

    for (const pattern of this.VAGUE_PATTERNS) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        vagueRefs.push({
          type: 'vague_reference',
          phrase: match[0],
          position: { start: match.index, end: match.index + match[0].length },
          isValid: false,
          suggestion: 'Be specific about who said what, or remove the reference'
        });
      }
    }

    return vagueRefs;
  }

  generateReferenceSuggestions(
    currentSpeaker: string,
    conversationHistory: SimulationTurn[],
    topic: string
  ): string[] {
    const availableRefs = conversationTracker.getAvailableReferences(currentSpeaker, topic);
    
    return availableRefs.slice(0, 3).map(ref => 
      `When ${ref.speaker} said "${ref.statement.substring(0, 40)}..."`
    );
  }
}

export const referenceValidator = new ReferenceValidator();