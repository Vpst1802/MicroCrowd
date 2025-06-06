import React, { useState, useEffect } from 'react';
import { NavItemType } from '../types';
import NavItem from './NavItem';
import { HomeIcon, UserPlusIcon, UsersIcon, PlayCircleIcon } from '../constants';

interface SidebarProps {
  onToggle: (isCollapsed: boolean) => void;
  initialCollapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onToggle, initialCollapsed }) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  useEffect(() => {
    onToggle(isCollapsed);
  }, [isCollapsed, onToggle]);

  const navItems: NavItemType[] = [
    { name: 'Dashboard', path: '/', icon: HomeIcon },
    { name: 'Persona Generator', path: '/generate', icon: UserPlusIcon },
    { name: 'Persona Library', path: '/personas', icon: UsersIcon },
    { name: 'Focus Groups', path: '/simulations', icon: PlayCircleIcon },
  ];

  return (
    <div className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-slate-900 text-slate-100 transition-all duration-300 ease-in-out shadow-lg group ${isCollapsed ? 'w-20' : 'w-64'} z-40`}>
      <div className="flex flex-col h-full">
        <nav className="flex-grow p-3 pt-4 overflow-y-auto">
          <ul>
            {navItems.map((item) => (
              <NavItem key={item.name} item={item} isCollapsed={isCollapsed} />
            ))}
          </ul>
        </nav>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors duration-200 ease-in-out"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          aria-expanded={!isCollapsed}
          aria-controls="sidebar-nav"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 mx-auto transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;