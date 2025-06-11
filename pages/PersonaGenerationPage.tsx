import React, { useState, useEffect } from 'react';
import { PersonaProfile } from '../types';
import { parseCSV, CSVParseResult } from '../services/csvService';
import enhancedApiService from '../services/enhancedApiService';
import LoadingSpinner from '../components/LoadingSpinner';
import { UserPlusIcon, WarningIcon, InfoIcon, UploadIcon } from '../constants';

interface PersonaGenerationPageProps {
  addPersonas: (newPersonas: PersonaProfile[]) => void;
}

const PersonaGenerationPage: React.FC<PersonaGenerationPageProps> = ({ addPersonas }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [generatedCount, setGeneratedCount] = useState(0);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');

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
        console.error('Enhanced backend not available:', error);
        setBackendStatus('unhealthy');
      }
    };

    checkBackendHealth();
  }, []);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setError(null);
        setGeneratedCount(0);
        setCsvHeaders([]);
        setParseErrors([]);
      } else {
        setError('Invalid file type. Please upload a .csv file.');
        setFile(null);
        setFileName('');
        setCsvHeaders([]);
        setParseErrors([]);
      }
    }
    event.target.value = ''; // Allow re-uploading the same file
  };
  
  const clearFile = () => {
    setFile(null);
    setFileName('');
    setError(null);
    setGeneratedCount(0);
    setCsvHeaders([]);
    setParseErrors([]);
  }

  const handleGeneratePersonas = async () => {
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedCount(0);
    setParseErrors([]);
    setCsvHeaders([]);

    try {
      const fileContent = await file.text();
      const parseResult: CSVParseResult = parseCSV(fileContent);

      if (parseResult.errors.length > 0) {
         setParseErrors(parseResult.errors.map(e => e.message));
      }
      if (parseResult.headers.length > 0) {
        setCsvHeaders(parseResult.headers);
      }

      if (parseResult.data.length === 0) {
        setError('No valid data rows found in the CSV to generate personas. Check CSV format and content.');
        setIsLoading(false);
        return;
      }
      
      // Limit for demo purposes to avoid excessive API calls
      const dataToProcess = parseResult.data.slice(0, 10); 
      if (parseResult.data.length > 10) {
        setParseErrors(prev => [...prev, `Note: CSV has ${parseResult.data.length} rows, but only the first 10 will be processed in this demo.`]);
      }

      if (backendStatus !== 'healthy') {
        setError('Enhanced backend is not available. Please ensure the Python backend is running and accessible.');
        setIsLoading(false);
        return;
      }

      // Use enhanced backend
      const response = await enhancedApiService.generatePersonasFromData(dataToProcess);
      
      if (response.success && response.data.personas) {
        // Convert enhanced personas to standard PersonaProfile format
        const newPersonas = response.data.personas.map(enhancedPersona => ({
          id: enhancedPersona.id,
          name: enhancedPersona.name,
          age: enhancedPersona.age,
          gender: enhancedPersona.gender,
          location: enhancedPersona.location,
          occupation: enhancedPersona.occupation,
          personality: enhancedPersona.personality,
          preferences: enhancedPersona.preferences,
          behaviors: enhancedPersona.behaviors,
          goals: enhancedPersona.goals,
          background: enhancedPersona.background,
          generatedSummary: enhancedPersona.generated_summary,
          sourceData: enhancedPersona.source_data,
          // Enhanced fields
          personality_descriptions: enhancedPersona.personality_descriptions,
          applied_fragments: enhancedPersona.applied_fragments,
          fragment_confidence_scores: enhancedPersona.fragment_confidence_scores,
          communication_patterns: enhancedPersona.communication_patterns,
          participation_level: enhancedPersona.participation_level,
          response_length_tendency: enhancedPersona.response_length_tendency,
          expertise_areas: enhancedPersona.expertise_areas,
          discussion_goals: enhancedPersona.discussion_goals,
          decision_factors: enhancedPersona.decision_factors,
          pain_points: enhancedPersona.pain_points,
          emotional_triggers: enhancedPersona.emotional_triggers,
          created_at: enhancedPersona.created_at
        }));

        // Show processing summary if available
        if (response.data.summary.warnings.length > 0) {
          setParseErrors(prev => [...prev, ...response.data.summary.warnings]);
        }

        addPersonas(newPersonas);
        setGeneratedCount(newPersonas.length);
      } else {
        throw new Error(response.message || 'Enhanced backend returned invalid response');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while generating personas.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg">
            🧬
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Generate Personas</h2>
          <p className="text-sm text-gray-600">Transform your CSV data into intelligent personas</p>
        </div>
      
      <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-700">
        <InfoIcon className="inline w-5 h-5 mr-1 mb-0.5 text-indigo-600" />
        Upload a CSV file where each row represents a potential persona. Key headers like 'name', 'age', 'location', 'occupation_title', 'industry', 'interests' (comma-separated) will be prioritized. The enhanced AI will generate sophisticated personas with psychological profiling, personality fragments, and conversation patterns.
        <br />
        <strong>Note:</strong> Max 10 rows processed in this demo.
      </div>

      {/* Backend Status */}
      <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-700">Enhanced Backend Status:</span>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              backendStatus === 'checking' ? 'bg-yellow-500' :
              backendStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-xs text-slate-600">
              {backendStatus === 'checking' ? 'Checking Enhanced Backend...' :
               backendStatus === 'healthy' ? 'Enhanced Backend Available' : 'Enhanced Backend Unavailable'}
            </span>
          </div>
        </div>
        {backendStatus === 'healthy' && (
          <p className="mt-2 text-xs text-green-700">
            ✓ Advanced psychological profiling, personality fragments, and behavioral validation enabled
          </p>
        )}
        {backendStatus === 'unhealthy' && (
          <p className="mt-2 text-xs text-red-600">
            ⚠️ Enhanced backend required. Please ensure the Python backend is running at the configured URL.
          </p>
        )}
      </div>


      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg relative mb-6 flex items-start" role="alert">
          <WarningIcon className="w-5 h-5 mr-2 mt-0.5 text-red-500" />
          <div>
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-1">{error}</span>
          </div>
        </div>
      )}
      
      {parseErrors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-700 px-4 py-3 rounded-lg relative mb-6">
          <h4 className="font-semibold text-sm mb-1">CSV Parsing Notes:</h4>
          <ul className="list-disc list-inside text-xs">
            {parseErrors.map((e, idx) => <li key={idx}>{e}</li>)}
          </ul>
        </div>
      )}

      {generatedCount > 0 && !isLoading && !error && (
         <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg relative mb-6 flex items-start" role="alert">
          <InfoIcon className="w-5 h-5 mr-2 mt-0.5 text-green-600" />
          <div>
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline ml-1">
              {generatedCount} enhanced persona(s) generated successfully with advanced psychological profiling. 
              View them in the 'View Personas' tab.
            </span>
          </div>
        </div>
      )}
      
      {csvHeaders.length > 0 && !isLoading && (
        <div className="bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded-lg mb-4">
            <h4 className="font-semibold text-sm mb-1">Detected CSV Headers:</h4>
            <p className="text-xs break-all">{csvHeaders.join(', ')}</p>
        </div>
      )}


      <div className="space-y-6">
        <div>
          <label htmlFor="csvUpload" className="block text-sm font-medium text-slate-700 mb-1">
            Upload CSV File:
          </label>
          <div className="mt-1 flex items-center space-x-3">
            <label 
                htmlFor="csvUpload" 
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
            >
                <UploadIcon className="w-5 h-5 mr-2 text-indigo-500"/>
                Choose File
            </label>
            <input
              type="file"
              id="csvUpload"
              accept=".csv"
              onChange={handleFileChange}
              className="sr-only" 
            />
            {fileName && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600 truncate max-w-xs" title={fileName}>{fileName}</span>
                <button onClick={clearFile} className="text-xs text-red-500 hover:text-red-700" title="Clear file">&times;</button>
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={handleGeneratePersonas}
          disabled={isLoading || !file || backendStatus !== 'healthy'}
          className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:hover:bg-slate-400 transition-colors"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Generating Enhanced Personas...</span>
            </>
          ) : (
            <>
              <UserPlusIcon className="w-5 h-5 mr-2" />
              Generate Enhanced Personas from CSV
            </>
          )}
        </button>
        </div>
      </div>
    </div>
  );
};

export default PersonaGenerationPage;