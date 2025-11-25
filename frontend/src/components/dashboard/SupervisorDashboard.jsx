import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PortalNav from './PortalNav';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { connectionsAPI } from '../../services/api';
import { MessageSquare, ArrowRight, Settings } from 'lucide-react';

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [psychologists, setPsychologists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const response = await connectionsAPI.getAll();
      const accepted = response.data.filter(c => c.status === 'accepted');
      setPsychologists(accepted);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary">
      <PortalNav />
      
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="heading-3 sm:heading-2 mb-1">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="caption sm:body-small">Supervise and support your psychologists</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card 
            className="card-interactive cursor-pointer"
            onClick={() => navigate('/messages')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-blue rounded-lg flex items-center justify-center">
                  <MessageSquare className="icon-sm text-white" />
                </div>
                <div>
                  <p className="caption font-medium text-neutral-light">Messages</p>
                  <p className="body-small font-semibold text-neutral">Inbox</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="card-interactive cursor-pointer"
            onClick={() => navigate('/settings')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center">
                  <Settings className="icon-sm text-white" />
                </div>
                <div>
                  <p className="caption font-medium text-neutral-light">Settings</p>
                  <p className="body-small font-semibold text-neutral">Profile</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Psychologists List */}
        <Card className="card">
          <div className="p-4 border-b border-neutral">
            <h2 className="body-base font-semibold text-neutral-dark">Your Psychologists</h2>
            <p className="caption mt-0.5">{psychologists.length} {psychologists.length === 1 ? 'connection' : 'connections'}</p>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner" />
            </div>
          ) : psychologists.length === 0 ? (
            <div className="p-8 text-center">
              <p className="body-small text-neutral mb-1">No connected psychologists</p>
              <p className="caption text-neutral-light mb-4">Add connections in settings</p>
              <Button onClick={() => navigate('/settings')} size="sm" className="btn-secondary btn-sm">Go to Settings</Button>
            </div>
          ) : (
            <div className="divide-y divide-neutral">
              {psychologists.map((conn) => (
                <div key={conn.id} className="p-3 hover:bg-neutral transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    {/* Psychologist Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-blue flex items-center justify-center flex-shrink-0" style={{ boxShadow: 'var(--shadow-sm)' }}>
                        <span className="text-white caption font-semibold">
                          {conn.other_user?.name?.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="body-small font-medium text-neutral truncate">{conn.other_user?.name}</p>
                          <span className="badge badge-success">
                            On Track
                          </span>
                        </div>
                        <p className="caption text-neutral-light truncate">{conn.other_user?.email}</p>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/supervisor/psychologist/${conn.other_user.id}`)}
                      className="btn-ghost btn-sm"
                    >
                      View
                      <ArrowRight className="icon-sm ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
