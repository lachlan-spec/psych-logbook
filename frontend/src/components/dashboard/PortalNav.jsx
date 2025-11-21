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
import { Menu, FileText, BookOpen, Award, MessageSquare, Settings } from 'lucide-react';

export default function PortalNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const portals = [
    { name: 'Logbook', icon: FileText, path: '/logbook' },
    { name: 'CPD', icon: BookOpen, path: '/cpd' },
    { name: 'Registrar', icon: Award, path: '/competencies' },
    { name: 'Communication', icon: MessageSquare, path: '/messages' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo/Title */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0 flex-shrink" onClick={() => navigate('/dashboard')}>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-base sm:text-xl font-bold gradient-text truncate">Psychology Portal</h1>
            </div>
            
            {/* Portal Dropdown - moved next to logo, hidden on mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 sm:gap-2 hidden sm:flex">
                  <Menu className="w-4 h-4" />
                  <span className="hidden md:inline">Portals</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {portals.map((portal) => (
                  <DropdownMenuItem
                    key={portal.name}
                    onClick={() => navigate(portal.path)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <portal.icon className="w-4 h-4" />
                    {portal.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side - Settings and Logout */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Settings - icon only on mobile */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/settings')} 
              className="gap-1 sm:gap-2 px-2 sm:px-3"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            {/* Logout - icon text on mobile */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout} 
              className="text-gray-600 px-2 sm:px-3"
            >
              <span className="text-sm">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
