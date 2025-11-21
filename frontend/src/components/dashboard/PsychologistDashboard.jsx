import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { logbookAPI, cpdAPI } from '../../services/api';
import { Clock, BookOpen, Award, Users, FileText, Target, MessageSquare, ArrowRight } from 'lucide-react';

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
          <h1 className="text-4xl font-bold gradient-text mb-2">Welcome back, {user?.name}</h1>
          <p className="text-gray-600">Track your professional development journey</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[13px] font-medium text-gray-500 mb-2">Practice Hours Logged</p>
                  <p className="text-[36px] font-bold leading-none text-gray-900">{stats.totalLogbookHours.toFixed(1)}h</p>
                </div>
                <div className="w-14 h-14 icon-blue rounded-xl flex items-center justify-center shadow-sm">
                  <Clock className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[13px] font-medium text-gray-500 mb-2">CPD Hours</p>
                  <p className="text-[36px] font-bold leading-none text-gray-900">{stats.totalCPDHours.toFixed(1)}h</p>
                  <p className="text-xs text-gray-400 mt-2">of {stats.cpdRequired}h required</p>
                </div>
                <div className="w-14 h-14 icon-green rounded-xl flex items-center justify-center shadow-sm">
                  <BookOpen className="w-7 h-7 text-green-600" />
                </div>
              </div>
              <div className="progress-bar mt-3">
                <div className="progress-fill" style={{ width: `${Math.min(cpdProgress, 100)}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Navigation Sections */}
        <div className="space-y-6">
          {/* Professional Tracking */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Professional Practice Tracking</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/logbook">
                <Card className="glass-card hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 icon-blue rounded-xl flex items-center justify-center mb-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Practice Logbook</h3>
                      <p className="text-xs text-gray-500">Log supervised hours</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/cpd/activities">
                <Card className="glass-card hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 icon-green rounded-xl flex items-center justify-center mb-3">
                        <BookOpen className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">CPD Activities</h3>
                      <p className="text-xs text-gray-500">Track CPD hours</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/cpd/plans">
                <Card className="glass-card hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 icon-purple rounded-xl flex items-center justify-center mb-3">
                        <Target className="w-6 h-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Learning Plans</h3>
                      <p className="text-xs text-gray-500">Set learning goals</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/cpd/consultations">
                <Card className="glass-card hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 icon-orange rounded-xl flex items-center justify-center mb-3">
                        <Users className="w-6 h-6 text-orange-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Peer Consultations</h3>
                      <p className="text-xs text-gray-500">Log peer discussions</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/competencies">
                <Card className="glass-card hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 icon-indigo rounded-xl flex items-center justify-center mb-3">
                        <Award className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Competencies</h3>
                      <p className="text-xs text-gray-500">Journal your growth</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Communication & Administration */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Communication</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link to="/messages">
                <Card className="glass-card hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 icon-blue rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">Messages</h3>
                        <p className="text-xs text-gray-500">Communicate with supervisors</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/dashboard/connections">
                <Card className="glass-card hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 icon-green rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">Connections</h3>
                        <p className="text-xs text-gray-500">Manage supervisor relationships</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
