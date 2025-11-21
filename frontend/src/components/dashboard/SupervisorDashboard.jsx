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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <PortalNav />
      
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-1">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-xs sm:text-sm text-slate-500">Supervise and support your psychologists</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card 
            className="cursor-pointer hover:shadow-md transition-all border-slate-200/50 bg-white/80 backdrop-blur-sm"
            onClick={() => navigate('/messages')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-medium">Messages</p>
                  <p className="text-sm font-semibold text-slate-700">Inbox</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-all border-slate-200/50 bg-white/80 backdrop-blur-sm"
            onClick={() => navigate('/settings')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-purple-100 to-violet-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-medium">Settings</p>
                  <p className="text-sm font-semibold text-slate-700">Profile</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Psychologists List */}
        <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Your Psychologists</h2>
            <p className="text-xs text-slate-500 mt-0.5">{psychologists.length} {psychologists.length === 1 ? 'connection' : 'connections'}</p>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner" />
            </div>
          ) : psychologists.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500 mb-1">No connected psychologists</p>
              <p className="text-xs text-slate-400 mb-4">Add connections in settings</p>
              <Button onClick={() => navigate('/settings')} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 shadow-sm">Go to Settings</Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {psychologists.map((conn) => (
                <div key={conn.id} className="p-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    {/* Psychologist Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white text-xs font-semibold">
                          {conn.other_user?.name?.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700 truncate">{conn.other_user?.name}</p>
                        <p className="text-xs text-slate-400 truncate">{conn.other_user?.email}</p>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/supervisor/psychologist/${conn.other_user.id}`)}
                      className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    >
                      View
                      <ArrowRight className="w-3 h-3 ml-1" />
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
