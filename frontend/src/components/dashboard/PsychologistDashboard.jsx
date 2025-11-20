import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { logbookAPI, cpdAPI } from '../../services/api';
import { Clock, BookOpen, Award, MessageSquare, ArrowRight } from 'lucide-react';

export default function PsychologistDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalLogbookHours: 0,
    totalCPDHours: 0,
    cpdRequired: 30,
    recentEntries: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [logbookEntries, cpdActivities] = await Promise.all([
        logbookAPI.getEntries(),
        cpdAPI.getActivities()
      ]);

      const totalLogbook = logbookEntries.data.reduce((sum, entry) => sum + entry.duration, 0);
      const totalCPD = cpdActivities.data.reduce((sum, activity) => sum + activity.hours, 0);

      setStats({
        totalLogbookHours: totalLogbook,
        totalCPDHours: totalCPD,
        cpdRequired: 30,
        recentEntries: logbookEntries.data.slice(-5).reverse()
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const cpdProgress = (stats.totalCPDHours / stats.cpdRequired) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600">Here's your professional development overview</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="stat-card" data-testid="logbook-hours-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Practice Hours</p>
                      <p className="text-3xl font-bold text-blue-700">{stats.totalLogbookHours}</p>
                      <p className="text-xs text-gray-500 mt-1">Total logged</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card" data-testid="cpd-hours-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">CPD Hours</p>
                      <p className="text-3xl font-bold text-green-700">{stats.totalCPDHours}</p>
                      <p className="text-xs text-gray-500 mt-1">of {stats.cpdRequired} required</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(cpdProgress, 100)}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{cpdProgress.toFixed(0)}% complete</p>
                  </div>
                </CardContent>
              </Card>

              <Link to="/competencies">
                <Card className="stat-card hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Competencies</p>
                        <p className="text-3xl font-bold text-purple-700">6</p>
                        <p className="text-xs text-gray-500 mt-1">Core areas</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Award className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/messages">
                <Card className="stat-card hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Messages</p>
                        <p className="text-3xl font-bold text-amber-700">0</p>
                        <p className="text-xs text-gray-500 mt-1">Unread</p>
                      </div>
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Logbook Entries</CardTitle>
                    <Link to="/logbook">
                      <Button variant="ghost" size="sm" className="text-blue-600">
                        View All <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {stats.recentEntries.length === 0 ? (
                    <div className="empty-state py-8">
                      <p>No logbook entries yet</p>
                      <Link to="/logbook">
                        <Button className="mt-4 btn-primary">Add First Entry</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.recentEntries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{entry.activity_type}</p>
                            <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
                          </div>
                          <span className="text-sm font-semibold text-blue-600">{entry.duration}h</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Link to="/logbook">
                      <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                        <Clock className="w-6 h-6 text-blue-600" />
                        <span className="text-sm">Log Hours</span>
                      </Button>
                    </Link>
                    <Link to="/cpd">
                      <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                        <BookOpen className="w-6 h-6 text-green-600" />
                        <span className="text-sm">Add CPD</span>
                      </Button>
                    </Link>
                    <Link to="/competencies">
                      <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                        <Award className="w-6 h-6 text-purple-600" />
                        <span className="text-sm">Journal</span>
                      </Button>
                    </Link>
                    <Link to="/connections">
                      <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                        <MessageSquare className="w-6 h-6 text-amber-600" />
                        <span className="text-sm">Connect</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
