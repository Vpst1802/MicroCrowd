import React from 'react';
import { Link } from 'react-router-dom';

interface DashboardPageProps {
  personaCount: number;
  simulationCount: number;
  clearAllData: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ personaCount, simulationCount, clearAllData }) => {
  const features = [
    { 
      name: 'Generate', 
      path: '/generate', 
      icon: '🧬',
      description: 'Transform raw data into intelligent personas',
      gradient: 'from-purple-600 to-pink-600'
    },
    { 
      name: 'Library', 
      path: '/personas', 
      icon: '👥',
      description: `${personaCount} personas ready for insights`,
      gradient: 'from-blue-600 to-cyan-600'
    },
    { 
      name: 'Simulate', 
      path: '/simulations', 
      icon: '💬',
      description: `Create natural conversations • ${simulationCount} completed`,
      gradient: 'from-green-600 to-emerald-600'
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            MicroCrowd
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Transform data into intelligent personas. Create authentic conversations.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex justify-center space-x-6">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{personaCount}</div>
            <div className="text-xs text-gray-500">Personas</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{simulationCount}</div>
            <div className="text-xs text-gray-500">Simulations</div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature) => (
          <Link
            key={feature.name}
            to={feature.path}
            className="group relative overflow-hidden bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg hover:shadow-gray-100"
          >
            <div className="p-4 space-y-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center text-xl shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                  {feature.name}
                </h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  {feature.description}
                </p>
              </div>
              <div className="flex items-center text-xs text-gray-500 group-hover:text-violet-600 transition-colors">
                <span>Get started</span>
                <svg className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-center">
        <button
          onClick={clearAllData}
          className="px-6 py-3 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 border border-gray-200 hover:border-red-200"
        >
          Clear All Data
        </button>
      </div>

      {/* Footer Attribution */}
      <div className="text-center pt-8 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Open source under MIT License • Built with ❤️ for the AI community
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;