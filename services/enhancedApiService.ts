/**
 * Enhanced API Service for MicroCrowd Enhanced Python Backend
 * Provides interface to the sophisticated persona generation and conversation engine
 */

export interface EnhancedPersonaProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  location: string;
  occupation: {
    title: string;
    industry: string;
    experience: number;
    income: string;
  };
  personality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  personality_descriptions: {
    openness: string;
    conscientiousness: string;
    extraversion: string;
    agreeableness: string;
    neuroticism: string;
  };
  preferences: {
    interests: string[];
    hobbies: string[];
    values: string[];
    lifestyle: string;
  };
  behaviors: {
    communication_style: string;
    decision_making: string;
    technology_adoption: string;
    shopping_habits: string[];
  };
  goals: {
    short_term: string[];
    long_term: string[];
    fears: string[];
    aspirations: string[];
  };
  background: {
    education: string;
    family_status: string;
    life_stage: string;
    experiences: string[];
  };
  applied_fragments: string[];
  fragment_confidence_scores: Record<string, number>;
  communication_patterns: string[];
  participation_level: string;
  response_length_tendency: string;
  expertise_areas: string[];
  discussion_goals: string[];
  decision_factors: string[];
  pain_points: string[];
  emotional_triggers: string[];
  generated_summary: string;
  source_data?: Record<string, string>;
  created_at: string;
}

export interface PersonaGenerationResponse {
  success: boolean;
  data: {
    personas: EnhancedPersonaProfile[];
    summary: {
      successful_count: number;
      failed_count: number;
      warnings: string[];
      errors: string[];
      processing_summary: {
        csv_structure: any;
        personality_distribution: any;
        fragment_usage: Record<string, number>;
        demographic_distribution: any;
        data_quality_metrics: any;
      };
    };
  };
  message: string;
  errors?: string[];
}

export interface ConversationResponse {
  success: boolean;
  data: {
    conversation_id: string;
    status: string;
    participants: number;
    topic: string;
  };
  message: string;
}

export interface ConversationStatus {
  success: boolean;
  data: {
    conversation_id: string;
    status: string;
    current_turn: number;
    max_turns: number;
    stage: string;
    participant_count: number;
    transcript_length: number;
  };
  message: string;
}

export interface ConversationTranscript {
  success: boolean;
  data: {
    conversation_id: string;
    topic: string;
    research_goal: string;
    status: string;
    participants: string[];
    transcript: Array<{
      speaker: string;
      content: string;
      timestamp: string;
      turn_number: number;
      persona_id?: string;
      validation_score?: number;
    }>;
    total_turns: number;
    created_at: string;
    stage: string;
  };
  message: string;
}

class EnhancedApiService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to localhost
    // Set VITE_API_BASE_URL in your .env file to point to your enhanced backend
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  }

  /**
   * Generate enhanced personas from CSV data
   */
  async generatePersonasFromData(csvData: Record<string, string>[]): Promise<PersonaGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/personas/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csv_data: csvData,
          max_personas: csvData.length,
          apply_validation: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error generating personas:', error);
      throw new Error(`Failed to generate personas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload CSV file and generate personas
   */
  async uploadCsvFile(file: File, maxPersonas: number = 50): Promise<PersonaGenerationResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('max_personas', maxPersonas.toString());
      formData.append('apply_validation', 'true');

      const response = await fetch(`${this.baseUrl}/api/personas/upload-csv`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading CSV:', error);
      throw new Error(`Failed to upload CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available persona fragments
   */
  async getAvailableFragments() {
    try {
      const response = await fetch(`${this.baseUrl}/api/personas/fragments`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching fragments:', error);
      throw new Error(`Failed to fetch fragments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start a new conversation/focus group
   */
  async startConversation(
    topic: string,
    researchGoal: string,
    discussionGuide: string,
    participantPersonas: EnhancedPersonaProfile[],
    maxTurns: number = 20
  ): Promise<ConversationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/conversations/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          research_goal: researchGoal,
          discussion_guide: discussionGuide,
          participant_personas: participantPersonas,
          moderator_type: 'AI',
          max_turns: maxTurns
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw new Error(`Failed to start conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get conversation status
   */
  async getConversationStatus(conversationId: string): Promise<ConversationStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching conversation status:', error);
      throw new Error(`Failed to fetch conversation status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get conversation transcript
   */
  async getConversationTranscript(conversationId: string): Promise<ConversationTranscript> {
    try {
      const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}/transcript`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching conversation transcript:', error);
      throw new Error(`Failed to fetch conversation transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Control conversation (pause, resume, end)
   */
  async controlConversation(conversationId: string, action: 'pause' | 'resume' | 'end') {
    try {
      const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}/control`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error controlling conversation:', error);
      throw new Error(`Failed to control conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get active conversations
   */
  async getActiveConversations() {
    try {
      const response = await fetch(`${this.baseUrl}/api/conversations/active`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching active conversations:', error);
      throw new Error(`Failed to fetch active conversations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export conversation transcript
   */
  async exportConversationTranscript(conversationId: string, format: 'json' | 'txt' = 'txt'): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}/export?format=${format}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting conversation transcript:', error);
      throw new Error(`Failed to export transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate persona response
   */
  async validatePersonaResponse(
    personaData: EnhancedPersonaProfile,
    response: string,
    topic: string,
    conversationContext: any = {}
  ) {
    try {
      const apiResponse = await fetch(`${this.baseUrl}/api/validation/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          persona_data: personaData,
          response,
          topic,
          conversation_context: conversationContext
        }),
      });

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const result = await apiResponse.json();
      return result;
    } catch (error) {
      console.error('Error validating persona response:', error);
      throw new Error(`Failed to validate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get next AI response from a persona
   */
  async getNextAiResponse(conversationId: string, personaId?: string) {
    try {
      const url = personaId 
        ? `${this.baseUrl}/api/conversations/${conversationId}/next-response?persona_id=${personaId}`
        : `${this.baseUrl}/api/conversations/${conversationId}/next-response`;
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get next moderator response
   */
  async getModeratorResponse(conversationId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}/moderator-response`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error getting moderator response:', error);
      throw new Error(`Failed to get moderator response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add participant response to conversation
   */
  async addParticipantResponse(conversationId: string, personaId: string, response: string) {
    try {
      const apiResponse = await fetch(`${this.baseUrl}/api/conversations/${conversationId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          persona_id: personaId,
          response
        }),
      });

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const result = await apiResponse.json();
      return result;
    } catch (error) {
      console.error('Error adding participant response:', error);
      throw new Error(`Failed to add response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete/cleanup conversation
   */
  async deleteConversation(conversationId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.warn(`Failed to delete conversation ${conversationId}: ${response.status}`);
        return { success: false };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.warn('Error deleting conversation:', error);
      return { success: false };
    }
  }

  /**
   * Create WebSocket connection for real-time conversation updates
   */
  createConversationWebSocket(conversationId: string): WebSocket {
    const wsUrl = this.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    return new WebSocket(`${wsUrl}/api/conversations/ws/${conversationId}`);
  }

  /**
   * Check backend health
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error checking backend health:', error);
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export singleton instance
export const enhancedApiService = new EnhancedApiService();
export default enhancedApiService;