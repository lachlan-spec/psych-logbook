import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { connectionsAPI } from '../../services/api';
import { Users, ArrowRight } from 'lucide-react';

export default function SupervisorDashboard() {
  const { user } = useAuth();
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
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Supervisor Dashboard</h1>
          <p className="text-gray-600">Monitor your psychologists' progress</p>
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
                    <div key={conn.id} className="list-item-card flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 icon-blue rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-xl font-semibold text-blue-700">
                            {conn.other_user?.name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{conn.other_user?.name}</p>
                          <p className="text-sm text-gray-600">{conn.other_user?.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/supervisor/logbook/${conn.psychologist_id}`}>
                          <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-200">Logbook</Button>
                        </Link>
                        <Link to={`/supervisor/cpd/${conn.psychologist_id}`}>
                          <Button variant="outline" size="sm" className="hover:bg-green-50 hover:border-green-200">CPD</Button>
                        </Link>
                        <Link to={`/supervisor/competencies/${conn.psychologist_id}`}>
                          <Button variant="outline" size="sm" className="hover:bg-purple-50 hover:border-purple-200">Competencies</Button>
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
