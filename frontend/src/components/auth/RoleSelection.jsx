import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RoleSelection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Since we're now a psychologist-only portal, redirect directly to dashboard
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <p>Redirecting to Psychologist Dashboard...</p>
      </div>
    </div>
  );
}
