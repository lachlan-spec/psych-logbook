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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left side - Dashboard and Portals */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="font-semibold hover:bg-blue-50 text-sm sm:text-base"
            >
              Dashboard
            </Button>
            
            {/* Portals Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 text-sm sm:text-base">
                  Portals
                  <Menu className="w-3 h-3 sm:w-4 sm:h-4" />
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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/settings')} 
              className="text-sm sm:text-base"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout} 
              className="text-gray-600 text-sm sm:text-base"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
