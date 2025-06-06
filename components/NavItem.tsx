import React from 'react';
import { NavLink } from 'react-router-dom';
import { NavItemType } from '../types';

interface NavItemProps {
  item: NavItemType;
  isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ item, isCollapsed }) => {
  return (
    <li>
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          `flex items-center p-3 my-1 rounded-lg hover:bg-indigo-600 transition-colors duration-200 ease-in-out ${
            isActive ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:text-white'
          } ${isCollapsed ? 'justify-center' : ''}`
        }
        title={isCollapsed ? item.name : undefined}
      >
        <item.icon className={`w-5 h-5 ${!isCollapsed ? 'mr-3' : ''} transition-all duration-200 ease-in-out`} />
        {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap transition-opacity duration-200 ease-in-out opacity-100 group-hover:opacity-100">{item.name}</span>}
      </NavLink>
    </li>
  );
};

export default NavItem;