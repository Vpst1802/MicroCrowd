import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Navigation from './components/Navigation';
import PersonaGenerationPage from './pages/PersonaGenerationPage';
import PersonaDisplayPage from './pages/PersonaDisplayPage';
import SimulationsPage from './pages/SimulationPlaceholderPage'; 
// import AnalyticsPage from './pages/AnalyticsPlaceholderPage'; // Removed
import DashboardPage from './pages/DashboardPage';
import { PersonaProfile, SimulationSession } from './types';

const App: React.FC = () => {
  const [personas, setPersonas] = useState<PersonaProfile[]>(() => {
    const savedPersonas = localStorage.getItem('personas');
    return savedPersonas ? JSON.parse(savedPersonas) : [];
  });

  const [simulationSessions, setSimulationSessions] = useState<SimulationSession[]>(() => {
    const savedSimulations = localStorage.getItem('simulationSessions');
    return savedSimulations ? JSON.parse(savedSimulations) : [];
  });

  const [currentSimulation, setCurrentSimulation] = useState<SimulationSession | null>(() => {
    const savedCurrentSim = localStorage.getItem('currentSimulation');
    return savedCurrentSim ? JSON.parse(savedCurrentSim) : null;
  });
  
  const [isSidebarInitiallyCollapsed, ] = useState(window.innerWidth < 768);
  const [sidebarWidth, setSidebarWidth] = useState(isSidebarInitiallyCollapsed ? 'w-20' : 'w-64');


  useEffect(() => {
    localStorage.setItem('personas', JSON.stringify(personas));
  }, [personas]);

  useEffect(() => {
    localStorage.setItem('simulationSessions', JSON.stringify(simulationSessions));
  }, [simulationSessions]);

  useEffect(() => {
    if (currentSimulation) {
      localStorage.setItem('currentSimulation', JSON.stringify(currentSimulation));
    } else {
      localStorage.removeItem('currentSimulation');
    }
  }, [currentSimulation]);

  const addPersonas = (newPersonas: PersonaProfile[]) => {
    setPersonas((prevPersonas) => {
      // Filter out any duplicates based on generated name and summary to avoid duplicates
      const existingIds = new Set(prevPersonas.map(p => p.id));
      const uniqueNewPersonas = newPersonas.filter(p => !existingIds.has(p.id));
      return [...uniqueNewPersonas, ...prevPersonas];
    });
  };
  
  const deletePersona = (id: string) => {
    setPersonas((prevPersonas) => prevPersonas.filter(p => p.id !== id));
  };

  const clearAllData = () => {
    setPersonas([]);
    setSimulationSessions([]);
    setCurrentSimulation(null);
    localStorage.removeItem('personas');
    localStorage.removeItem('simulationSessions');
    localStorage.removeItem('currentSimulation');
  };

  const saveSimulationSession = (session: SimulationSession) => {
    setSimulationSessions(prevSessions => {
      const index = prevSessions.findIndex(s => s.id === session.id);
      if (index > -1) {
        const updatedSessions = [...prevSessions];
        updatedSessions[index] = session;
        return updatedSessions;
      }
      // Add new session to the beginning of the list for better visibility of recent sessions
      return [session, ...prevSessions]; 
    });
  };
  
  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarWidth(collapsed ? 'w-20' : 'w-64');
  };


  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50/30">
        <Header />
        <main className="pt-20 pb-8">
          <div className="max-w-4xl mx-auto px-6">
            <Navigation />
            <Routes>
              <Route path="/" element={<DashboardPage personaCount={personas.length} simulationCount={simulationSessions.filter(s=>s.endTime).length} clearAllData={clearAllData} />} />
              <Route path="/generate" element={<PersonaGenerationPage addPersonas={addPersonas} />} />
              <Route path="/personas" element={<PersonaDisplayPage personas={personas} deletePersona={deletePersona}/>} />
              <Route 
                path="/simulations" 
                element={<SimulationsPage 
                            personas={personas} 
                            saveSimulationSession={saveSimulationSession}
                            currentSimulation={currentSimulation}
                            setCurrentSimulation={setCurrentSimulation}
                         />} 
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;