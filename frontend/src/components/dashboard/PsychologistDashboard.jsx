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
    <div className="min-h-screen bg-gray-50">
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
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-gray-500 mb-2">Practice Hours</p>
                      <p className="text-[36px] font-bold leading-none text-gray-900 mb-2">{stats.totalLogbookHours}</p>
                      <p className="text-xs text-gray-400 mt-2">Total logged</p>
                    </div>
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)' }}>
                      <Clock className="w-7 h-7 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card" data-testid="cpd-hours-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-gray-500 mb-2">CPD Hours</p>
                      <p className="text-[36px] font-bold leading-none text-gray-900 mb-2">{stats.totalCPDHours}</p>
                      <p className="text-xs text-gray-400 mt-2">of {stats.cpdRequired} required</p>
                    </div>
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)' }}>
                      <BookOpen className="w-7 h-7 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(cpdProgress, 100)}%` }} />
                    </div>
                    <p className="text-xs font-medium text-gray-500 mt-2">{cpdProgress.toFixed(0)}% complete</p>
                  </div>
                </CardContent>
              </Card>

              <Link to="/competencies">
                <Card className="stat-card cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-[13px] font-medium text-gray-500 mb-2">Competencies</p>
                        <p className="text-[36px] font-bold leading-none text-gray-900 mb-2">6</p>
                        <p className="text-xs text-gray-400 mt-2">Core areas</p>
                      </div>
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #E9D5FF 0%, #D8B4FE 100%)' }}>
                        <Award className="w-7 h-7 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/messages">
                <Card className="stat-card cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-[13px] font-medium text-gray-500 mb-2">Messages</p>
                        <p className="text-[36px] font-bold leading-none text-gray-900 mb-2">0</p>
                        <p className="text-xs text-gray-400 mt-2">Unread</p>
                      </div>
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' }}>
                        <MessageSquare className="w-7 h-7 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Section divider */}
            <div className="section-divider"></div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Recent Logbook Entries</CardTitle>
                    <Link to="/logbook">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        View All <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {stats.recentEntries.length === 0 ? (
                    <div className="empty-state py-8">
                      <p className="text-gray-500 mb-2">No logbook entries yet</p>
                      <p className="text-xs text-gray-400 mb-4">Start tracking your practice hours</p>
                      <Link to="/logbook">
                        <Button className="btn-primary">Add First Entry</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.recentEntries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                          <div>
                            <p className="font-semibold text-sm text-gray-900 mb-1">{entry.activity_type}</p>
                            <p className="text-xs text-gray-400">{new Date(entry.date).toLocaleDateString()}</p>
                          </div>
                          <span className="text-base font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{entry.duration}h</span>
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
