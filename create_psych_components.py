#!/usr/bin/env python3
"""
Script to create all Psychology Portal frontend components
This creates a comprehensive but maintainable component structure
"""

import os
from pathlib import Path

BASE_DIR = Path("/app/frontend/src")

# Component templates
COMPONENTS = {
    "components/auth/Login.jsx": """import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export default function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = () => {
    const redirectUrl = encodeURIComponent(window.location.origin);
    window.location.href = \`https://auth.emergentagent.com/?redirect=\${redirectUrl}\`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-4">
      <Card className="w-full max-w-md glass-card fade-in" data-testid="login-card">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-3xl gradient-text">Psychology Portal</CardTitle>
          <CardDescription className="text-base text-gray-600">
            Track your registrar program progress and professional development
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleLogin}
            className="w-full h-12 text-base btn-primary"
            data-testid="google-login-button"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
          <div className="text-center text-sm text-gray-500">
            <p>For Australian psychologists completing registrar programs</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
""",

    "components/auth/RoleSelection.jsx": """import React, { useState, useEffect } from 'react';
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
""",
}

def create_file(path, content):
    full_path = BASE_DIR / path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    with open(full_path, 'w') as f:
        f.write(content)
    print(f"✓ Created: {path}")

# Create all components
for path, content in COMPONENTS.items():
    create_file(path, content)

print(f"\\n✓ Created {len(COMPONENTS)} auth components")
print("Next: Create dashboard and feature components...")

