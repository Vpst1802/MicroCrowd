import { SimulationTurn, PersonaProfile } from '../types';

export interface ValidationResult {
  isValid: boolean;
  exactQuote?: string;
  confidence: number;
  errorMessage?: string;
}

export interface AvailableReference {
  speaker: string;
  statement: string;
  context: string;
  turnNumber: number;
  timestamp: string;
}

export class ConversationTracker {
  private conversationHistory: SimulationTurn[] = [];
  private participantStatements: Map<string, SimulationTurn[]> = new Map();

  constructor() {
    this.reset();
  }

  reset(): void {
    this.conversationHistory = [];
    this.participantStatements.clear();
  }

  addTurn(turn: SimulationTurn): void {
    this.conversationHistory.push(turn);
    
    if (turn.speaker !== 'Moderator') {
      if (!this.participantStatements.has(turn.speaker)) {
        this.participantStatements.set(turn.speaker, []);
      }
      this.participantStatements.get(turn.speaker)!.push(turn);
    }
  }

  validateReference(speaker: string, referenceText: string, referencedSpeaker: string): ValidationResult {
    if (speaker === referencedSpeaker) {
      return {
        isValid: false,
        confidence: 0,
        errorMessage: 'Cannot reference own statement'
      };
    }

    const referencedStatements = this.participantStatements.get(referencedSpeaker);
    if (!referencedStatements || referencedStatements.length === 0) {
      return {
        isValid: false,
        confidence: 0,
        errorMessage: `${referencedSpeaker} has not spoken yet`
      };
    }

    // Find the best matching statement using fuzzy matching
    let bestMatch: { statement: SimulationTurn; confidence: number } | null = null;
    
    for (const statement of referencedStatements) {
      const confidence = this.calculateSimilarity(referenceText.toLowerCase(), statement.text.toLowerCase());
      
      if (confidence > 0.6 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { statement, confidence };
      }
    }

    if (bestMatch) {
      return {
        isValid: true,
        exactQuote: bestMatch.statement.text,
        confidence: bestMatch.confidence
      };
    }

    return {
      isValid: false,
      confidence: 0,
      errorMessage: `Could not find matching statement from ${referencedSpeaker}`
    };
  }

  getAvailableReferences(speaker: string, topic: string): AvailableReference[] {
    const references: AvailableReference[] = [];
    
    for (const [participantName, statements] of Array.from(this.participantStatements.entries())) {
      if (participantName === speaker) continue; // Can't reference self
      
      for (const statement of statements) {
        // Filter for topic relevance
        const relevanceScore = this.calculateTopicRelevance(statement.text, topic);
        
        if (relevanceScore > 0.3) {
          references.push({
            speaker: participantName,
            statement: statement.text,
            context: this.getStatementContext(statement),
            turnNumber: statement.turn_number || 0,
            timestamp: statement.timestamp
          });
        }
      }
    }

    // Sort by recency (most recent first)
    return references.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  detectInvalidReferences(responseText: string, speaker: string): string[] {
    const issues: string[] = [];
    
    // Check for vague references
    const vaguePatterns = [
      /someone mentioned/i,
      /as was said/i,
      /like \w+ said/i,
      /earlier discussion/i,
      /building on what/i,
      /as discussed/i
    ];

    vaguePatterns.forEach(pattern => {
      if (pattern.test(responseText)) {
        issues.push(`Vague reference detected: "${responseText.match(pattern)?.[0]}"`);
      }
    });

    // Check for references to non-existent participants
    const participants = Array.from(this.participantStatements.keys());
    const namePattern = /\b([A-Z][a-z]+)\s+(said|mentioned|talked about)/gi;
    let match;
    
    while ((match = namePattern.exec(responseText)) !== null) {
      const referencedName = match[1];
      if (!participants.includes(referencedName) && referencedName !== 'Moderator') {
        issues.push(`Reference to non-existent participant: "${referencedName}"`);
      }
    }

    return issues;
  }

  getRecentHistory(limit: number = 5): SimulationTurn[] {
    return this.conversationHistory.slice(-limit);
  }

  getParticipantTurnCount(speaker: string): number {
    return this.participantStatements.get(speaker)?.length || 0;
  }

  hasParticipantSpokenAbout(speaker: string, topic: string): boolean {
    const statements = this.participantStatements.get(speaker);
    if (!statements) return false;

    return statements.some(statement => 
      this.calculateTopicRelevance(statement.text, topic) > 0.4
    );
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple word overlap similarity
    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 2));
    
    const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
    const union = new Set([...Array.from(words1), ...Array.from(words2)]);
    
    return intersection.size / union.size;
  }

  private calculateTopicRelevance(text: string, topic: string): number {
    const topicWords = topic.toLowerCase().split(/\s+/);
    const textWords = text.toLowerCase().split(/\s+/);
    
    let relevantWords = 0;
    topicWords.forEach(topicWord => {
      if (textWords.some(textWord => textWord.includes(topicWord) || topicWord.includes(textWord))) {
        relevantWords++;
      }
    });
    
    return relevantWords / topicWords.length;
  }

  private getStatementContext(statement: SimulationTurn): string {
    const index = this.conversationHistory.findIndex(turn => 
      turn.timestamp === statement.timestamp && turn.speaker === statement.speaker
    );
    
    if (index <= 0) return 'Opening statement';
    
    const previousTurn = this.conversationHistory[index - 1];
    return `In response to ${previousTurn.speaker}`;
  }
}

export const conversationTracker = new ConversationTracker();