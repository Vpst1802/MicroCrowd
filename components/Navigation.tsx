import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'Generate', path: '/generate', icon: '🧬' },
    { name: 'Library', path: '/personas', icon: '👥' },
    { name: 'Simulate', path: '/simulations', icon: '💬' },
  ];

  return (
    <nav className="flex justify-center mb-8">
      <div className="flex space-x-1 bg-white rounded-full p-1 shadow-lg border border-gray-200">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
              location.pathname === item.path
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span>{item.icon}</span>
            <span className="text-sm font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;