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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Your Psychologists
              </CardTitle>
            </CardHeader>
            <CardContent>
              {psychologists.length === 0 ? (
                <div className="empty-state py-8">
                  <p>No connected psychologists yet</p>
                  <Link to="/connections">
                    <Button className="mt-4 btn-primary">View Connection Requests</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {psychologists.map((conn) => (
                    <div key={conn.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xl font-semibold text-blue-700">
                            {conn.other_user?.name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">{conn.other_user?.name}</p>
                          <p className="text-sm text-gray-500">{conn.other_user?.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/supervisor/logbook/${conn.psychologist_id}`}>
                          <Button variant="outline" size="sm">View Logbook</Button>
                        </Link>
                        <Link to={`/supervisor/cpd/${conn.psychologist_id}`}>
                          <Button variant="outline" size="sm">View CPD</Button>
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
