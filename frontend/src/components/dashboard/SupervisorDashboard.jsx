import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PortalNav from './PortalNav';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { connectionsAPI } from '../../services/api';
import { Users, MessageSquare, ArrowRight, Mail } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50">
      <PortalNav />
      
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-1 sm:mb-2">Welcome back, {user?.name}</h1>
          <p className="text-sm sm:text-base text-gray-600">Supervise and support your psychologists</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all border-0 bg-gradient-to-br from-blue-50 to-blue-100"
            onClick={() => navigate('/messages')}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-blue-900 font-medium">Messages</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-700">Inbox</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all border-0 bg-gradient-to-br from-purple-50 to-purple-100"
            onClick={() => navigate('/settings')}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-purple-900 font-medium">Connections</p>
                  <p className="text-lg sm:text-xl font-bold text-purple-700">{psychologists.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Psychologists List */}
        <Card className="glass-card">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Your Psychologists</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Monitor progress and provide support</p>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner" />
            </div>
          ) : psychologists.length === 0 ? (
            <div className="empty-state py-8">
              <p className="text-gray-500 mb-2">No connected psychologists yet</p>
              <p className="text-xs sm:text-sm text-gray-400 mb-4">Check your connection requests</p>
              <Button onClick={() => navigate('/settings')} className="btn-primary">View Connection Requests</Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {psychologists.map((conn) => (
                <div key={conn.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    {/* Psychologist Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                        <span className="text-base sm:text-lg font-semibold text-white">
                          {conn.other_user?.name?.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">{conn.other_user?.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{conn.other_user?.email}</p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/messages')}
                        className="p-2"
                        title="Send Message"
                      >
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/supervisor/psychologist/${conn.other_user.id}`)}
                        className="text-xs sm:text-sm"
                      >
                        <span className="hidden sm:inline mr-1">View</span>
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
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
