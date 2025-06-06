
import React, { useState, useEffect, useRef } from 'react';
import { PersonaProfile, SimulationSession, SimulationTurn, SimulationType, SimulationStatus } from '../types';
import { getPersonaSimulationResponse, getAIModeratorAction } from '../services/openaiService';
import LoadingSpinner from '../components/LoadingSpinner';
import { PlayCircleIcon, UsersIcon, MessageIcon, WarningIcon, InfoIcon, TrashIcon } from '../constants'; // Added TrashIcon for potential use

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
  const [maxTurns, setMaxTurns] = useState<number>(5); // Default to fewer turns for faster demo
  
  const currentSimulation = propCurrentSimulation;
  const setCurrentSimulation = propSetCurrentSimulation;
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  const transcriptUpdateRef = useRef<SimulationTurn[]>([]); 
  const chatOutputRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
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
    setMaxTurns(5);
    setError(null);
  };

  const startNewSimulationSetup = () => {
    setCurrentSimulation(null); 
    resetSetupForm();
  };

  const initiateSimulation = () => {
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
    const newSession: SimulationSession = {
      id: crypto.randomUUID(), topic, researchGoal, discussionGuide, maxTurns,
      personaIds: selectedPersonaIds, transcript: [], startTime: new Date().toISOString(),
      simulationType: SimulationType.AI_MODERATED_GROUP, moderatorType: 'AI',
      currentTurnNumber: 0, status: 'running',
    };
    setCurrentSimulation(newSession);
    transcriptUpdateRef.current = newSession.transcript; 
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


  const runAutomatedTurn = async () => {
    if (!currentSimulation || currentSimulation.status !== 'running' || !isMountedRef.current) return;

    if (currentSimulation.currentTurnNumber >= currentSimulation.maxTurns) {
      pauseSimulation("Maximum turns reached.");
      return;
    }

    // Create new abort controller for this turn
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setIsLoading(true);
    setError(null);

    try {
      // Function to check if we should continue
      const shouldContinue = () => {
        if (signal.aborted) return false;
        if (!isMountedRef.current) return false;
        if (!currentSimulationRef.current) return false;
        if (currentSimulationRef.current.status !== 'running') return false;
        return true;
      };

      const participatingPersonasDetails = personas.filter(p => currentSimulation.personaIds.includes(p.id));
      
      // Check before starting moderator
      if (!shouldContinue()) {
        setIsLoading(false);
        return;
      }

      const moderatorTurnPreamble: SimulationTurn = {
        speaker: 'Moderator', text: '', timestamp: new Date().toISOString(),
      };
      transcriptUpdateRef.current = [...transcriptUpdateRef.current, moderatorTurnPreamble];
      setCurrentSimulation(sim => sim ? { ...sim, transcript: transcriptUpdateRef.current } : null);

      const moderatorStream = getAIModeratorAction(
        currentSimulation.researchGoal, currentSimulation.discussionGuide,
        transcriptUpdateRef.current.slice(0, -1), 
        participatingPersonasDetails
      );
      
      let moderatorFullText = '';
      for await (const chunk of moderatorStream) {
        if (!shouldContinue()) {
          setIsLoading(false);
          return;
        }
        appendToCurrentTurnText(chunk);
        moderatorFullText += chunk;
        
        // Slower streaming for better readability - moderator speaks deliberately
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      if (!moderatorFullText.trim() && shouldContinue()) {
         appendToCurrentTurnText("(Moderator provided no substantive response this turn)");
      }

      // Natural pause after moderator finishes speaking
      if (shouldContinue()) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Natural chaos: Not everyone responds every time, responses vary by personality
      const shuffledPersonas = [...participatingPersonasDetails].sort(() => Math.random() - 0.5); // Random order
      
      // Determine who responds this round based on personality
      const responders = shuffledPersonas.filter(persona => {
        const extraversion = persona.personality.extraversion;
        const agreeableness = persona.personality.agreeableness;
        
        // Extroverted people respond more often
        if (extraversion >= 4) return Math.random() < 0.9; // Almost always respond
        if (extraversion === 3) return Math.random() < 0.7; // Sometimes respond  
        if (extraversion <= 2) return Math.random() < 0.4; // Rarely respond
        
        // Agreeable people more likely to chime in supportively
        if (agreeableness >= 4) return Math.random() < 0.8;
        
        return Math.random() < 0.6; // Default response chance
      });

      // If no one responds, force at least one (the most extroverted)
      if (responders.length === 0) {
        const mostExtroverted = shuffledPersonas.reduce((prev, current) => 
          (prev.personality.extraversion > current.personality.extraversion) ? prev : current
        );
        responders.push(mostExtroverted);
      }

      // Process responses from selected participants
      for (const persona of responders) {
        if (!shouldContinue()) {
          setIsLoading(false);
          return;
        }

        const personaTurnPreamble: SimulationTurn = {
          speaker: persona.name, text: '', timestamp: new Date().toISOString(),
        };
        transcriptUpdateRef.current = [...transcriptUpdateRef.current, personaTurnPreamble];
        setCurrentSimulation(sim => sim ? { ...sim, transcript: transcriptUpdateRef.current } : null);

        const personaStream = getPersonaSimulationResponse(
          persona, currentSimulation.topic, currentSimulation.researchGoal,
          transcriptUpdateRef.current.slice(0, -1),
          moderatorFullText 
        );
        
        let personaFullText = '';
        for await (const chunk of personaStream) {
          if (!shouldContinue()) {
            setIsLoading(false);
            return;
          }
          appendToCurrentTurnText(chunk);
          personaFullText += chunk;
          
          // Vary streaming speed by personality
          const extraversion = persona.personality.extraversion;
          const delay = extraversion >= 4 ? 25 : extraversion <= 2 ? 45 : 35; // Fast/slow speakers
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        if (!personaFullText.trim() && shouldContinue()) {
           appendToCurrentTurnText(`(${persona.name} provided no substantive response this turn)`);
         }

        // Variable pause between participants - some jump in quickly, others wait
        if (shouldContinue()) {
          const extraversion = persona.personality.extraversion;
          const pauseDuration = extraversion >= 4 ? 400 : extraversion <= 2 ? 900 : 600;
          await new Promise(resolve => setTimeout(resolve, pauseDuration));
        }
      }
      
      // Longer pause at end of discussion round before next moderator turn
      if (shouldContinue()) {
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
      
      // Final check before updating turn number
      if (shouldContinue()) {
         setCurrentSimulation(sim => {
           if (!sim) return null;
           const nextTurnNumber = sim.currentTurnNumber + 1;
           if (nextTurnNumber >= sim.maxTurns) {
             setTimeout(() => pauseSimulation("Maximum turns reached."), 0); 
             return { ...sim, status: 'paused', currentTurnNumber: nextTurnNumber };
           }
           return { ...sim, currentTurnNumber: nextTurnNumber }; 
         });
       }

    } catch (err) {
      if (signal.aborted) return; // Don't handle errors if we were aborted
      
      const message = err instanceof Error ? err.message : "An unknown error occurred during simulation turn.";
      setError(message);
      if (isMountedRef.current) {
        pauseSimulation(`Error: ${message.substring(0,100)}...`);
      }
    } finally {
       if (isMountedRef.current) setIsLoading(false);
       abortControllerRef.current = null;
    }
  };
  
  useEffect(() => {
    if (currentSimulation?.status === 'running' && !isLoading) {
      runAutomatedTurn();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSimulation?.status, currentSimulation?.currentTurnNumber]);


  const pauseSimulation = (reason?: string) => {
    if (!currentSimulation) return;
    
    // Update the ref immediately for real-time checking
    if (currentSimulationRef.current) {
      currentSimulationRef.current = { ...currentSimulationRef.current, status: 'paused' as SimulationStatus };
    }
    
    // Abort any ongoing streaming
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsLoading(false);
    setCurrentSimulation(sim => sim ? { ...sim, status: 'paused' as SimulationStatus } : null);
    if (reason) setError(prev => prev ? `${prev}. ${reason}` : reason);
  };

  const resumeSimulation = () => {
    if (!currentSimulation) return;
    if (currentSimulation.currentTurnNumber < currentSimulation.maxTurns) {
      setError(null); 
      setCurrentSimulation(sim => sim ? { ...sim, status: 'running' as SimulationStatus } : null);
    } else {
      setError("Cannot resume: Maximum turns reached or simulation ended.");
    }
  };

  const endSimulation = () => {
    if (!currentSimulation) return;
    
    // Update the ref immediately for real-time checking  
    if (currentSimulationRef.current) {
      currentSimulationRef.current = { ...currentSimulationRef.current, status: 'ended' as SimulationStatus };
    }
    
    // Abort any ongoing streaming
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
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
          <button onClick={initiateSimulation} disabled={personas.length === 0 || selectedPersonaIds.length === 0 || !topic.trim() || !researchGoal.trim() || !discussionGuide.trim()} className="w-full flex items-center justify-center px-4 py-2.5 border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:hover:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <PlayCircleIcon className="w-5 h-5 mr-2" /> Start Automated Simulation
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
                    Turn: <span className="font-semibold text-indigo-600">{currentSimulation.currentTurnNumber}</span> / {currentSimulation.maxTurns}
                </p>
                 <p className={`text-xs font-semibold mt-0.5 ${currentSimulation.status === 'running' ? 'text-green-600' : currentSimulation.status === 'paused' ? 'text-orange-500' : 'text-slate-500'}`}>
                    Status: {currentSimulation.status.toUpperCase()}
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
          {currentSimulation.status === 'paused' && currentSimulation.currentTurnNumber < currentSimulation.maxTurns && (
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
           {(currentSimulation.status === 'paused' && currentSimulation.currentTurnNumber >= currentSimulation.maxTurns) && (
             <p className="flex-1 text-sm text-center text-orange-600 font-medium">Max turns reached.</p>
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
