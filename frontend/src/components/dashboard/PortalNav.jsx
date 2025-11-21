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
    { name: 'Messages', icon: MessageSquare, path: '/messages' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold gradient-text">Psychology Portal</h1>
          </div>

          {/* Portal Navigation */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Menu className="w-4 h-4" />
                  Portals
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
                <DropdownMenuItem
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-2 cursor-pointer border-t mt-1 pt-1"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" onClick={logout} className="text-gray-600">
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
