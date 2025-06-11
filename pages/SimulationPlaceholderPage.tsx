
import React, { useState, useEffect, useRef } from 'react';
import { PersonaProfile, SimulationSession, SimulationTurn, SimulationType, SimulationStatus } from '../types';
import enhancedApiService from '../services/enhancedApiService';
import LoadingSpinner from '../components/LoadingSpinner';
import { PlayCircleIcon, UsersIcon, MessageIcon, WarningIcon, InfoIcon, TrashIcon } from '../constants';

// Helper to format transcript for download
const formatTranscriptForDownload = (simulation: SimulationSession, personasList: PersonaProfile[]): string => {
  let content = `Focus Group Transcript\n`;
  content += `==============================\n\n`;
  content += `Topic: ${simulation.topic}\n`;
  content += `Research Goal: ${simulation.researchGoal}\n`;
  
  const participantNames = simulation.personaIds
    .map(id => personasList.find(p => p.id === id)?.name || 'Unknown Persona')
    .join(', ');
  content += `Participants: ${participantNames}\n`;
  content += `Start Time: ${new Date(simulation.startTime).toLocaleString()}\n`;
  if (simulation.endTime) {
    content += `End Time: ${new Date(simulation.endTime).toLocaleString()}\n`;
  }
  content += `Total Moderator Turns: ${simulation.currentTurnNumber}\n\n`;
  content += `----------------------------------\n\n`;

  simulation.transcript.forEach(turn => {
    content += `[${new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] ${turn.speaker}:\n`;
    content += `${turn.text}\n\n`;
    content += `----------------------------------\n`;
  });

  return content;
};


interface SimulationsPageProps {
  personas: PersonaProfile[];
  saveSimulationSession: (session: SimulationSession) => void;
  currentSimulation: SimulationSession | null;
  setCurrentSimulation: (simulation: SimulationSession | null) => void;
}

const SimulationsPage: React.FC<SimulationsPageProps> = ({ personas, saveSimulationSession, currentSimulation: propCurrentSimulation, setCurrentSimulation: propSetCurrentSimulation }) => {
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([]);
  const [topic, setTopic] = useState<string>('');
  const [researchGoal, setResearchGoal] = useState<string>('');
  const [discussionGuide, setDiscussionGuide] = useState<string>('');
  const [maxTurns, setMaxTurns] = useState<number>(3); // Default to fewer turns for testing natural conversation
  
  const currentSimulation = propCurrentSimulation;
  const setCurrentSimulation = propSetCurrentSimulation;
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced backend state
  const [backendStatus, setBackendStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [enhancedConversationId, setEnhancedConversationId] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  const transcriptUpdateRef = useRef<SimulationTurn[]>([]); 
  const chatOutputRef = useRef<HTMLDivElement>(null);
  const currentSimulationRef = useRef<SimulationSession | null>(null);


  const handlePersonaSelect = (personaId: string) => {
    setSelectedPersonaIds(prev =>
      prev.includes(personaId) ? prev.filter(id => id !== personaId) : [...prev, personaId]
    );
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Check enhanced backend health on component mount
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const health = await enhancedApiService.checkHealth();
        if (health.status === 'healthy') {
          setBackendStatus('healthy');
        } else {
          setBackendStatus('unhealthy');
        }
      } catch (error) {
        console.error('Enhanced backend not available for simulations:', error);
        setBackendStatus('unhealthy');
      }
    };

    checkBackendHealth();
  }, []);
  
  useEffect(() => {
    if (currentSimulation) {
      transcriptUpdateRef.current = currentSimulation.transcript;
      currentSimulationRef.current = currentSimulation;
    }
  }, [currentSimulation?.transcript])

  useEffect(() => {
    currentSimulationRef.current = currentSimulation;
  }, [currentSimulation])

  useEffect(() => {
    if (chatOutputRef.current) {
      chatOutputRef.current.scrollTop = chatOutputRef.current.scrollHeight;
    }
  }, [currentSimulation?.transcript, isLoading]);


  const resetSetupForm = () => {
    setSelectedPersonaIds([]);
    setTopic('');
    setResearchGoal('');
    setDiscussionGuide('');
    setMaxTurns(3);
    setError(null);
    
    // Hard cache clearance for fresh start
    const currentConversationId = enhancedConversationId;
    setEnhancedConversationId(null);
    
    // Clear simulation-related cache
    localStorage.removeItem('currentSimulation');
    transcriptUpdateRef.current = [];
    
    // Force clear conversation memories on backend
    if (currentConversationId) {
      enhancedApiService.deleteConversation(currentConversationId).catch(console.warn);
    }
  };

  const startNewSimulationSetup = () => {
    setCurrentSimulation(null); 
    resetSetupForm();
  };

  const initiateSimulation = async () => {
    if (selectedPersonaIds.length === 0) {
      setError("Please select at least one persona."); return;
    }
    if (!topic.trim()) {
      setError("Please enter a simulation topic."); return;
    }
    if (!researchGoal.trim()) {
      setError("Please enter a research goal."); return;
    }
    if (!discussionGuide.trim()) {
      setError("Please provide a discussion guide or key topics."); return;
    }
    
    setError(null);
    setIsLoading(true);

    try {
      if (backendStatus !== 'healthy') {
        setError('Enhanced backend is not available. Please ensure the Python backend is running and accessible.');
        setIsLoading(false);
        return;
      }

      const selectedPersonas = personas.filter(p => selectedPersonaIds.includes(p.id));
      
      // Convert personas to enhanced format for the API
      const enhancedPersonas = selectedPersonas.map(persona => ({
        ...persona,
        personality_descriptions: persona.personality_descriptions || {
          openness: 'Standard openness level',
          conscientiousness: 'Standard conscientiousness level', 
          extraversion: 'Standard extraversion level',
          agreeableness: 'Standard agreeableness level',
          neuroticism: 'Standard neuroticism level'
        },
        applied_fragments: persona.applied_fragments || [],
        fragment_confidence_scores: persona.fragment_confidence_scores || {},
        communication_patterns: persona.communication_patterns || [],
        participation_level: persona.participation_level || 'medium',
        response_length_tendency: persona.response_length_tendency || 'moderate',
        expertise_areas: persona.expertise_areas || [],
        discussion_goals: persona.discussion_goals || [],
        decision_factors: persona.decision_factors || [],
        pain_points: persona.pain_points || [],
        emotional_triggers: persona.emotional_triggers || [],
        generated_summary: persona.generatedSummary,
        source_data: persona.sourceData || {},
        created_at: persona.created_at || new Date().toISOString()
      }));

      const conversationResponse = await enhancedApiService.startConversation(
        topic,
        researchGoal, 
        discussionGuide,
        enhancedPersonas,
        maxTurns
      );

      if (conversationResponse.success) {
        const conversationId = conversationResponse.data.conversation_id;
        setEnhancedConversationId(conversationId);

        // Get moderator opening message first
        const moderatorResponse = await enhancedApiService.getModeratorResponse(conversationId);
        
        const moderatorTurn: SimulationTurn = {
          speaker: 'Moderator',
          text: moderatorResponse.data?.content || 'Welcome to our focus group discussion.',
          content: moderatorResponse.data?.content,
          timestamp: new Date().toISOString(),
          turn_number: 0,
        };

        const newSession: SimulationSession = {
          id: crypto.randomUUID(), topic, researchGoal, discussionGuide, maxTurns,
          personaIds: selectedPersonaIds, transcript: [moderatorTurn], startTime: new Date().toISOString(),
          simulationType: SimulationType.AI_MODERATED_GROUP, moderatorType: 'AI',
          currentTurnNumber: 1, status: 'running',
          moderatorTurnCount: 1, // Track moderator turns separately
        };
        
        setCurrentSimulation(newSession);
        transcriptUpdateRef.current = newSession.transcript;
      } else {
        throw new Error(conversationResponse.message || 'Failed to start enhanced conversation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const appendToCurrentTurnText = (textChunk: string) => {
    if (!isMountedRef.current || !currentSimulationRef.current || transcriptUpdateRef.current.length === 0) return;
    if (currentSimulationRef.current.status !== 'running') return; // Stop appending if not running
    
    const lastTurnIndex = transcriptUpdateRef.current.length - 1;
    transcriptUpdateRef.current[lastTurnIndex].text += textChunk;

    setCurrentSimulation(sim => {
      if (!sim || sim.status !== 'running') return sim; // Preserve current state if not running
      const newTranscript = [...transcriptUpdateRef.current];
      return { ...sim, transcript: newTranscript };
    });
  };


  const runModeratorTurn = async () => {
    if (!currentSimulation || currentSimulation.status !== 'running' || !isMountedRef.current || !enhancedConversationId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get moderator response
      const response = await enhancedApiService.getModeratorResponse(enhancedConversationId);
      
      if (response.success && response.data) {
        const newTurn: SimulationTurn = {
          speaker: 'Moderator',
          text: response.data.content || '',
          content: response.data.content,
          timestamp: response.data.timestamp || new Date().toISOString(),
          turn_number: currentSimulation.currentTurnNumber,
        };

        transcriptUpdateRef.current = [...transcriptUpdateRef.current, newTurn];
        setCurrentSimulation(sim => {
          if (!sim) return null;
          const nextTurnNumber = sim.currentTurnNumber + 1;
          const nextModeratorTurnCount = (sim.moderatorTurnCount || 0) + 1;
          return { 
            ...sim, 
            transcript: transcriptUpdateRef.current, 
            currentTurnNumber: nextTurnNumber,
            moderatorTurnCount: nextModeratorTurnCount
          };
        });
      }
    } catch (err) {
      console.error('Error getting moderator response:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // TinyTroupe-style natural participant selection based on emergent behavior
  const selectNaturalResponder = (dynamics: any, currentSimulation: SimulationSession): string | null => {
    const participatingPersonas = personas.filter(p => currentSimulation.personaIds.includes(p.id));
    const recentSpeakers = currentSimulation.transcript.slice(-4).map(t => t.speaker).filter(s => s !== 'Moderator');
    
    // Calculate natural response probability based on multiple factors
    const responseWeights = participatingPersonas.map(persona => {
      let baseWeight = 1.0;
      
      // 1. Personality-driven natural tendencies
      const extraversionFactor = persona.personality.extraversion / 5; // 0.2 to 1.0
      const opennessFactor = persona.personality.openness / 5; // More open = more likely to engage with new ideas
      const conscientiousnessFactor = persona.personality.conscientiousness / 5; // More likely to contribute thoughtfully
      
      baseWeight = (extraversionFactor * 0.5) + (opennessFactor * 0.3) + (conscientiousnessFactor * 0.2);
      
      // 2. Topic relevance to persona background
      const topicRelevance = calculateTopicRelevance(persona, dynamics.emergingThemes);
      baseWeight *= (0.7 + topicRelevance * 0.6); // 0.7-1.3x multiplier
      
      // 3. Natural conversation flow factors
      const lastSpeaker = recentSpeakers[recentSpeakers.length - 1];
      if (lastSpeaker && lastSpeaker !== persona.name) {
        // More likely to respond if previous comment relates to their expertise/interests
        const relevanceToLastComment = assessRelevanceToPersona(persona, currentSimulation.transcript.slice(-1)[0]);
        baseWeight *= (0.8 + relevanceToLastComment * 0.4);
      }
      
      // 4. Current emotional state influence
      if (dynamics.groupEmotionalState.dominantEmotion === 'frustration' && persona.personality.neuroticism > 3) {
        baseWeight *= 1.3; // High neuroticism personas more likely to respond when frustrated
      }
      if (dynamics.groupEmotionalState.dominantEmotion === 'enthusiasm' && persona.personality.extraversion > 3) {
        baseWeight *= 1.4; // Extroverts jump on enthusiasm
      }
      
      // 5. Recent participation balance (natural self-regulation)
      const myRecentParticipation = recentSpeakers.filter(s => s === persona.name).length;
      if (myRecentParticipation > 2) {
        baseWeight *= 0.3; // Naturally step back if spoken a lot recently
      } else if (myRecentParticipation === 0 && recentSpeakers.length > 3) {
        baseWeight *= 1.5; // More likely to join if haven't spoken in a while
      }
      
      // 6. Natural silence probability (some people just don't respond sometimes)
      const silenceFactor = 0.6 + (persona.personality.extraversion * 0.08); // 60-100% chance to respond
      if (Math.random() > silenceFactor) {
        baseWeight = 0; // This persona stays quiet this turn
      }
      
      return { persona, weight: Math.max(0, baseWeight) };
    });
    
    // Natural selection based on weights
    const totalWeight = responseWeights.reduce((sum, w) => sum + w.weight, 0);
    if (totalWeight === 0) return null; // Natural silence from everyone
    
    let random = Math.random() * totalWeight;
    for (const { persona, weight } of responseWeights) {
      random -= weight;
      if (random <= 0) {
        return persona.id;
      }
    }
    
    return null;
  };
  
  const calculateTopicRelevance = (persona: PersonaProfile, themes: any[]) => {
    if (!themes.length) return 0.5;
    
    const relevanceFactors = {
      'economic_impact': persona.occupation.income.includes('$') ? 0.8 : 0.3,
      'government_role': persona.preferences.values.some(v => v.toLowerCase().includes('freedom') || v.toLowerCase().includes('control')) ? 0.9 : 0.4,
      'personal_responsibility': persona.personality.conscientiousness > 3 ? 0.8 : 0.4,
      'corporate_responsibility': persona.occupation.industry.toLowerCase().includes('business') ? 0.9 : 0.3,
      'scientific_uncertainty': persona.background.education.toLowerCase().includes('science') || persona.background.education.toLowerCase().includes('research') ? 0.9 : 0.2
    };
    
    const topTheme = themes[0]?.topic;
    return relevanceFactors[topTheme] || 0.5;
  };
  
  const assessRelevanceToPersona = (persona: PersonaProfile, lastTurn: SimulationTurn) => {
    if (!lastTurn) return 0.5;
    
    const text = lastTurn.text.toLowerCase();
    let relevance = 0.3; // Base relevance
    
    // Check if mentions relate to persona's background
    if (text.includes(persona.occupation.title.toLowerCase()) || 
        text.includes(persona.occupation.industry.toLowerCase())) {
      relevance += 0.4;
    }
    
    if (persona.preferences.interests.some(interest => 
        text.includes(interest.toLowerCase()))) {
      relevance += 0.3;
    }
    
    if (text.includes(persona.location.toLowerCase()) || 
        text.includes(persona.age.toString())) {
      relevance += 0.2;
    }
    
    return Math.min(1.0, relevance);
  };

  const runNaturalParticipantTurn = async (dynamics: any) => {
    if (!currentSimulation || currentSimulation.status !== 'running' || !isMountedRef.current || !enhancedConversationId) return;

    setIsLoading(true);
    setError(null);

    try {
      // TinyTroupe natural selection: Who would naturally respond?
      const selectedPersonaId = selectNaturalResponder(dynamics, currentSimulation);
      
      if (!selectedPersonaId) {
        // Natural silence - all participants chose not to respond this turn
        // This is realistic behavior! Wait a moment then let moderator gently encourage
        setIsLoading(false);
        setTimeout(() => {
          if (currentSimulationRef.current?.status === 'running') {
            executeModeratorIntervention('encourage_participation', dynamics);
          }
        }, 2000);
        return;
      }
      
      // Store conversation context for persona response generation
      const selectedPersona = personas.find(p => p.id === selectedPersonaId);
      if (!selectedPersona) {
        setIsLoading(false);
        return;
      }
      
      // Enhance persona context with current dynamics for more natural responses
      const enhancedContext = {
        conversationDynamics: dynamics,
        personalRelevance: calculateTopicRelevance(selectedPersona, dynamics.emergingThemes),
        groupEmotionalState: dynamics.groupEmotionalState,
        recentThemes: dynamics.emergingThemes.slice(0, 3),
        participationLevel: selectedPersona.personality.extraversion / 5
      };
      
      localStorage.setItem('currentPersonaContext', JSON.stringify(enhancedContext));
      
      // Get participant response with natural flow principles
      const response = await enhancedApiService.getNextAiResponse(enhancedConversationId, selectedPersonaId);
      
      if (response.success && response.data) {
        const responseText = response.data.content || response.data.text || '';
        const participantNames = personas.filter(p => currentSimulation.personaIds.includes(p.id)).map(p => p.name);
        const selectedPersona = personas.find(p => p.id === selectedPersonaId);
        
        if (!selectedPersona) {
          setIsLoading(false);
          return;
        }
        
        // TinyTroupe-style processing: Track, validate, and enhance
        
        // 1. Log this statement for conversation tracking
        const currentTopic = controversyManager.detectControversialTopic(responseText) || 'general_discussion';
        conversationTracker.logStatement(selectedPersona.name, responseText, currentSimulation.currentTurnNumber, currentTopic);
        
        // 2. Validate any references in the response
        const validateResponse = (text: string): string => {
          let cleanedText = text;
          
          // Check for references to other participants
          const referencePattern = /\b(like|as)\s+([A-Z][a-z]+)\s+(said|mentioned|thinks?)\b/gi;
          const references = text.match(referencePattern) || [];
          
          references.forEach(reference => {
            const match = reference.match(/\b(like|as)\s+([A-Z][a-z]+)\s+(said|mentioned|thinks?)\b/i);
            if (match) {
              const referencedSpeaker = match[2];
              const referenceText = match[3];
              
              if (participantNames.includes(referencedSpeaker)) {
                // Validate this reference against actual statements
                const validation = conversationTracker.validateReference(
                  selectedPersona.name,
                  referenceText,
                  referencedSpeaker,
                  currentTopic
                );
                
                if (!validation.valid) {
                  // Replace with accurate statement or remove
                  const accurateReference = conversationTracker.generateAccurateReference(
                    selectedPersona.name,
                    currentTopic,
                    referencedSpeaker
                  );
                  cleanedText = cleanedText.replace(reference, accurateReference);
                }
              } else {
                // Remove phantom participant reference
                cleanedText = cleanedText.replace(reference, 'I think');
              }
            }
          });
          
          // Clean up vague references
          const vaguePatterns = [
            /\bas\s+(someone|somebody)\s+(mentioned|said)\s+earlier\b/gi,
            /\blike\s+was\s+(mentioned|discussed)\s+earlier\b/gi,
            /\bbuilding\s+on\s+what\s+was\s+said\b/gi
          ];
          
          vaguePatterns.forEach(pattern => {
            cleanedText = cleanedText.replace(pattern, 'I think');
          });
          
          return cleanedText.replace(/\s+/g, ' ').trim();
        };
        
        // 3. Check for controversial topics and assign positions if needed
        const controversialTopic = controversyManager.detectControversialTopic(responseText);
        let enhancedResponse = responseText;
        
        if (controversialTopic) {
          const participantPersonas = personas.filter(p => currentSimulation.personaIds.includes(p.id));
          const controversialPositions = controversyManager.assignControversialPositions(participantPersonas, controversialTopic);
          
          const participantStance = controversialPositions[selectedPersona.name];
          if (participantStance) {
            // Store controversial stance for future reference
            localStorage.setItem(`stance_${selectedPersona.name}_${controversialTopic}`, JSON.stringify(participantStance));
            
            // Check if response aligns with their stance - if too agreeable, inject disagreement
            const isArtificiallyAgreeable = responseText.toLowerCase().includes('i agree') || 
                                          responseText.toLowerCase().includes('totally') ||
                                          responseText.toLowerCase().includes('building on');
            
            if (isArtificiallyAgreeable && participantStance.stanceStrength > 0.5) {
              // Generate authentic disagreement based on their stance
              const lastTurn = currentSimulation.transcript[currentSimulation.transcript.length - 1];
              if (lastTurn && lastTurn.speaker !== selectedPersona.name) {
                const disagreementPrompt = controversyManager.generateDisagreementPrompt(
                  selectedPersona,
                  controversialTopic,
                  { speaker: lastTurn.speaker, position: lastTurn.text },
                  participantStance
                );
                
                // Replace artificial agreement with authentic disagreement
                enhancedResponse = `I have to disagree with that. ${participantStance.stance.arguments[0]}. ${participantStance.personalConnections[0] ? `As someone who ${participantStance.personalConnections[0]}, ` : ''}I think ${participantStance.stance.concerns[0]}.`;
              }
            }
          }
        }
        
        // 4. Generate human behaviors and apply them
        const conversationContext = {
          currentTopic,
          lastStatement: currentSimulation.transcript[currentSimulation.transcript.length - 1],
          currentSpeaker: selectedPersona.name,
          recentSpeakers: currentSimulation.transcript.slice(-4).map(t => t.speaker)
        };
        
        const humanBehaviors = humanDynamicsEngine.generateHumanBehaviors(
          selectedPersona,
          conversationContext,
          currentSimulation.currentTurnNumber
        );
        
        // Apply validation and human behaviors
        const validatedText = validateResponse(enhancedResponse);
        const finalResponse = humanDynamicsEngine.generateAuthenticResponseWithBehaviors(
          selectedPersona,
          validatedText,
          humanBehaviors
        );
        
        const newTurn: SimulationTurn = {
          speaker: selectedPersona.name,
          text: finalResponse,
          content: finalResponse,
          timestamp: new Date().toISOString(),
          turn_number: currentSimulation.currentTurnNumber,
          persona_id: selectedPersonaId,
          validation_score: response.data.validation_score
        };

        transcriptUpdateRef.current = [...transcriptUpdateRef.current, newTurn];
        setCurrentSimulation(sim => {
          if (!sim) return null;
          const nextTurnNumber = sim.currentTurnNumber + 1;
          return { ...sim, transcript: transcriptUpdateRef.current, currentTurnNumber: nextTurnNumber };
        });
      }
    } catch (err) {
      console.error('Error getting participant response:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // TinyTroupe-inspired Conversation Tracking System
  interface StatementRecord {
    id: string;
    speaker: string;
    content: string;
    turn: number;
    topic: string;
    timestamp: string;
    keyPoints: string[];
    quotableContent: string[];
  }
  
  const conversationTracker = {
    conversationLog: [] as StatementRecord[],
    speakerStatements: {} as Record<string, StatementRecord[]>,
    topicAssociations: {} as Record<string, StatementRecord[]>,
    
    logStatement: (speaker: string, content: string, turnNumber: number, topic: string) => {
      const statementId = `${speaker}_${turnNumber}`;
      const keyPoints = extractKeyPoints(content);
      const quotableContent = extractQuotableContent(content);
      
      const statementRecord: StatementRecord = {
        id: statementId,
        speaker,
        content,
        turn: turnNumber,
        topic,
        timestamp: new Date().toISOString(),
        keyPoints,
        quotableContent
      };
      
      conversationTracker.conversationLog.push(statementRecord);
      
      // Update speaker tracking
      if (!conversationTracker.speakerStatements[speaker]) {
        conversationTracker.speakerStatements[speaker] = [];
      }
      conversationTracker.speakerStatements[speaker].push(statementRecord);
      
      // Update topic associations
      if (!conversationTracker.topicAssociations[topic]) {
        conversationTracker.topicAssociations[topic] = [];
      }
      conversationTracker.topicAssociations[topic].push(statementRecord);
    },
    
    validateReference: (referringSpeaker: string, referenceText: string, referencedSpeaker: string, topic: string) => {
      const referencedStatements = conversationTracker.speakerStatements[referencedSpeaker] || [];
      
      // Check if reference matches actual content
      for (const statement of referencedStatements) {
        if (contentMatchesReference(statement.content, referenceText) ||
            statement.keyPoints.some(point => point.toLowerCase().includes(referenceText.toLowerCase())) ||
            statement.quotableContent.some(quote => quote.toLowerCase().includes(referenceText.toLowerCase()))) {
          return {
            valid: true,
            actualStatement: statement.content,
            turnNumber: statement.turn,
            topic: statement.topic,
            exactQuote: findBestQuote(statement, referenceText)
          };
        }
      }
      
      return {
        valid: false,
        error: `${referencedSpeaker} never said anything matching '${referenceText}' about ${topic}`,
        availableTopics: referencedStatements.map(s => s.topic),
        recentStatements: referencedStatements.slice(-2).map(s => s.keyPoints[0] || 'general comment')
      };
    },
    
    generateAccurateReference: (currentSpeaker: string, topic: string, referencedSpeaker: string) => {
      const relevantStatements = conversationTracker.speakerStatements[referencedSpeaker]?.filter(
        statement => statement.topic === topic
      ) || [];
      
      if (relevantStatements.length === 0) {
        const availableTopics = conversationTracker.speakerStatements[referencedSpeaker]?.map(s => s.topic) || [];
        if (availableTopics.length === 0) {
          return `I don't recall ${referencedSpeaker} mentioning anything about ${topic} yet`;
        } else {
          return `I don't think ${referencedSpeaker} has talked about ${topic}, though they mentioned ${availableTopics[availableTopics.length - 1]}`;
        }
      }
      
      // Reference the most recent relevant statement with exact quote
      const latestStatement = relevantStatements[relevantStatements.length - 1];
      const bestQuote = latestStatement.quotableContent[0] || latestStatement.keyPoints[0] || 'that point';
      
      return `Like ${referencedSpeaker} said earlier: "${bestQuote}"`;
    },
    
    getConversationSummary: () => {
      return {
        totalStatements: conversationTracker.conversationLog.length,
        speakerCounts: Object.entries(conversationTracker.speakerStatements).reduce((counts, [speaker, statements]) => {
          counts[speaker] = statements.length;
          return counts;
        }, {} as Record<string, number>),
        topicCoverage: Object.keys(conversationTracker.topicAssociations),
        recentStatements: conversationTracker.conversationLog.slice(-3)
      };
    }
  };
  
  const extractKeyPoints = (content: string): string[] => {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.map(sentence => sentence.trim().substring(0, 100)).filter(s => s.length > 0);
  };
  
  const extractQuotableContent = (content: string): string[] => {
    // Extract meaningful quotes that can be referenced
    const meaningfulPhrases = [];
    
    // Extract key statements (sentences with strong opinions, facts, or positions)
    const strongStatements = content.match(/\b(I (believe|think|feel|know)|this is|we should|the problem is|the solution is)[^.!?]*[.!?]/gi) || [];
    meaningfulPhrases.push(...strongStatements.map(s => s.replace(/[.!?]+$/, '').trim()));
    
    // Extract numerical facts or specific claims
    const factualClaims = content.match(/\b\d+[^.!?]*[.!?]|\b(research shows|studies indicate|data suggests)[^.!?]*[.!?]/gi) || [];
    meaningfulPhrases.push(...factualClaims.map(s => s.replace(/[.!?]+$/, '').trim()));
    
    // Limit to 3 most relevant quotes
    return meaningfulPhrases.slice(0, 3).filter(phrase => phrase.length > 20 && phrase.length < 150);
  };
  
  const contentMatchesReference = (actualContent: string, referenceText: string): boolean => {
    const actualLower = actualContent.toLowerCase();
    const referenceLower = referenceText.toLowerCase();
    
    // Check for direct word matches (at least 3 significant words)
    const referenceWords = referenceLower.split(/\s+/).filter(word => word.length > 3);
    const matchingWords = referenceWords.filter(word => actualLower.includes(word));
    
    return matchingWords.length >= Math.min(3, referenceWords.length * 0.6);
  };
  
  const findBestQuote = (statement: StatementRecord, referenceText: string): string => {
    // Find the best matching quote from the statement
    for (const quote of statement.quotableContent) {
      if (contentMatchesReference(quote, referenceText)) {
        return quote;
      }
    }
    
    for (const point of statement.keyPoints) {
      if (contentMatchesReference(point, referenceText)) {
        return point;
      }
    }
    
    return statement.keyPoints[0] || 'that point';
  };

  // TinyTroupe-inspired Controversy Manager
  interface ControversialTopic {
    name: string;
    polarizingAspects: string[];
    typicalViewpoints: Record<string, {
      position: string;
      arguments: string[];
      concerns: string[];
      emotionalTriggers: string[];
    }>;
  }
  
  const controversyManager = {
    controversialTopics: {
      'russia_ukraine_conflict': {
        name: 'Russia-Ukraine Conflict',
        polarizingAspects: [
          'military_aid_levels',
          'nato_involvement',
          'sanctions_effectiveness', 
          'negotiation_vs_resistance',
          'refugee_support_scope',
          'energy_independence_costs',
          'nuclear_escalation_risks'
        ],
        typicalViewpoints: {
          'interventionist': {
            position: 'Strong Western support necessary',
            arguments: ['Defending democracy', 'Preventing further aggression', 'NATO Article 5 obligations'],
            concerns: ['Escalation risks', 'Resource allocation', 'War fatigue'],
            emotionalTriggers: ['Freedom', 'Tyranny', 'Democratic values']
          },
          'isolationist': {
            position: 'Focus on domestic priorities',
            arguments: ['America first', 'Avoid foreign entanglements', 'Border security priority'],
            concerns: ['Military industrial complex', 'Tax burden', 'Nuclear war risk'],
            emotionalTriggers: ['National sovereignty', 'Working class struggles', 'Government waste']
          },
          'pragmatist': {
            position: 'Balanced, measured response',
            arguments: ['Strategic interests', 'Diplomatic solutions', 'Multilateral approach'],
            concerns: ['Long-term stability', 'Unintended consequences', 'Alliance coordination'],
            emotionalTriggers: ['Complexity', 'Nuance', 'Historical precedent']
          }
        }
      } as ControversialTopic,
      
      'climate_change': {
        name: 'Climate Change Policy',
        polarizingAspects: [
          'economic_impact',
          'government_regulation',
          'individual_responsibility',
          'corporate_accountability',
          'scientific_consensus',
          'international_cooperation'
        ],
        typicalViewpoints: {
          'environmental_activist': {
            position: 'Urgent action required regardless of cost',
            arguments: ['Scientific consensus', 'Future generations', 'Irreversible damage'],
            concerns: ['Time running out', 'Corporate resistance', 'Political inaction'],
            emotionalTriggers: ['Planetary survival', 'Moral obligation', 'Children\'s future']
          },
          'economic_pragmatist': {
            position: 'Balance environmental goals with economic reality',
            arguments: ['Job preservation', 'Economic competitiveness', 'Gradual transition'],
            concerns: ['Industry collapse', 'Working class impact', 'International competition'],
            emotionalTriggers: ['Economic security', 'Family livelihood', 'American competitiveness']
          },
          'skeptic': {
            position: 'Question climate policies and their effectiveness',
            arguments: ['Natural climate variation', 'Policy ineffectiveness', 'Economic damage'],
            concerns: ['Government overreach', 'Flawed science', 'Elite manipulation'],
            emotionalTriggers: ['Personal freedom', 'Government control', 'Elite hypocrisy']
          }
        }
      } as ControversialTopic
    } as Record<string, ControversialTopic>,
    
    detectControversialTopic: (content: string): string | null => {
      const contentLower = content.toLowerCase();
      
      // Russia-Ukraine keywords
      if (contentLower.includes('ukraine') || contentLower.includes('russia') || 
          contentLower.includes('putin') || contentLower.includes('nato') ||
          contentLower.includes('military aid') || contentLower.includes('sanctions')) {
        return 'russia_ukraine_conflict';
      }
      
      // Climate change keywords
      if (contentLower.includes('climate') || contentLower.includes('environment') ||
          contentLower.includes('carbon') || contentLower.includes('emissions') ||
          contentLower.includes('global warming') || contentLower.includes('green energy')) {
        return 'climate_change';
      }
      
      return null;
    },
    
    assignControversialPositions: (personas: PersonaProfile[], topic: string) => {
      const topicInfo = controversyManager.controversialTopics[topic];
      if (!topicInfo) return {};
      
      const assignments: Record<string, any> = {};
      const viewpoints = Object.keys(topicInfo.typicalViewpoints);
      
      personas.forEach((persona, index) => {
        const viewpoint = controversyManager.determineViewpoint(persona, topicInfo);
        assignments[persona.name] = {
          viewpoint,
          stance: topicInfo.typicalViewpoints[viewpoint],
          stanceStrength: controversyManager.calculateStanceStrength(persona),
          personalConnections: controversyManager.findPersonalConnections(persona, topic),
          emotionalInvestment: controversyManager.calculateEmotionalInvestment(persona, viewpoint, topicInfo)
        };
      });
      
      // Ensure we have disagreement - force different viewpoints
      const assignedViewpoints = Object.values(assignments).map((a: any) => a.viewpoint);
      const uniqueViewpoints = new Set(assignedViewpoints);
      
      if (uniqueViewpoints.size === 1) {
        // Force disagreement by reassigning someone to a different viewpoint
        const personaNames = Object.keys(assignments);
        const personaToReassign = personaNames[1] || personaNames[0];
        const currentViewpoint = assignments[personaToReassign].viewpoint;
        const alternativeViewpoint = viewpoints.find(v => v !== currentViewpoint) || viewpoints[1];
        
        assignments[personaToReassign].viewpoint = alternativeViewpoint;
        assignments[personaToReassign].stance = topicInfo.typicalViewpoints[alternativeViewpoint];
        assignments[personaToReassign].forcedDisagreement = true;
      }
      
      return assignments;
    },
    
    determineViewpoint: (persona: PersonaProfile, topicInfo: ControversialTopic): string => {
      // Military/government background -> more interventionist on foreign policy
      if (persona.occupation.industry.toLowerCase().includes('military') || 
          persona.occupation.industry.toLowerCase().includes('government') ||
          persona.occupation.title.toLowerCase().includes('veteran')) {
        return topicInfo.name.includes('Ukraine') ? 'interventionist' : 'environmental_activist';
      }
      
      // Working class, rural, lower income -> more isolationist/skeptical
      if (persona.location.toLowerCase().includes('rural') ||
          parseInt(persona.occupation.income.replace(/[^0-9]/g, '')) < 50000 ||
          persona.occupation.industry.toLowerCase().includes('manufacturing')) {
        return topicInfo.name.includes('Ukraine') ? 'isolationist' : 'economic_pragmatist';
      }
      
      // Urban professionals, higher education -> more pragmatist/activist
      if (persona.background.education.toLowerCase().includes('graduate') ||
          persona.location.toLowerCase().includes('urban') ||
          parseInt(persona.occupation.income.replace(/[^0-9]/g, '')) > 80000) {
        return topicInfo.name.includes('Ukraine') ? 'pragmatist' : 'environmental_activist';
      }
      
      // Conservative values -> more skeptical positions
      if (persona.preferences.values.some(v => v.toLowerCase().includes('traditional') ||
                                             v.toLowerCase().includes('freedom') ||
                                             v.toLowerCase().includes('self-reliance'))) {
        return topicInfo.name.includes('Ukraine') ? 'isolationist' : 'skeptic';
      }
      
      // Default distribution
      const viewpoints = Object.keys(topicInfo.typicalViewpoints);
      return viewpoints[Math.floor(Math.random() * viewpoints.length)];
    },
    
    calculateStanceStrength: (persona: PersonaProfile): number => {
      // Based on personality traits
      let strength = 0.5;
      
      if (persona.personality.openness < 3) strength += 0.2; // Less open = stronger positions
      if (persona.personality.neuroticism > 3) strength += 0.2; // More neurotic = more emotional
      if (persona.personality.agreeableness < 3) strength += 0.3; // Less agreeable = more confrontational
      
      return Math.min(1.0, strength);
    },
    
    findPersonalConnections: (persona: PersonaProfile, topic: string): string[] => {
      const connections = [];
      
      if (topic === 'russia_ukraine_conflict') {
        if (persona.occupation.industry.includes('military')) connections.push('Military service background');
        if (persona.background.family_status.includes('married')) connections.push('Concerns about military-age family members');
        if (persona.occupation.industry.includes('energy')) connections.push('Energy sector impact concerns');
        if (persona.location.includes('Eastern') || persona.background.experiences.some(e => e.includes('immigrant'))) {
          connections.push('Eastern European heritage');
        }
      }
      
      if (topic === 'climate_change') {
        if (persona.occupation.industry.includes('energy') || persona.occupation.industry.includes('oil')) {
          connections.push('Works in energy sector');
        }
        if (persona.location.includes('coastal')) connections.push('Lives in coastal area affected by sea level rise');
        if (persona.preferences.interests.includes('outdoor activities')) connections.push('Outdoor recreation enthusiast');
      }
      
      return connections;
    },
    
    calculateEmotionalInvestment: (persona: PersonaProfile, viewpoint: string, topicInfo: ControversialTopic): number => {
      let investment = 0.3; // Base level
      
      const stanceInfo = topicInfo.typicalViewpoints[viewpoint];
      
      // Check if persona's values align with emotional triggers
      stanceInfo.emotionalTriggers.forEach(trigger => {
        if (persona.preferences.values.some(value => 
          value.toLowerCase().includes(trigger.toLowerCase()) ||
          trigger.toLowerCase().includes(value.toLowerCase())
        )) {
          investment += 0.2;
        }
      });
      
      // Personality factors
      if (persona.personality.neuroticism > 3) investment += 0.2;
      if (persona.personality.extraversion > 3) investment += 0.1;
      
      return Math.min(1.0, investment);
    },
    
    generateDisagreementPrompt: (persona: PersonaProfile, topic: string, opposingViewpoint: any, personalStance: any): string => {
      return `
CONTROVERSIAL TOPIC DETECTED: ${topic}

You just heard an opposing viewpoint: "${opposingViewpoint.position}"

YOUR AUTHENTIC STANCE:
- Position: ${personalStance.stance.position}
- Your arguments: ${personalStance.stance.arguments.join(', ')}
- Your concerns: ${personalStance.stance.concerns.join(', ')}
- Personal connections: ${personalStance.personalConnections.join(', ')}
- Emotional investment: ${personalStance.emotionalInvestment > 0.6 ? 'HIGH' : personalStance.emotionalInvestment > 0.3 ? 'MEDIUM' : 'LOW'}

You MUST disagree authentically based on your background and values.

DISAGREEMENT STYLES:
- Direct challenge: "I completely disagree because..."
- Experience-based: "That's not what I've seen in my experience as [occupation]..."
- Value-based: "That goes against everything I believe about [core value]..."
- Emotional: "I find it concerning that you would suggest [specific concern]..."
- Personal: "As someone who [personal connection], I can't accept that..."

Express your disagreement with genuine conviction and specific reasoning.
`;
    }
  };

  // TinyTroupe-inspired Human Dynamics Engine
  interface HumanDynamicsProfile {
    primaryStyle: 'dominating' | 'withdrawn' | 'emotional' | 'analytical';
    behaviors: {
      interruptionLikelihood: number;
      responseLength: 'short' | 'medium' | 'long' | 'variable';
      emotionalVolatility: number;
      participationPattern: string;
    };
    currentEmotionalState: 'neutral' | 'excited' | 'frustrated' | 'withdrawn' | 'passionate';
    participationFatigue: number;
    topicEngagement: Record<string, number>;
  }
  
  const humanDynamicsEngine = {
    personalityStyles: {
      'dominating': {
        behaviors: ['interrupts_frequently', 'long_responses', 'redirects_conversation'],
        triggers: ['passionate_topics', 'expertise_areas', 'challenged_authority'],
        responseLength: 'long',
        interruptionLikelihood: 0.7,
        emotionalVolatility: 0.6,
        participationPattern: 'high_frequency'
      },
      'withdrawn': {
        behaviors: ['minimal_responses', 'agrees_to_avoid_conflict', 'waits_to_be_asked'],
        triggers: ['uncomfortable_topics', 'group_conflict', 'personal_experiences'],
        responseLength: 'short',
        interruptionLikelihood: 0.1,
        emotionalVolatility: 0.3,
        participationPattern: 'low_frequency'
      },
      'emotional': {
        behaviors: ['passionate_responses', 'personal_stories', 'voice_changes'],
        triggers: ['family_impact', 'moral_issues', 'personal_values'],
        responseLength: 'variable',
        interruptionLikelihood: 0.5,
        emotionalVolatility: 0.9,
        participationPattern: 'topic_dependent'
      },
      'analytical': {
        behaviors: ['fact_checking', 'asks_clarifying_questions', 'systematic_responses'],
        triggers: ['unclear_information', 'logical_inconsistencies'],
        responseLength: 'medium',
        interruptionLikelihood: 0.3,
        emotionalVolatility: 0.2,
        participationPattern: 'consistent_moderate'
      }
    },
    
    assignDynamicsProfile: (persona: PersonaProfile): HumanDynamicsProfile => {
      let primaryStyle: 'dominating' | 'withdrawn' | 'emotional' | 'analytical';
      
      // Map personality traits to dynamics
      if (persona.personality.extraversion >= 4 && persona.personality.agreeableness <= 3) {
        primaryStyle = 'dominating';
      } else if (persona.personality.extraversion <= 2 || persona.personality.neuroticism >= 4) {
        primaryStyle = 'withdrawn';
      } else if (persona.personality.neuroticism >= 3 && persona.personality.openness >= 4) {
        primaryStyle = 'emotional';
      } else {
        primaryStyle = 'analytical';
      }
      
      const styleConfig = humanDynamicsEngine.personalityStyles[primaryStyle];
      
      return {
        primaryStyle,
        behaviors: {
          interruptionLikelihood: styleConfig.interruptionLikelihood,
          responseLength: styleConfig.responseLength as any,
          emotionalVolatility: styleConfig.emotionalVolatility,
          participationPattern: styleConfig.participationPattern
        },
        currentEmotionalState: 'neutral',
        participationFatigue: 0,
        topicEngagement: {}
      };
    },
    
    generateHumanBehaviors: (persona: PersonaProfile, conversationContext: any, currentTurn: number): string[] => {
      const dynamics = humanDynamicsEngine.assignDynamicsProfile(persona);
      const currentTopic = conversationContext.currentTopic || 'general';
      const lastStatement = conversationContext.lastStatement;
      const behaviors: string[] = [];
      
      // Check for interruption
      if (humanDynamicsEngine.shouldInterrupt(dynamics, conversationContext, persona)) {
        behaviors.push('interrupt');
      }
      
      // Check for emotional reaction
      const emotionalTrigger = humanDynamicsEngine.checkEmotionalTriggers(persona, currentTopic, lastStatement);
      if (emotionalTrigger) {
        behaviors.push(`emotional_reaction:${emotionalTrigger}`);
      }
      
      // Determine participation level
      const participationLevel = humanDynamicsEngine.determineParticipationLevel(persona, dynamics, currentTurn);
      behaviors.push(`participation:${participationLevel}`);
      
      // Check for conversation tangent
      if (humanDynamicsEngine.shouldCreateTangent(persona, conversationContext)) {
        const tangent = humanDynamicsEngine.generateTangent(persona, currentTopic);
        behaviors.push(`tangent:${tangent}`);
      }
      
      // Check for personal story injection
      if (humanDynamicsEngine.shouldSharePersonalStory(persona, currentTopic)) {
        behaviors.push('personal_story');
      }
      
      return behaviors;
    },
    
    shouldInterrupt: (dynamics: HumanDynamicsProfile, conversationContext: any, persona: PersonaProfile): boolean => {
      let interruptionChance = dynamics.behaviors.interruptionLikelihood;
      
      const lastStatement = conversationContext.lastStatement;
      const currentSpeaker = conversationContext.currentSpeaker;
      
      // Increase chance if they disagree strongly
      if (lastStatement && humanDynamicsEngine.stronglyDisagreesWith(persona, lastStatement)) {
        interruptionChance *= 2.0;
      }
      
      // Increase chance if topic matches their expertise/passion
      const topicRelevance = humanDynamicsEngine.calculateTopicRelevance(persona, conversationContext.currentTopic);
      if (topicRelevance > 0.7) {
        interruptionChance *= 1.5;
      }
      
      // Reduce chance if they've been dominating
      const recentParticipation = conversationContext.recentSpeakers?.filter((s: string) => s === persona.name).length || 0;
      if (recentParticipation > 2) {
        interruptionChance *= 0.3;
      }
      
      return Math.random() < interruptionChance;
    },
    
    checkEmotionalTriggers: (persona: PersonaProfile, topic: string, lastStatement?: any): string | null => {
      if (!lastStatement) return null;
      
      const triggers = {
        'passionate': ['family', 'children', 'military', 'freedom', 'democracy'],
        'frustrated': ['bureaucracy', 'corruption', 'waste', 'ineffective'],
        'excited': ['innovation', 'opportunity', 'progress', 'solution'],
        'concerned': ['threat', 'danger', 'risk', 'problem', 'crisis']
      };
      
      const statementLower = lastStatement.text?.toLowerCase() || '';
      
      for (const [emotion, words] of Object.entries(triggers)) {
        if (words.some(word => statementLower.includes(word))) {
          // Check if this emotion aligns with persona's personality
          if (emotion === 'passionate' && persona.personality.neuroticism > 3) return 'passionate';
          if (emotion === 'frustrated' && persona.personality.agreeableness < 3) return 'frustrated';
          if (emotion === 'excited' && persona.personality.extraversion > 3) return 'excited';
          if (emotion === 'concerned' && persona.personality.neuroticism > 2) return 'concerned';
        }
      }
      
      return null;
    },
    
    determineParticipationLevel: (persona: PersonaProfile, dynamics: HumanDynamicsProfile, currentTurn: number): string => {
      const baseParticipation = persona.personality.extraversion / 5;
      let adjustedLevel = baseParticipation;
      
      // Factor in fatigue
      const fatigueEffect = Math.max(0, currentTurn - 5) * 0.05;
      adjustedLevel -= fatigueEffect;
      
      // Factor in dynamics style
      if (dynamics.primaryStyle === 'dominating') adjustedLevel += 0.3;
      if (dynamics.primaryStyle === 'withdrawn') adjustedLevel -= 0.4;
      
      if (adjustedLevel < 0.3) return 'minimal';
      if (adjustedLevel < 0.6) return 'moderate';
      return 'high';
    },
    
    shouldCreateTangent: (persona: PersonaProfile, conversationContext: any): boolean => {
      // More likely if open to experience and extraverted
      const tangentChance = (persona.personality.openness / 5) * (persona.personality.extraversion / 5) * 0.3;
      return Math.random() < tangentChance;
    },
    
    generateTangent: (persona: PersonaProfile, currentTopic: string): string => {
      const personalConnections = [
        `my experience as a ${persona.occupation.title}`,
        `what happened in ${persona.location}`,
        `when I was ${Math.max(18, persona.age - 10)}`,
        `my family's situation`,
        `people in my industry`
      ];
      
      return personalConnections[Math.floor(Math.random() * personalConnections.length)];
    },
    
    shouldSharePersonalStory: (persona: PersonaProfile, topic: string): boolean => {
      // More likely if topic relates to their background
      const relevance = humanDynamicsEngine.calculateTopicRelevance(persona, topic);
      const storyChance = relevance * (persona.personality.extraversion / 5) * 0.4;
      return Math.random() < storyChance;
    },
    
    stronglyDisagreesWith: (persona: PersonaProfile, statement: any): boolean => {
      if (!statement?.text) return false;
      
      // Check if statement conflicts with persona's values or background
      const statementLower = statement.text.toLowerCase();
      
      // Economic disagreements
      if (persona.occupation.income.includes('$') && parseInt(persona.occupation.income.replace(/[^0-9]/g, '')) < 50000) {
        if (statementLower.includes('spend more') || statementLower.includes('increase funding')) {
          return true;
        }
      }
      
      // Value-based disagreements
      const conservativeValues = ['traditional', 'freedom', 'self-reliance', 'family'];
      const liberalValues = ['progressive', 'equality', 'social justice', 'environment'];
      
      const personaValues = persona.preferences.values.map(v => v.toLowerCase());
      const hasConservativeValues = conservativeValues.some(v => personaValues.includes(v));
      const hasLiberalValues = liberalValues.some(v => personaValues.includes(v));
      
      if (hasConservativeValues && statementLower.includes('government should')) return true;
      if (hasLiberalValues && statementLower.includes('free market')) return true;
      
      return false;
    },
    
    calculateTopicRelevance: (persona: PersonaProfile, topic: string): number => {
      if (!topic) return 0.3;
      
      let relevance = 0.3;
      const topicLower = topic.toLowerCase();
      
      // Occupation relevance
      if (topicLower.includes('military') && persona.occupation.industry.toLowerCase().includes('military')) relevance += 0.4;
      if (topicLower.includes('economic') && persona.occupation.title.toLowerCase().includes('manager')) relevance += 0.3;
      if (topicLower.includes('environment') && persona.preferences.interests.some(i => i.toLowerCase().includes('outdoor'))) relevance += 0.3;
      
      // Personal experience relevance
      if (persona.background.experiences.some(exp => topicLower.includes(exp.toLowerCase()))) relevance += 0.3;
      
      return Math.min(1.0, relevance);
    },
    
    generateAuthenticResponseWithBehaviors: (persona: PersonaProfile, content: string, behaviors: string[]): string => {
      const responseParts: string[] = [];
      
      // Handle interruption
      if (behaviors.includes('interrupt')) {
        const interruptionStyles = [
          "[INTERRUPTS] Sorry, but I have to jump in here...",
          "[INTERRUPTS] Wait, wait, wait...",
          "[INTERRUPTS] Hold on a second...",
          "[INTERRUPTS] No, but listen..."
        ];
        responseParts.push(interruptionStyles[Math.floor(Math.random() * interruptionStyles.length)]);
      }
      
      // Handle emotional reactions
      const emotionalBehaviors = behaviors.filter(b => b.startsWith('emotional_reaction:'));
      if (emotionalBehaviors.length > 0) {
        const emotion = emotionalBehaviors[0].split(':')[1];
        const emotionalPrefixes = {
          'passionate': '[PASSIONATE] This is really important -',
          'frustrated': '[FRUSTRATED] I\'m getting really tired of',
          'excited': '[EXCITED] Oh, this is exactly what I mean!',
          'concerned': '[CONCERNED] I\'m worried that'
        };
        responseParts.push(emotionalPrefixes[emotion as keyof typeof emotionalPrefixes] || '[EMOTIONAL]');
      }
      
      // Add main content
      responseParts.push(content);
      
      // Handle personal stories
      if (behaviors.includes('personal_story')) {
        const storyStarters = [
          `In my experience as a ${persona.occupation.title}...`,
          `When I was living in ${persona.location}...`,
          `My family went through something similar...`,
          `I remember when this happened in my industry...`
        ];
        responseParts.push(storyStarters[Math.floor(Math.random() * storyStarters.length)]);
      }
      
      // Handle tangents
      const tangentBehaviors = behaviors.filter(b => b.startsWith('tangent:'));
      if (tangentBehaviors.length > 0) {
        const tangent = tangentBehaviors[0].split(':')[1];
        responseParts.push(`...which reminds me of ${tangent}...`);
      }
      
      // Handle participation level adjustments
      const participationBehaviors = behaviors.filter(b => b.startsWith('participation:'));
      if (participationBehaviors.length > 0) {
        const level = participationBehaviors[0].split(':')[1];
        if (level === 'minimal') {
          // Drastically shorten response
          const shortResponses = ['I agree.', 'Yeah.', 'That makes sense.', 'Sure.', 'I guess so.'];
          return shortResponses[Math.floor(Math.random() * shortResponses.length)];
        } else if (level === 'moderate' && responseParts.length > 2) {
          // Moderate the response length
          responseParts.splice(2);
        }
      }
      
      return responseParts.join(' ').trim();
    }
  };

  // TinyTroupe-style conversation intelligence
  const analyzeConversationDynamics = (fullTranscript: SimulationTurn[], participantPersonas: PersonaProfile[]) => {
    const recentTurns = fullTranscript.slice(-8);
    const participantTurns = recentTurns.filter(t => t.speaker !== 'Moderator');
    
    // Real-time insight tracking
    const emergingThemes = extractEmergingThemes(participantTurns);
    const consensusPoints = detectConsensusBuilding(participantTurns);
    const divergentOpinions = identifyDivergentViewpoints(participantTurns);
    
    // Emotional intelligence monitoring
    const groupEmotionalState = analyzeGroupEmotionalState(participantTurns);
    
    // Participation analysis
    const participationCounts = participantPersonas.reduce((counts, persona) => {
      counts[persona.name] = fullTranscript.filter(t => t.speaker === persona.name).length;
      return counts;
    }, {} as Record<string, number>);
    
    const totalParticipantTurns = Object.values(participationCounts).reduce((sum, count) => sum + count, 0);
    const avgTurnsPerParticipant = totalParticipantTurns / participantPersonas.length;
    
    // Natural conversation flow assessment
    const conversationMomentum = calculateConversationMomentum(participantTurns);
    const discussionDepth = assessDiscussionDepth(participantTurns);
    const naturalTransitionOpportunities = identifyTransitionOpportunities(participantTurns);
    
    return {
      // Core dynamics
      emergingThemes,
      consensusPoints,
      divergentOpinions,
      groupEmotionalState,
      
      // Participation patterns
      participationBalance: calculateParticipationBalance(participationCounts, avgTurnsPerParticipant),
      quietParticipants: participantPersonas.filter(p => participationCounts[p.name] < avgTurnsPerParticipant * 0.4),
      dominatingParticipants: participantPersonas.filter(p => participationCounts[p.name] > avgTurnsPerParticipant * 1.8),
      
      // Conversation quality
      momentum: conversationMomentum,
      depth: discussionDepth,
      engagementLevel: groupEmotionalState.overallEngagement,
      naturalFlowQuality: assessNaturalFlow(participantTurns),
      
      // Moderation needs
      needsIntervention: determineInterventionNeed(conversationMomentum, discussionDepth, groupEmotionalState),
      interventionType: suggestInterventionType(emergingThemes, consensusPoints, divergentOpinions, groupEmotionalState),
      transitionOpportunities: naturalTransitionOpportunities
    };
  };
  
  const extractEmergingThemes = (turns: SimulationTurn[]) => {
    const themes: Array<{topic: string, mentions: number, sentiment: string}> = [];
    const topicKeywords = {
      'economic_impact': ['cost', 'money', 'expensive', 'afford', 'price', 'budget', 'jobs', 'economy'],
      'government_role': ['government', 'regulation', 'policy', 'law', 'control', 'mandate'],
      'personal_responsibility': ['individual', 'personal', 'responsibility', 'choice', 'behavior'],
      'corporate_responsibility': ['business', 'company', 'corporate', 'industry', 'profit'],
      'scientific_uncertainty': ['science', 'research', 'study', 'evidence', 'proof', 'data']
    };
    
    Object.entries(topicKeywords).forEach(([theme, keywords]) => {
      const mentions = turns.filter(turn => 
        keywords.some(keyword => turn.text.toLowerCase().includes(keyword))
      ).length;
      
      if (mentions > 0) {
        themes.push({
          topic: theme,
          mentions,
          sentiment: analyzeSentimentForTheme(turns, keywords)
        });
      }
    });
    
    return themes.sort((a, b) => b.mentions - a.mentions);
  };
  
  const analyzeGroupEmotionalState = (turns: SimulationTurn[]) => {
    const emotionalIndicators = {
      enthusiasm: ['excited', 'love', 'amazing', 'fantastic', 'great', 'awesome'],
      concern: ['worried', 'concerned', 'hesitant', 'unsure', 'doubt', 'anxiety'],
      frustration: ['annoying', 'difficult', 'problem', 'hate', 'frustrated', 'ridiculous'],
      engagement: ['interesting', 'curious', 'want to know', 'tell me more', 'explain'],
      agreement: ['agree', 'exactly', 'right', 'true', 'same', 'definitely'],
      disagreement: ['disagree', 'wrong', 'no', 'different', 'oppose', 'but']
    };
    
    const emotionCounts = Object.entries(emotionalIndicators).reduce((counts, [emotion, words]) => {
      counts[emotion] = turns.reduce((count, turn) => {
        return count + words.filter(word => turn.text.toLowerCase().includes(word)).length;
      }, 0);
      return counts;
    }, {} as Record<string, number>);
    
    const totalEmotions = Object.values(emotionCounts).reduce((sum, count) => sum + count, 0);
    const dominantEmotion = Object.entries(emotionCounts).reduce((max, [emotion, count]) => 
      count > max.count ? {emotion, count} : max, {emotion: 'neutral', count: 0}
    );
    
    return {
      dominantEmotion: dominantEmotion.emotion,
      emotionDistribution: emotionCounts,
      overallEngagement: totalEmotions / Math.max(1, turns.length),
      agreementRatio: emotionCounts.agreement / Math.max(1, emotionCounts.agreement + emotionCounts.disagreement),
      energyLevel: totalEmotions > turns.length * 0.8 ? 'high' : totalEmotions > turns.length * 0.4 ? 'medium' : 'low'
    };
  };
  
  const calculateConversationMomentum = (turns: SimulationTurn[]) => {
    if (turns.length < 2) return 0.5;
    
    const recentLengths = turns.slice(-3).map(t => t.text.length);
    const earlierLengths = turns.slice(-6, -3).map(t => t.text.length);
    
    const recentAvg = recentLengths.reduce((sum, len) => sum + len, 0) / Math.max(1, recentLengths.length);
    const earlierAvg = earlierLengths.reduce((sum, len) => sum + len, 0) / Math.max(1, earlierLengths.length);
    
    const lengthTrend = recentAvg / Math.max(1, earlierAvg);
    const responseFrequency = turns.length / Math.max(1, turns.length);
    
    return Math.min(1, (lengthTrend + responseFrequency) / 2);
  };
  
  const assessDiscussionDepth = (turns: SimulationTurn[]) => {
    const depthIndicators = ['because', 'experience', 'example', 'specifically', 'detail', 'explain', 'why', 'how'];
    const depthScore = turns.reduce((score, turn) => {
      return score + depthIndicators.filter(indicator => 
        turn.text.toLowerCase().includes(indicator)
      ).length;
    }, 0);
    
    return Math.min(1, depthScore / Math.max(1, turns.length));
  };
  
  const analyzeSentimentForTheme = (turns: SimulationTurn[], keywords: string[]) => {
    const relevantTurns = turns.filter(turn => 
      keywords.some(keyword => turn.text.toLowerCase().includes(keyword))
    );
    
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'beneficial', 'helpful'];
    const negativeWords = ['bad', 'terrible', 'negative', 'harmful', 'problematic', 'difficult'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    relevantTurns.forEach(turn => {
      positiveCount += positiveWords.filter(word => turn.text.toLowerCase().includes(word)).length;
      negativeCount += negativeWords.filter(word => turn.text.toLowerCase().includes(word)).length;
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };
  
  const detectConsensusBuilding = (turns: SimulationTurn[]) => {
    return turns.filter((turn, index) => {
      if (index === 0) return false;
      const prevTurn = turns[index - 1];
      const agreementIndicators = ['agree', 'exactly', 'same', 'right', 'yes'];
      return agreementIndicators.some(indicator => turn.text.toLowerCase().includes(indicator));
    });
  };
  
  const identifyDivergentViewpoints = (turns: SimulationTurn[]) => {
    return turns.filter(turn => {
      const disagreementIndicators = ['disagree', 'different', 'but', 'however', 'no', 'wrong', 'oppose'];
      return disagreementIndicators.some(indicator => turn.text.toLowerCase().includes(indicator));
    });
  };
  
  const calculateParticipationBalance = (counts: Record<string, number>, average: number) => {
    const deviations = Object.values(counts).map(count => Math.abs(count - average));
    const avgDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
    return Math.max(0, 1 - (avgDeviation / average));
  };
  
  const assessNaturalFlow = (turns: SimulationTurn[]) => {
    const buildingIndicators = ['that reminds me', 'building on', 'adding to', 'also', 'similarly'];
    const questioningIndicators = ['what do you mean', 'can you explain', 'how', 'why', 'what about'];
    
    const naturalConnections = turns.filter(turn => 
      buildingIndicators.some(indicator => turn.text.toLowerCase().includes(indicator)) ||
      questioningIndicators.some(indicator => turn.text.toLowerCase().includes(indicator))
    ).length;
    
    return naturalConnections / Math.max(1, turns.length);
  };
  
  const determineInterventionNeed = (momentum: number, depth: number, emotionalState: any) => {
    return momentum < 0.3 || depth < 0.2 || emotionalState.overallEngagement < 0.3 || emotionalState.agreementRatio > 0.8;
  };
  
  const suggestInterventionType = (themes: any[], consensus: any[], divergent: any[], emotionalState: any) => {
    if (emotionalState.agreementRatio > 0.8) return 'create_disagreement';
    if (emotionalState.overallEngagement < 0.3) return 'boost_energy';
    if (consensus.length > divergent.length * 2) return 'seek_alternative_views';
    if (themes.length < 2) return 'explore_new_angles';
    return 'natural_probe';
  };
  
  const identifyTransitionOpportunities = (turns: SimulationTurn[]) => {
    const transitionIndicators = ['that brings up', 'this relates to', 'another thing', 'also important', 'speaking of'];
    return turns.filter(turn => 
      transitionIndicators.some(indicator => turn.text.toLowerCase().includes(indicator))
    );
  };

  // TinyTroupe-style minimal intervention decision
  const shouldModeratorIntervene = (currentTurn: number, recentSpeakers: string[], fullTranscript: SimulationTurn[]): string | null => {
    if (currentTurn === 1) return null; // Just had opening
    
    const participantPersonas = personas.filter(p => currentSimulation?.personaIds.includes(p.id) || false);
    const dynamics = analyzeConversationDynamics(fullTranscript, participantPersonas);
    
    // TinyTroupe principle: Only intervene when truly necessary for research goals
    
    // CRITICAL: Research-threatening issues that require immediate intervention
    if (dynamics.groupEmotionalState.agreementRatio > 0.85 && dynamics.consensusPoints.length >= 3) {
      return 'break_artificial_consensus'; // Too much artificial agreement
    }
    
    if (dynamics.participationBalance < 0.2) {
      return 'balance_participation'; // Severe participation imbalance
    }
    
    if (dynamics.momentum < 0.2 && dynamics.engagementLevel < 0.3) {
      return 'revitalize_discussion'; // Discussion dying
    }
    
    if (dynamics.emergingThemes.length === 0 && fullTranscript.length > 6) {
      return 'extract_insights'; // Not getting research value
    }
    
    // MODERATE: Issues that suggest gentle guidance
    if (dynamics.depth < 0.3 && dynamics.emergingThemes.length > 0) {
      return 'deepen_exploration'; // Themes emerging but need depth
    }
    
    if (dynamics.dominatingParticipants.length > 0 && dynamics.quietParticipants.length > 0) {
      return 'redistribute_airtime'; // Some dominating, others silent
    }
    
    if (dynamics.transitionOpportunities.length > 0 && Math.random() < 0.3) {
      return 'natural_transition'; // Natural opportunity to transition topics
    }
    
    // MINIMAL: Only intervene occasionally for natural flow
    const lastFiveSpeakers = recentSpeakers.slice(-5);
    const nonModeratorCount = lastFiveSpeakers.filter(s => s !== 'Moderator').length;
    
    // Let conversation flow naturally unless it's been too long without moderation
    if (nonModeratorCount >= 6) {
      return 'natural_facilitation'; // Been a while since moderator spoke
    }
    
    // Random minimal intervention (very low frequency)
    if (Math.random() < 0.05) {
      return 'natural_probe';
    }
    
    return null; // Let natural conversation continue
  };
  
  const executeModeratorIntervention = async (interventionType: string, conversationDynamics: any) => {
    if (!currentSimulation || !enhancedConversationId) return;
    
    // Add intervention context to moderator prompt based on TinyTroupe principles
    const interventionContext = {
      'break_artificial_consensus': {
        priority: 'CRITICAL',
        instruction: 'Participants are agreeing too much artificially. Create productive disagreement by asking: "Who sees this differently?" or "What concerns would people have?"',
        tone: 'challenge_consensus'
      },
      'balance_participation': {
        priority: 'HIGH',
        instruction: `Call out quiet participants: "${conversationDynamics.quietParticipants.map(p => p.name).join(', ')}, what are your thoughts?" and manage dominators.`,
        tone: 'redistribute_focus'
      },
      'revitalize_discussion': {
        priority: 'HIGH', 
        instruction: 'Discussion is stagnating. Inject energy with provocative questions or hypothetical scenarios.',
        tone: 'energize'
      },
      'extract_insights': {
        priority: 'MODERATE',
        instruction: 'Not getting research value. Probe for specific examples, personal experiences, or deeper reasoning.',
        tone: 'research_focused'
      },
      'deepen_exploration': {
        priority: 'MODERATE',
        instruction: `Themes emerging: ${conversationDynamics.emergingThemes.map(t => t.topic).join(', ')}. Ask for specific examples or deeper explanation.`,
        tone: 'probe_deeper'
      },
      'redistribute_airtime': {
        priority: 'MODERATE',
        instruction: `Manage participation: ${conversationDynamics.dominatingParticipants.map(p => p.name).join(', ')} dominating, ${conversationDynamics.quietParticipants.map(p => p.name).join(', ')} quiet.`,
        tone: 'balance_voices'
      },
      'natural_transition': {
        priority: 'LOW',
        instruction: 'Natural transition opportunity detected. Guide to next topic or new angle smoothly.',
        tone: 'transition'
      },
      'natural_facilitation': {
        priority: 'LOW',
        instruction: 'Provide gentle facilitation to maintain momentum without disrupting natural flow.',
        tone: 'minimal_guidance'
      },
      'natural_probe': {
        priority: 'LOW',
        instruction: 'Ask open-ended follow-up question to maintain engagement.',
        tone: 'gentle_probe'
      }
    };
    
    const intervention = interventionContext[interventionType] || interventionContext['natural_probe'];
    
    // Store intervention context for moderator prompt
    localStorage.setItem('currentInterventionContext', JSON.stringify(intervention));
    
    // Execute moderator turn with intervention context
    await runModeratorTurn();
  };

  const runEnhancedAutomatedTurn = async () => {
    if (!currentSimulation || currentSimulation.status !== 'running' || !isMountedRef.current || !enhancedConversationId) return;

    // Check if we've reached the maximum moderator turns (which is what maxTurns really means in focus groups)
    const moderatorTurnCount = currentSimulation.moderatorTurnCount || 0;
    if (moderatorTurnCount >= currentSimulation.maxTurns) {
      pauseSimulation("Maximum moderator cycles reached.");
      return;
    }

    try {
      const recentSpeakers = currentSimulation.transcript.slice(-8).map(t => t.speaker);
      const participantPersonas = personas.filter(p => currentSimulation.personaIds.includes(p.id));
      const dynamics = analyzeConversationDynamics(currentSimulation.transcript, participantPersonas);
      
      // TinyTroupe approach: Minimal moderator intervention, let natural conversation flow
      const interventionNeeded = shouldModeratorIntervene(
        currentSimulation.currentTurnNumber, 
        recentSpeakers, 
        currentSimulation.transcript
      );
      
      if (interventionNeeded) {
        await executeModeratorIntervention(interventionNeeded, dynamics);
      } else {
        // Let natural participant conversation continue
        await runNaturalParticipantTurn(dynamics);
      }

      // Schedule next turn with variable natural delay
      const baseDelay = 2500; // Base 2.5 seconds
      const randomVariation = Math.random() * 2000; // 0-2 seconds additional
      const finalDelay = baseDelay + randomVariation; // 2.5-4.5 seconds total
      
      setTimeout(() => {
        if (currentSimulationRef.current?.status === 'running') {
          const currentModeratorTurns = currentSimulationRef.current.moderatorTurnCount || 0;
          if (currentModeratorTurns < currentSimulationRef.current.maxTurns) {
            runAutomatedTurn();
          } else {
            pauseSimulation("Maximum moderator cycles reached.");
          }
        }
      }, finalDelay); // Variable delay for more natural conversation flow

    } catch (err) {
      const message = err instanceof Error ? err.message : "Error with enhanced conversation";
      setError(message);
      console.error('Enhanced conversation error:', err);
      pauseSimulation(`Enhanced conversation error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runAutomatedTurn = async () => {
    if (!currentSimulation || currentSimulation.status !== 'running' || !isMountedRef.current) return;

    const moderatorTurnCount = currentSimulation.moderatorTurnCount || 0;
    if (moderatorTurnCount >= currentSimulation.maxTurns) {
      pauseSimulation("Maximum moderator cycles reached.");
      return;
    }

    // Use enhanced backend only
    if (!enhancedConversationId) {
      setError('Enhanced conversation not initialized. Please restart the simulation.');
      pauseSimulation("Enhanced conversation not available.");
      return;
    }

    await runEnhancedAutomatedTurn();
  };
  
  useEffect(() => {
    if (currentSimulation?.status === 'running' && !isLoading && currentSimulation.transcript.length > 0) {
      // Only start participant responses after moderator opening is displayed
      const timeoutId = setTimeout(() => {
        if (currentSimulationRef.current?.status === 'running') {
          runAutomatedTurn();
        }
      }, 5000); // 5 second delay to allow users to read moderator opening
      
      return () => clearTimeout(timeoutId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSimulation?.status, currentSimulation?.transcript?.length]); // Start after moderator opening is added


  const pauseSimulation = (reason?: string) => {
    if (!currentSimulation) return;
    
    // Update the ref immediately for real-time checking
    if (currentSimulationRef.current) {
      currentSimulationRef.current = { ...currentSimulationRef.current, status: 'paused' as SimulationStatus };
    }
    
    setIsLoading(false);
    setCurrentSimulation(sim => sim ? { ...sim, status: 'paused' as SimulationStatus } : null);
    if (reason) setError(prev => prev ? `${prev}. ${reason}` : reason);
  };

  const resumeSimulation = () => {
    if (!currentSimulation) return;
    const moderatorTurnCount = currentSimulation.moderatorTurnCount || 0;
    if (moderatorTurnCount < currentSimulation.maxTurns) {
      setError(null); 
      setCurrentSimulation(sim => sim ? { ...sim, status: 'running' as SimulationStatus } : null);
    } else {
      setError("Cannot resume: Maximum moderator cycles reached or simulation ended.");
    }
  };

  const endSimulation = () => {
    if (!currentSimulation) return;
    
    // Update the ref immediately for real-time checking  
    if (currentSimulationRef.current) {
      currentSimulationRef.current = { ...currentSimulationRef.current, status: 'ended' as SimulationStatus };
    }
    
    setIsLoading(false);
    const endedSession = { 
      ...currentSimulation, 
      status: 'ended' as SimulationStatus, 
      endTime: new Date().toISOString() 
    };
    saveSimulationSession(endedSession);
    setCurrentSimulation(endedSession); 
    transcriptUpdateRef.current = endedSession.transcript;
    setError(null);
  };
  
  const handleDownloadTranscript = () => {
    if (!currentSimulation) return;
    const formattedTranscript = formatTranscriptForDownload(currentSimulation, personas);
    const filename = `FocusGroup_${currentSimulation.topic.replace(/\s+/g, '_')}_${new Date(currentSimulation.startTime).toISOString().split('T')[0]}.txt`;
    
    const element = document.createElement("a");
    const file = new Blob([formattedTranscript], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  // SETUP VIEW
  if (!currentSimulation || currentSimulation.status === 'idle' || currentSimulation.status === 'ended') {
    return (
      <div className="p-6 md:p-8 bg-white shadow-xl rounded-xl max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center">
            <PlayCircleIcon className="w-8 h-8 text-indigo-600 mr-3" />
            <h2 className="text-2xl font-semibold text-slate-800">Setup Focus Group</h2>
          </div>
          {currentSimulation?.status === 'ended' && (
             <button
                onClick={startNewSimulationSetup}
                className="text-sm px-4 py-2 border border-indigo-500 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
            >
                New Setup
            </button>
          )}
        </div>

        {error && (!currentSimulation || currentSimulation.status !== 'ended') && ( // Only show active error if not viewing ended sim
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg relative mb-4 flex items-start" role="alert">
            <WarningIcon className="w-5 h-5 mr-2 mt-0.5 text-red-500" />
             <div><strong className="font-semibold">Error:</strong> {error}</div>
          </div>
        )}
        
        {currentSimulation?.status === 'ended' && (
            <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
                <div className="flex items-center">
                    <InfoIcon className="w-5 h-5 mr-2 text-green-600"/>
                    Simulation ended. Transcript saved.
                </div>
                <button 
                    onClick={handleDownloadTranscript}
                    className="text-sm px-4 py-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                >
                    Download Transcript
                </button>
            </div>
        )}

        {(!currentSimulation || currentSimulation.status === 'idle' ) && (
        <div className="space-y-5">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-1">Simulation Topic:</label>
            <input type="text" id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white" placeholder="e.g., Exploring attitudes towards sustainable packaging"/>
          </div>
          <div>
            <label htmlFor="researchGoal" className="block text-sm font-medium text-slate-700 mb-1">Research Goal / Overall Context:</label>
            <textarea id="researchGoal" value={researchGoal} onChange={(e) => setResearchGoal(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white" placeholder="e.g., Understand consumer willingness to pay more for eco-friendly options."/>
          </div>
          <div>
            <label htmlFor="discussionGuide" className="block text-sm font-medium text-slate-700 mb-1">Discussion Guide / Key Topics for AI Moderator:</label>
            <textarea id="discussionGuide" value={discussionGuide} onChange={(e) => setDiscussionGuide(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white" placeholder="e.g., - Initial thoughts on current packaging.\n- Importance of sustainability.\n- Reaction to new design concepts."/>
          </div>
          <div>
            <label htmlFor="maxTurns" className="block text-sm font-medium text-slate-700 mb-1">Max Moderator Turns (Cycles):</label>
            <input type="number" id="maxTurns" value={maxTurns} onChange={(e) => setMaxTurns(Math.max(1, Math.min(50,parseInt(e.target.value))))} min="1" max="50" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"/>
          </div>

          {/* Backend Status */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-700">Enhanced Simulation Engine:</span>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  backendStatus === 'checking' ? 'bg-yellow-500' :
                  backendStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-xs text-slate-600">
                  {backendStatus === 'checking' ? 'Checking Enhanced Engine...' :
                   backendStatus === 'healthy' ? 'Enhanced Engine Available' : 'Enhanced Engine Unavailable'}
                </span>
              </div>
            </div>
            {backendStatus === 'healthy' && (
              <p className="mt-2 text-xs text-green-700">
                ✓ Advanced conversation engine with psychological validation, memory, and behavioral consistency
              </p>
            )}
            {backendStatus === 'unhealthy' && (
              <p className="mt-2 text-xs text-red-600">
                ⚠️ Enhanced simulation engine required. Please ensure the Python backend is running.
              </p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Select Participating Personas:</h3>
            {personas.length === 0 ? <p className="text-sm text-slate-500 p-3 bg-slate-100 rounded-lg">No personas available. Please go to "Generate Personas" first.</p> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-52 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                {personas.map(p => (
                  <label 
                    key={p.id} 
                    htmlFor={`sim-persona-checkbox-${p.id}`} 
                    className={`flex items-center p-2.5 rounded-lg border cursor-pointer transition-all duration-150 ${selectedPersonaIds.includes(p.id) ? 'bg-indigo-100 border-indigo-400 ring-2 ring-indigo-500 shadow-md' : 'bg-white hover:bg-indigo-50 border-slate-300 hover:border-indigo-300'}`}
                  >
                    <input 
                        type="checkbox" 
                        id={`sim-persona-checkbox-${p.id}`} 
                        checked={selectedPersonaIds.includes(p.id)} 
                        onChange={() => handlePersonaSelect(p.id)} 
                        className="h-4 w-4 text-indigo-600 border-slate-400 rounded focus:ring-indigo-500 mr-2.5"
                    />
                    <span className="text-xs font-medium text-slate-700 select-none">{p.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={initiateSimulation} 
            disabled={isLoading || backendStatus !== 'healthy' || personas.length === 0 || selectedPersonaIds.length === 0 || !topic.trim() || !researchGoal.trim() || !discussionGuide.trim()} 
            className="w-full flex items-center justify-center px-4 py-2.5 border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:hover:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Starting Enhanced Simulation...</span>
              </>
            ) : (
              <>
                <PlayCircleIcon className="w-5 h-5 mr-2" /> 
                Start Enhanced AI-Moderated Focus Group
              </>
            )}
          </button>
        </div>
        )}
         {currentSimulation?.status === 'ended' && (
            <div className="mt-6 pt-6 border-t border-slate-200">
                 <h3 className="text-lg font-semibold text-slate-700 mb-1">Ended Simulation Transcript:</h3>
                 <p className="text-sm text-slate-600 mb-1"><span className="font-medium">Topic:</span> {currentSimulation.topic}</p>
                 <p className="text-xs text-slate-500 mb-1">Goal: {currentSimulation.researchGoal}</p>
                 <p className="text-xs text-slate-500 mb-4">Participants: {personas.filter(p => currentSimulation.personaIds.includes(p.id)).map(p => p.name).join(', ')}</p>
                 <div ref={chatOutputRef} id="chat-output" className="h-[28rem] overflow-y-auto mb-4 space-y-4 p-4 bg-slate-100 rounded-lg border border-slate-200">
                    {currentSimulation.transcript.map((turn, index) => (
                    <div key={index} className={`flex ${turn.speaker === 'Moderator' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-xl shadow-sm ${turn.speaker === 'Moderator' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                        <p className="font-semibold text-xs mb-1">{turn.speaker}</p>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{turn.text}</p>
                        <p className="text-xs mt-1.5 opacity-80 text-right">{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    );
  }
  

  // This line ensures that currentSimulation is not null and its status is either 'running' or 'paused'
  // due to the main if condition: !(!currentSimulation || currentSimulation.status === 'idle' || currentSimulation.status === 'ended')
  // which simplifies to currentSimulation && (currentSimulation.status === 'running' || currentSimulation.status === 'paused')
  const participatingPersonasDetails = personas.filter(p => currentSimulation.personaIds.includes(p.id));

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-8rem)] flex flex-col bg-white shadow-xl rounded-xl">
      <div className="mb-4 pb-4 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-2 sm:mb-0">
                <h2 className="text-xl font-semibold text-slate-800">Focus Group: {currentSimulation.topic}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Goal: {currentSimulation.researchGoal}</p>
                <div className="text-sm text-slate-600 mt-1">
                    <span className="font-medium">Participants:</span> {participatingPersonasDetails.map(p => p.name).join(', ')}
                </div>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
                 <p className="text-sm font-medium text-slate-700">
                    Moderator Cycles: <span className="font-semibold text-indigo-600">{currentSimulation.moderatorTurnCount || 0}</span> / {currentSimulation.maxTurns}
                </p>
                <p className="text-xs text-slate-500">
                    Total Responses: {currentSimulation.currentTurnNumber}
                </p>
                 <p className={`text-xs font-semibold mt-0.5 ${currentSimulation.status === 'running' ? 'text-green-600' : currentSimulation.status === 'paused' ? 'text-orange-500' : 'text-slate-500'}`}>
                    Status: {currentSimulation.status.toUpperCase()}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Engine: Enhanced AI
                </p>
            </div>
        </div>
         {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-lg mt-3 text-sm flex items-start" role="alert">
            <WarningIcon className="w-4 h-4 mr-2 mt-0.5 text-red-500 flex-shrink-0" /> 
            <div><strong className="font-semibold">Error:</strong> {error}</div>
          </div>
        )}
      </div>

      <div ref={chatOutputRef} id="chat-output" className="flex-grow overflow-y-auto mb-4 space-y-4 p-3 pr-1 bg-slate-100 border border-slate-200 rounded-lg">
        {currentSimulation.transcript.map((turn, index) => (
          <div key={index} className={`flex ${turn.speaker === 'Moderator' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-xl shadow-md ${turn.speaker === 'Moderator' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
              <p className="font-semibold text-xs mb-1">{turn.speaker}</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{turn.text}</p>
              <p className="text-xs mt-1.5 opacity-80 text-right">{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        {isLoading && currentSimulation.status === 'running' && (
            <div className="flex justify-center py-3">
                 <div className="flex items-center p-2 rounded-lg shadow-md bg-white text-slate-600 opacity-90 border border-slate-200">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm ml-2 italic">Focus group in progress...</span>
                 </div>
            </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-200">
        <div className="flex items-center space-x-3">
          {currentSimulation.status === 'running' && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                pauseSimulation("User paused.");
              }} 
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
            >
              {isLoading ? 'Pause' : 'Pause'}
            </button>
          )}
          {currentSimulation.status === 'paused' && (currentSimulation.moderatorTurnCount || 0) < currentSimulation.maxTurns && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                resumeSimulation();
              }} 
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg shadow-sm hover:bg-green-600 transition-colors"
            >
              Resume
            </button>
          )}
           {(currentSimulation.status === 'paused' && (currentSimulation.moderatorTurnCount || 0) >= currentSimulation.maxTurns) && (
             <p className="flex-1 text-sm text-center text-orange-600 font-medium">Max moderator cycles reached.</p>
           )}
          <button 
            onClick={(e) => {
              e.preventDefault();
              endSimulation();
            }} 
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-colors"
          >
            End & Save
          </button>
           { /* Only show download if paused; ended state is handled in the other view */ }
           { currentSimulation.status === 'paused' &&
                <button 
                    onClick={handleDownloadTranscript}
                    className="p-2.5 bg-sky-500 text-white rounded-lg shadow-sm hover:bg-sky-600 transition-colors"
                    title="Download Transcript"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                </button>
            }
        </div>
      </div>
    </div>
  );
};

export default SimulationsPage;
