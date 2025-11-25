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
import { ChevronDown, LogOut } from 'lucide-react';

export default function PortalNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-neutral">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo/Brand */}
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 group"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="text-sm font-semibold text-neutral group-hover:text-neutral-dark transition-colors">PsychLog</span>
          </button>
          
          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 px-2 text-xs text-neutral hover:text-neutral-dark hover:bg-neutral"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center mr-2">
                    <span className="text-white text-[10px] font-semibold">
                      {user?.name?.charAt(0)}
                    </span>
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">{user?.name?.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2 border-b border-neutral">
                  <p className="text-xs font-medium text-neutral-dark">{user?.name}</p>
                  <p className="text-[10px] text-neutral-light mt-0.5">{user?.email}</p>
                </div>
                <DropdownMenuItem 
                  onClick={logout} 
                  className="text-xs text-neutral cursor-pointer mt-1"
                >
                  <LogOut className="w-3 h-3 mr-2" />
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
