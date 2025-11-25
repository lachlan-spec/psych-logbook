import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const sessionId = location.state?.sessionId;
    if (!sessionId) {
      navigate('/login');
      return;
    }

    // Exchange session_id for user data
    const createSession = async () => {
      try {
        const response = await authAPI.createSession(sessionId);
        if (response.data.needs_role) {
          setSessionData(response.data);
        } else {
          login(response.data.user);
          navigate('/');
        }
      } catch (error) {
        toast.error('Session expired or invalid');
        navigate('/login');
      }
    };

    createSession();
  }, [location, navigate, login]);

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.completeSignup({
        ...sessionData.user_data,
        role: selectedRole,
        session_token: sessionData.session_token
      });

      login(response.data.user);
      toast.success('Welcome to Psychology Portal!');
      navigate('/');
    } catch (error) {
      toast.error('Failed to complete signup');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-primary">
      <Card className="w-full max-w-2xl card fade-in" data-testid="role-selection-card" style={{ animationDuration: '0.5s' }}>
        <CardHeader className="text-center">
          <CardTitle className="heading-3">Select Your Role</CardTitle>
          <CardDescription className="body-base" style={{ color: 'var(--neutral-600)' }}>Choose how you'll use Psychology Portal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedRole('psychologist')}
              data-testid="role-psychologist"
              className={`p-6 rounded-xl border-2 transition-all hover:-translate-y-1 ${
                selectedRole === 'psychologist'
                  ? 'border-primary bg-primary-light'
                  : 'border-neutral hover:border-primary bg-white'
              }`}
              style={{ boxShadow: selectedRole === 'psychologist' ? 'var(--shadow-md)' : 'none' }}
            >
              <div className="text-4xl mb-3">🎓</div>
              <h3 className="heading-4 mb-2">Psychologist</h3>
              <p className="body-small">
                Track your practice hours, CPD activities, and professional development
              </p>
            </button>

            <button
              onClick={() => setSelectedRole('supervisor')}
              data-testid="role-supervisor"
              className={`p-6 rounded-xl border-2 transition-all hover:-translate-y-1 ${
                selectedRole === 'supervisor'
                  ? 'border-primary bg-primary-light'
                  : 'border-neutral hover:border-primary bg-white'
              }`}
              style={{ boxShadow: selectedRole === 'supervisor' ? 'var(--shadow-md)' : 'none' }}
            >
              <div className="text-4xl mb-3">👨‍🏫</div>
              <h3 className="heading-4 mb-2">Supervisor</h3>
              <p className="body-small">
                Monitor and guide psychologists through their registrar program
              </p>
            </button>
          </div>

          <Button
            onClick={handleRoleSelection}
            disabled={!selectedRole || loading}
            className="w-full btn-primary"
            data-testid="confirm-role-button"
          >
            {loading ? 'Setting up...' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
