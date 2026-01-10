import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { authAPI } from '../../services/api';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({ email: '', password: '' });
    
    // Simple validation - no email format required
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Username is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      login(response.data.user);
      localStorage.setItem('auth_token', response.data.session_token);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (role) => {
    // Single psychologist login
    setEmail('admin');
    setPassword('admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--secondary-100) 100%)' }}>
      <Card className="w-full max-w-md card fade-in" data-testid="login-card" style={{ animationDuration: '0.5s' }}>
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="icon-container w-16 h-16">
              <svg className="w-10 h-10 text-white icon-xl" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <CardTitle className="heading-2">Psychologist Portal</CardTitle>
          <CardDescription className="body-base" style={{ color: 'var(--neutral-600)' }}>
            Track your professional development and registrar program progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email/Password Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Username</Label>
              <Input
                id="email"
                type="text"
                placeholder="admin"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                data-testid="email-input"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="error-message">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); }}
                data-testid="password-input"
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && <p className="error-message">{errors.password}</p>}
            </div>
            <Button
              type="submit"
              disabled={loading}
              className={`w-full h-12 text-base btn-primary ${loading ? 'loading' : ''}`}
              data-testid="login-button"
            >
              <span style={{ opacity: loading ? 0 : 1 }}>Login</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
