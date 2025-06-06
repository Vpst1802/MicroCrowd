
export interface PersonaProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  location:string;
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
  generatedSummary: string; 
  sourceData?: Record<string, string>;
}

export type PartialPersonaProfile = Omit<PersonaProfile, 'id'>;

export enum SimulationType {
  FOCUS_GROUP = 'focus_group',
  ONE_ON_ONE_INTERVIEW = 'interview',
  SURVEY = 'survey',
  BRAINSTORMING = 'brainstorming',
  PRODUCT_TESTING = 'product_testing',
  ADVERTISEMENT_EVALUATION = 'ad_evaluation',
  AI_MODERATED_GROUP = 'ai_moderated_group', // New type for autonomous simulation
}

export interface NavItemType {
  name: string;
  path: string;
  icon: React.FC<{ className?: string }>;
}

export interface SimulationTurn {
  speaker: 'Moderator' | string; // Persona name or 'Moderator'
  text: string;
  timestamp: string; // ISO string for date
}

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'ended';

export interface SimulationSession {
  id: string;
  topic: string;
  personaIds: string[]; 
  transcript: SimulationTurn[];
  startTime: string; // ISO string
  endTime?: string; // ISO string, optional until simulation ends
  simulationType: SimulationType;
  
  // Fields for AI Moderator
  researchGoal: string;
  discussionGuide: string; // Key questions or topics for the AI moderator
  moderatorType: 'AI'; // For now, only AI moderator for autonomous mode
  maxTurns: number; // Max number of moderator-led interaction cycles
  currentTurnNumber: number;
  status: SimulationStatus;
}
