import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { connectionsAPI } from '../../services/api';
import { Users, ArrowRight } from 'lucide-react';

export default function SupervisorDashboard() {
  const { user, logout } = useAuth();
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
      {/* Supervisor Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="font-semibold hover:bg-blue-50 text-sm sm:text-base"
              >
                Dashboard
              </Button>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout} 
                className="text-gray-600 text-sm sm:text-base"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-1 sm:mb-2">Supervisor Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Monitor your psychologists' progress</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : (
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Users className="w-5 h-5" />
                Your Psychologists
              </CardTitle>
            </CardHeader>
            <CardContent>
              {psychologists.length === 0 ? (
                <div className="empty-state py-8">
                  <p className="text-gray-500 mb-2">No connected psychologists yet</p>
                  <p className="text-xs text-gray-400 mb-4">Check your connection requests</p>
                  <Link to="/connections">
                    <Button className="btn-primary">View Connection Requests</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {psychologists.map((conn) => (
                    <div key={conn.id} className="list-item-card p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 icon-blue rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                            <span className="text-lg sm:text-xl font-semibold text-blue-700">
                              {conn.other_user?.name?.charAt(0)}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">{conn.other_user?.name}</p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{conn.other_user?.email}</p>
                          </div>
                        </div>
                        <Link to={`/supervisor/psychologist/${conn.psychologist_id}`} className="w-full sm:w-auto">
                          <Button className="btn-primary w-full sm:w-auto text-sm">View Progress</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
