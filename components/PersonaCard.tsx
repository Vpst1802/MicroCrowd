import React from 'react';
import { PersonaProfile } from '../types';
import { TrashIcon } from '../constants';

interface PersonaCardProps {
  persona: PersonaProfile;
  onDelete: (id: string) => void;
}

const PersonaCard: React.FC<PersonaCardProps> = ({ persona, onDelete }) => {
  return (
    <div className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl transition-shadow duration-300 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-slate-800">{persona.name}</h3>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
            {persona.age} | {persona.gender.charAt(0).toUpperCase() + persona.gender.slice(1)}
          </span>
        </div>
        <p className="text-sm text-slate-600 mb-1">
          <span className="font-medium text-slate-700">Occupation:</span> {persona.occupation.title} at {persona.occupation.industry}
        </p>
        <p className="text-sm text-slate-600 mb-3">
          <span className="font-medium text-slate-700">Location:</span> {persona.location}
        </p>
        <p className="text-xs text-slate-500 mb-4 h-16 overflow-y-auto p-2 border border-slate-200 rounded-md bg-slate-50">
          {persona.generatedSummary}
        </p>

        <div className="mb-3">
          <h4 className="text-xs font-semibold text-slate-700 mb-1">Personality (Big 5):</h4>
          <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs text-slate-600">
            <span>O: {persona.personality.openness}/5</span>
            <span>C: {persona.personality.conscientiousness}/5</span>
            <span>E: {persona.personality.extraversion}/5</span>
            <span>A: {persona.personality.agreeableness}/5</span>
            <span>N: {persona.personality.neuroticism}/5</span>
          </div>
        </div>

        {persona.preferences.interests.length > 0 && (
          <div className="mb-2">
            <h4 className="text-xs font-semibold text-slate-700 mb-1">Interests:</h4>
            <div className="flex flex-wrap gap-1.5">
              {persona.preferences.interests.slice(0, 3).map((interest, index) => (
                <span key={index} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  {interest}
                </span>
              ))}
              {persona.preferences.interests.length > 3 && <span className="text-xs text-slate-500">...</span>}
            </div>
          </div>
        )}
      </div>
      <div className="mt-auto pt-4 border-t border-slate-200">
        <button
            onClick={() => onDelete(persona.id)}
            className="w-full flex items-center justify-center text-sm text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors duration-200"
            title="Delete Persona"
        >
            <TrashIcon className="w-4 h-4 mr-1.5" />
            Delete Persona
        </button>
      </div>
    </div>
  );
};

export default PersonaCard;