import React, { useState, useEffect } from 'react';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-2xl glass-card" data-testid="role-selection-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl gradient-text">Select Your Role</CardTitle>
          <CardDescription>Choose how you'll use Psychology Portal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedRole('psychologist')}
              data-testid="role-psychologist"
              className={\`p-6 rounded-xl border-2 transition-all \${
                selectedRole === 'psychologist'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }\`}
            >
              <div className="text-4xl mb-3">🎓</div>
              <h3 className="font-semibold text-lg mb-2">Psychologist</h3>
              <p className="text-sm text-gray-600">
                Track your practice hours, CPD activities, and professional development
              </p>
            </button>

            <button
              onClick={() => setSelectedRole('supervisor')}
              data-testid="role-supervisor"
              className={\`p-6 rounded-xl border-2 transition-all \${
                selectedRole === 'supervisor'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }\`}
            >
              <div className="text-4xl mb-3">👨‍🏫</div>
              <h3 className="font-semibold text-lg mb-2">Supervisor</h3>
              <p className="text-sm text-gray-600">
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
