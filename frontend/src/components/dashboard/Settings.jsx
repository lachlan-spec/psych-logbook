import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PortalNav from './PortalNav';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft, User, LogOut } from 'lucide-react';
import { authAPI } from '../../services/api';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-neutral">
      <PortalNav />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4 -ml-2 hover:bg-neutral"
        >
          <ArrowLeft className="icon-sm mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Settings</h1>
          <p className="text-neutral">Manage your account preferences</p>
        </div>

        {/* Profile Card */}
        <Card className="card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="icon-md text-primary" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-light">Name</p>
                <p className="font-medium">{user?.name || 'Psychologist'}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-light">Username</p>
                <p className="font-medium">{user?.email || 'admin'}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-light">Role</p>
                <p className="font-medium capitalize">{user?.role || 'Psychologist'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout Card */}
        <Card className="card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="icon-md text-red-500" />
              Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-light mb-4">
              Sign out of your current session
            </p>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="w-full sm:w-auto"
            >
              <LogOut className="icon-sm mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
