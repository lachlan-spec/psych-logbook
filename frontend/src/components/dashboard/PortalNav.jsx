import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Menu, FileText, BookOpen, Award, MessageSquare, Settings, User } from 'lucide-react';

export default function PortalNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Different portals for psychologists vs supervisors
  const portals = user?.role === 'supervisor' 
    ? [
        { name: 'Messages', icon: MessageSquare, path: '/messages' },
        { name: 'Settings', icon: Settings, path: '/settings' },
      ]
    : [
        { name: 'Logbook', icon: FileText, path: '/logbook' },
        { name: 'CPD', icon: BookOpen, path: '/cpd' },
        { name: 'Competencies', icon: Award, path: '/competencies' },
        { name: 'Messages', icon: MessageSquare, path: '/messages' },
      ];

  // Only show Settings button on dashboard
  const showSettings = location.pathname === '/dashboard' || location.pathname === '/';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo/Brand and Navigation */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Brand/Logo */}
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="hidden sm:block text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                PsychLog Pro
              </span>
            </button>
            
            {/* Navigation Items */}
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/dashboard')}
                className={`font-medium text-sm ${
                  location.pathname === '/dashboard' || location.pathname === '/'
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </Button>
              
              {/* Portals Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1.5 font-medium text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Portals
                    <Menu className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  {portals.map((portal) => (
                    <DropdownMenuItem
                      key={portal.name}
                      onClick={() => navigate(portal.path)}
                      className="flex items-center gap-3 cursor-pointer py-2.5"
                    >
                      <portal.icon className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{portal.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Right side - User Actions */}
          <div className="flex items-center gap-2">
            {/* Settings - Only on Dashboard */}
            {showSettings && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/settings')} 
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                <Settings className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline font-medium text-sm">Settings</span>
              </Button>
            )}
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden md:inline font-medium text-sm max-w-[120px] truncate">
                    {user?.name?.split(' ')[0] || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                    {user?.role === 'psychologist' ? 'Psychologist' : 'Supervisor'}
                  </span>
                </div>
                <DropdownMenuItem 
                  onClick={logout} 
                  className="text-red-600 cursor-pointer font-medium mt-1"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
