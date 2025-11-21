import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PortalNav from './PortalNav';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { logbookAPI, cpdAPI } from '../../services/api';
import { Clock, BookOpen, Award, MessageSquare, FileText, Users, Target } from 'lucide-react';

export default function PsychologistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalLogbookHours: 0,
    totalCPDHours: 0,
    cpdRequired: 30
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
        cpdRequired: 30
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const cpdProgress = (stats.totalCPDHours / stats.cpdRequired) * 100;

  const portals = [
    {
      id: 'logbook',
      title: 'Logbook Portal',
      description: 'Log and track supervised practice hours',
      icon: FileText,
      color: 'blue',
      stats: `${stats.totalLogbookHours.toFixed(1)}h logged`,
      path: '/logbook'
    },
    {
      id: 'cpd',
      title: 'CPD Portal',
      description: 'Professional development activities and planning',
      icon: BookOpen,
      color: 'green',
      stats: `${stats.totalCPDHours.toFixed(1)}h of ${stats.cpdRequired}h`,
      path: '/cpd',
      subItems: [
        { name: 'CPD Activities', icon: BookOpen, path: '/cpd/activities' },
        { name: 'Learning Plans', icon: Target, path: '/cpd/plans' },
        { name: 'Peer Consultations', icon: Users, path: '/cpd/consultations' }
      ]
    },
    {
      id: 'registrar',
      title: 'Registrar Portal',
      description: 'Core competencies and professional development',
      icon: Award,
      color: 'purple',
      stats: '6 competency areas',
      path: '/competencies'
    },
    {
      id: 'communication',
      title: 'Communication Portal',
      description: 'Messages and connections',
      icon: MessageSquare,
      color: 'orange',
      stats: 'Stay connected',
      path: '/messages',
      subItems: [
        { name: 'Messages', icon: MessageSquare, path: '/messages' },
      ]
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'icon-blue text-blue-600 border-blue-200 hover:border-blue-300 hover:bg-blue-50',
      green: 'icon-green text-green-600 border-green-200 hover:border-green-300 hover:bg-green-50',
      purple: 'icon-purple text-purple-600 border-purple-200 hover:border-purple-300 hover:bg-purple-50',
      orange: 'icon-orange text-orange-600 border-orange-200 hover:border-orange-300 hover:bg-orange-50'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Welcome back, {user?.name}</h1>
          <p className="text-gray-600">Your professional development journey</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
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

        {/* Four Portal Buttons */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Portals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Card
                  key={portal.id}
                  className={`glass-card cursor-pointer border-2 transition-all ${getColorClasses(portal.color)}`}
                  onClick={() => navigate(portal.path)}
                >
                  <CardContent className="pt-8 pb-8">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-md ${getColorClasses(portal.color)}`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{portal.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{portal.description}</p>
                        <p className="text-xs font-medium text-gray-500">{portal.stats}</p>
                      </div>
                    </div>
                    {portal.subItems && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                        {portal.subItems.map((item) => {
                          const SubIcon = item.icon;
                          return (
                            <Button
                              key={item.path}
                              variant="ghost"
                              className="w-full justify-start text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(item.path);
                              }}
                            >
                              <SubIcon className="w-4 h-4 mr-2" />
                              {item.name}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
