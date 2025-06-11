import React, { useState, useMemo } from 'react';
import { PersonaProfile } from '../types';
import PersonaCard from '../components/PersonaCard';
import { UsersIcon } from '../constants';

interface PersonaDisplayPageProps {
  personas: PersonaProfile[];
  deletePersona: (id: string) => void;
}

const PersonaDisplayPage: React.FC<PersonaDisplayPageProps> = ({ personas, deletePersona }) => {
  const [searchTerm, setSearchTerm] = useState('');


  const filteredPersonas = useMemo(() => {
    if (!searchTerm) return personas;
    const term = searchTerm.toLowerCase();
    return personas.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.occupation.title.toLowerCase().includes(term) ||
      p.generatedSummary.toLowerCase().includes(term) ||
      p.preferences.interests.some(i => i.toLowerCase().includes(term)) ||
      // Enhanced persona search fields
      (p.applied_fragments && p.applied_fragments.some(f => f.toLowerCase().includes(term))) ||
      (p.expertise_areas && p.expertise_areas.some(e => e.toLowerCase().includes(term))) ||
      (p.communication_patterns && p.communication_patterns.some(c => c.toLowerCase().includes(term))) ||
      (p.participation_level && p.participation_level.toLowerCase().includes(term))
    );
  }, [personas, searchTerm]);

  if (personas.length === 0) {
    return (
      <div className="text-center p-10 bg-white shadow-xl rounded-xl max-w-lg mx-auto mt-10">
        <UsersIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-700 mb-2">No Personas Yet</h3>
        <p className="text-slate-500">
          Go to the "Generate Personas" page to create some AI-powered personas.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 flex items-center">
            <UsersIcon className="w-7 h-7 mr-2 text-indigo-600" />
            Enhanced Personas ({filteredPersonas.length})
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            AI-powered personas with advanced psychological profiling
          </p>
        </div>
        <input 
          type="text"
          placeholder="Search personas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm w-full sm:w-64 bg-white"
        />
      </div>
      
      {filteredPersonas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPersonas.map((persona) => (
            <PersonaCard key={persona.id} persona={persona} onDelete={deletePersona} />
          ))}
        </div>
      ) : (
         <div className="text-center p-10 bg-white shadow-xl rounded-xl max-w-lg mx-auto">
            <UsersIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Matching Personas</h3>
            <p className="text-slate-500">
            Try adjusting your search term or generate more personas.
            </p>
      </div>
      )}
    </div>
  );
};

export default PersonaDisplayPage;