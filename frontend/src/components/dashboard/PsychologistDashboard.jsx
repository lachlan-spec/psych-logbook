import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PortalNav from './PortalNav';
import LogbookWidget from './LogbookWidget';
import SupervisionRatioWidget from './SupervisionRatioWidget';
import CPDHoursWidget from './CPDHoursWidget';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { logbookAPI, cpdAPI } from '../../services/api';
import { Clock, BookOpen, Award, MessageSquare, FileText, Users, Target, Settings, Info } from 'lucide-react';

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

  const portals = [
    {
      id: 'logbook',
      title: 'Practice Logbook',
      description: 'Record direct client contact, supervision, and other practice activities',
      icon: Clock,
      gradient: 'bg-gradient-blue',
      iconColor: 'text-white',
      path: '/logbook'
    },
    {
      id: 'cpd',
      title: 'CPD Hub',
      description: 'Manage activities, learning plans, and peer consultations',
      icon: BookOpen,
      gradient: 'bg-success',
      iconColor: 'text-white',
      path: '/cpd'
    },
    {
      id: 'competencies',
      title: 'Competency Journal',
      description: 'Document reflections on the 8 core competencies',
      icon: Award,
      gradient: 'bg-secondary',
      iconColor: 'text-white',
      path: '/competencies'
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'Communicate and receive feedback from supervisors',
      icon: MessageSquare,
      gradient: 'bg-warning',
      iconColor: 'text-white',
      path: '/messages'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <PortalNav />
      
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-1">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-xs sm:text-sm text-slate-500">Your professional development journey</p>
        </div>

        {/* Your Portals - Mobile First */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Your Portals</h2>
          <p className="text-xs text-slate-500 mb-4">Access your development tools</p>
          
          <div className="grid sm:grid-cols-2 gap-3">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Card 
                  key={portal.id} 
                  className="cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all border-slate-200/50 bg-white/80 backdrop-blur-sm"
                  onClick={() => navigate(portal.path)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${portal.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <Icon className={`w-6 h-6 ${portal.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 mb-1">{portal.title}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{portal.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Summary Snapshot Section */}
        <div className="mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Your Progress Snapshot</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-blue-900">Showing Current Period Data</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    All statistics below reflect data from the reporting periods that include today's date.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Cards */}
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
            <LogbookWidget />
            <SupervisionRatioWidget />
            <CPDHoursWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
