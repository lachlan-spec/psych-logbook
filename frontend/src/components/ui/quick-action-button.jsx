import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { Button } from './button';

export function QuickActionButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Determine action based on current route
  const getAction = () => {
    const path = location.pathname;
    if (path.includes('/logbook')) {
      return { label: 'Add Entry', onClick: () => navigate('/logbook') };
    } else if (path.includes('/cpd/activities')) {
      return { label: 'Add Activity', onClick: () => navigate('/cpd/activities') };
    } else if (path.includes('/cpd/plans')) {
      return { label: 'Add Goal', onClick: () => navigate('/cpd/plans') };
    } else if (path.includes('/cpd/consultations')) {
      return { label: 'Add Consultation', onClick: () => navigate('/cpd/consultations') };
    } else if (path.includes('/cpd')) {
      return { label: 'Add Activity', onClick: () => navigate('/cpd/activities') };
    }
    return null;
  };

  const action = getAction();

  if (!action) return null;

  return (
    <Button
      onClick={action.onClick}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 z-50 flex items-center justify-center"
      title={action.label}
    >
      <Plus className="icon-md text-white" />
    </Button>
  );
}
