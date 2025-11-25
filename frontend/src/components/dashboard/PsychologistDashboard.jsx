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
      description: 'Track supervised practice hours',
      icon: Clock,
      gradient: 'from-blue-100 to-indigo-100',
      iconColor: 'text-blue-600',
      stats: `${stats.totalLogbookHours.toFixed(1)}h`,
      path: '/logbook'
    },
    {
      id: 'cpd',
      title: 'CPD Hub',
      description: 'Professional development activities',
      icon: BookOpen,
      gradient: 'from-green-100 to-emerald-100',
      iconColor: 'text-green-600',
      stats: `${stats.totalCPDHours.toFixed(1)}h`,
      path: '/cpd'
    },
    {
      id: 'competencies',
      title: 'Competency Journal',
      description: 'Reflect on 8 core competencies',
      icon: Award,
      gradient: 'from-purple-100 to-violet-100',
      iconColor: 'text-purple-600',
      stats: '8 areas',
      path: '/competencies'
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'Connect with your supervisor',
      icon: MessageSquare,
      gradient: 'from-amber-100 to-orange-100',
      iconColor: 'text-amber-600',
      stats: 'Inbox',
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
                    All statistics below automatically reflect data from the reporting periods that include today's date.
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

        {/* Your Portals */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Your Portals</h2>
          <p className="text-xs text-slate-500">Access your development tools</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Card 
                key={portal.id} 
                className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all border-slate-200/50 bg-white/80 backdrop-blur-sm"
                onClick={() => navigate(portal.path)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${portal.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Icon className={`w-6 h-6 ${portal.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{portal.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{portal.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-slate-700">{portal.stats}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
