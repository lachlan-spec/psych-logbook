import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, BookOpen, Brain, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/logbook', icon: FileText, label: 'Logbook', feature: 'practice_logbook_enabled' },
  { path: '/cpd', icon: BookOpen, label: 'CPD' },
  { path: '/competencies', icon: Brain, label: 'Competency', feature: 'competency_journal_enabled' },
  { path: '/journal', icon: MessageSquare, label: 'Journal' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  // Filter items based on user feature toggles
  const filteredNavItems = navItems.filter(item => {
    if (!item.feature) return true;
    // If the feature field doesn't exist on user, default to enabled
    return user?.[item.feature] !== false;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 sm:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full px-1 transition-colors ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
              <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
