import React from 'react';
import { WarningIcon } from '../constants';

interface ApiKeyCheckerProps {
  children: React.ReactNode;
}

const ApiKeyChecker: React.FC<ApiKeyCheckerProps> = ({ children }) => {
  // In a real Vite/Create React App setup, process.env.API_KEY would be prefixed,
  // e.g., process.env.VITE_API_KEY or process.env.REACT_APP_API_KEY.
  // For this environment, we assume process.env.API_KEY is directly available.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-800 p-8 font-['Inter',_sans-serif]">
        <WarningIcon className="h-16 w-16 mb-6 text-red-500" />
        <h1 className="text-3xl font-semibold mb-4">Gemini API Key Missing</h1>
        <p className="text-center text-lg mb-2">
          The Gemini API Key (<code>API_KEY</code>) is not configured in your environment.
        </p>
        <p className="text-center text-md text-red-700">
          This application requires a valid Gemini API Key to generate personas and function correctly.
        </p>
        <p className="text-center mt-6 text-sm text-red-600">
          Please ensure the <code>API_KEY</code> environment variable is set during the build process or in your deployment environment. Refer to the Gemini API documentation for details on obtaining and setting up your API key.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ApiKeyChecker;