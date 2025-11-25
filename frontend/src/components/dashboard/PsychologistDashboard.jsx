import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PortalNav from './PortalNav';
import SupervisionRatioWidget from './SupervisionRatioWidget';
import CPDHoursWidget from './CPDHoursWidget';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { logbookAPI, cpdAPI } from '../../services/api';
import { Clock, BookOpen, Award, MessageSquare, FileText, Users, Target, Settings } from 'lucide-react';

export default function PsychologistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalLogbookHours: 0,
    totalCPDHours: 0,
    cpdRequired: 30
  });
  const [loading, setLoading] = useState(true);
  const [logbookYears, setLogbookYears] = useState([]);
  const [cpdYears, setCpdYears] = useState([]);
  const [selectedLogbookYearId, setSelectedLogbookYearId] = useState(null);
  const [selectedCpdYearId, setSelectedCpdYearId] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load years for both logbook and CPD
      const [logbookYearsResponse, cpdYearsResponse, logbookEntries, cpdActivities] = await Promise.all([
        logbookAPI.getYears(),
        cpdAPI.getYears(),
        logbookAPI.getEntries(),
        cpdAPI.getActivities()
      ]);

      const logbookYearsData = logbookYearsResponse.data;
      const cpdYearsData = cpdYearsResponse.data;

      setLogbookYears(logbookYearsData);
      setCpdYears(cpdYearsData);

      // Find the current period (year that includes today's date)
      const today = new Date().toISOString().split('T')[0];
      const currentLogbookYear = logbookYearsData.find(y => y.start_date <= today && y.end_date >= today);
      const currentCpdYear = cpdYearsData.find(y => y.start_date <= today && y.end_date >= today);

      // Set default selections to current year if found
      if (currentLogbookYear) {
        setSelectedLogbookYearId(currentLogbookYear.id);
      }
      if (currentCpdYear) {
        setSelectedCpdYearId(currentCpdYear.id);
      }

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
      title: 'Professional Development',
      description: 'CPD activities and learning goals',
      icon: BookOpen,
      gradient: 'from-green-100 to-emerald-100',
      iconColor: 'text-green-600',
      stats: `${stats.totalCPDHours.toFixed(1)}h`,
      path: '/cpd'
    },
    {
      id: 'competencies',
      title: 'Competency Journals',
      description: 'Reflect on core competencies',
      icon: Award,
      gradient: 'from-purple-100 to-violet-100',
      iconColor: 'text-purple-600',
      stats: '6 areas',
      path: '/competencies'
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'Connect with supervisors',
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Your Progress Snapshot</h2>
              <p className="text-xs text-slate-500 mt-0.5">Current compliance overview</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Viewing:</span>
              <Select value={selectedLogbookYearId || ''} onValueChange={setSelectedLogbookYearId}>
                <SelectTrigger className="h-8 w-[100px] text-xs border-slate-300">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {logbookYears.map(year => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.year_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Progress Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <SupervisionRatioWidget yearId={selectedLogbookYearId} />
            <CPDHoursWidget yearId={selectedCpdYearId} selectedYear={cpdYears.find(y => y.id === selectedCpdYearId)} onYearChange={setSelectedCpdYearId} allYears={cpdYears} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card 
            className="cursor-pointer hover:shadow-md transition-all border-slate-200/50 bg-white/80 backdrop-blur-sm"
            onClick={() => navigate('/messages')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-medium">Messages</p>
                  <p className="text-sm font-semibold text-slate-700">Inbox</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-all border-slate-200/50 bg-white/80 backdrop-blur-sm"
            onClick={() => navigate('/settings')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-purple-100 to-violet-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-medium">Settings</p>
                  <p className="text-sm font-semibold text-slate-700">Profile</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Portals */}
        <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Your Portals</h2>
            <p className="text-xs text-slate-500 mt-0.5">Access all your development tools</p>
          </div>
          
          <div className="divide-y divide-slate-50">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <div 
                  key={portal.id} 
                  className="p-3 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => navigate(portal.path)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 bg-gradient-to-br ${portal.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${portal.iconColor}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700">{portal.title}</p>
                        <p className="text-xs text-slate-400">{portal.description}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-slate-700">{portal.stats}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
