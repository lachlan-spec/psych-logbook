import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PortalNav from './PortalNav';
import AllPracticeWidget from './AllPracticeWidget';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { logbookAPI, cpdAPI } from '../../services/api';
import { Clock, BookOpen, Award, MessageSquare, FileText, Users, Target, Settings, Info, UserPlus, AlertTriangle } from 'lucide-react';

export default function PsychologistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalLogbookHours: 0,
    totalCPDHours: 0,
    cpdRequired: 30
  });
  const [loading, setLoading] = useState(true);
  const [hasLogbookPeriod, setHasLogbookPeriod] = useState(true);
  const [hasCPDYear, setHasCPDYear] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [logbookEntries, cpdActivities, logbookYears, cpdYears] = await Promise.all([
        logbookAPI.getEntries(),
        cpdAPI.getActivities(),
        logbookAPI.getYears(),
        cpdAPI.getYears()
      ]);

      const totalLogbook = logbookEntries.data.reduce((sum, entry) => sum + entry.duration, 0);
      const totalCPD = cpdActivities.data.reduce((sum, activity) => sum + activity.hours, 0);

      setStats({
        totalLogbookHours: totalLogbook,
        totalCPDHours: totalCPD,
        cpdRequired: 30
      });
      
      // Check if settings are configured
      setHasLogbookPeriod(logbookYears.data && logbookYears.data.length > 0);
      setHasCPDYear(cpdYears.data && cpdYears.data.length > 0);
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
      gradient: 'icon-container-primary',
      iconColor: 'text-white',
      path: '/logbook',
      feature: 'practice_logbook_enabled'
    },
    {
      id: 'cpd',
      title: 'CPD Hub',
      description: 'Manage activities, learning plans, and peer consultations',
      icon: BookOpen,
      gradient: 'icon-container-success',
      iconColor: 'text-white',
      path: '/cpd'
    },
    {
      id: 'competencies',
      title: 'Competency Journal',
      description: 'Document reflections on the 8 core competencies',
      icon: Award,
      gradient: 'icon-container-secondary',
      iconColor: 'text-white',
      path: '/competencies',
      feature: 'competency_journal_enabled'
    },
    {
      id: 'journal',
      title: 'Personal Journal',
      description: 'Private reflections and notes',
      icon: BookOpen,
      gradient: 'icon-container-warning',
      iconColor: 'text-white',
      path: '/journal'
    }
  ];
  
  // Filter portals based on user feature toggles
  const filteredPortals = portals.filter(portal => {
    if (!portal.feature) return true;
    return user?.[portal.feature] !== false;
  });

  return (
    <div className="min-h-screen bg-gradient-primary">
      <PortalNav />
      
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="heading-3 sm:heading-2 mb-1">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="caption sm:body-small">Your professional development journey</p>
        </div>

        {/* Setup Warning Banner - Show if settings not configured */}
        {!loading && ((!hasLogbookPeriod && user?.practice_logbook_enabled !== false) || !hasCPDYear) && (
          <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 mb-1">Setup Required</h3>
                <p className="text-sm text-amber-700 mb-3">
                  Before you can start logging entries, please configure your settings:
                </p>
                <ul className="text-sm text-amber-700 space-y-1 mb-3">
                  {!hasLogbookPeriod && user?.practice_logbook_enabled !== false && (
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      <span><strong>Logbook Settings:</strong> Create a logbook period with your supervisor details</span>
                    </li>
                  )}
                  {!hasCPDYear && (
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      <span><strong>CPD Settings:</strong> Set up your CPD year cycle</span>
                    </li>
                  )}
                </ul>
                <div className="flex flex-wrap gap-2">
                  {!hasLogbookPeriod && user?.practice_logbook_enabled !== false && (
                    <Button 
                      size="sm" 
                      className="bg-amber-600 text-white hover:bg-amber-700 h-8 text-xs"
                      onClick={() => navigate('/logbook/settings')}
                    >
                      <Settings className="w-3.5 h-3.5 mr-1.5" />
                      Logbook Settings
                    </Button>
                  )}
                  {!hasCPDYear && (
                    <Button 
                      size="sm" 
                      className="bg-amber-600 text-white hover:bg-amber-700 h-8 text-xs"
                      onClick={() => navigate('/cpd/settings')}
                    >
                      <Settings className="w-3.5 h-3.5 mr-1.5" />
                      CPD Settings
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Section - Moved to top */}
        <div className="mb-6">
          <h2 className="heading-4 mb-1">Settings</h2>
          <p className="caption mb-4">Configure your logbook and CPD settings</p>
          
          <div className="grid sm:grid-cols-2 gap-3">
            {/* Practice Logbook Settings */}
            {user?.practice_logbook_enabled !== false && (
              <Card 
                className={`card-interactive cursor-pointer ${!hasLogbookPeriod ? 'border-2 border-amber-300 bg-amber-50/50' : ''}`}
                onClick={() => navigate('/logbook/settings')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 ${!hasLogbookPeriod ? 'bg-amber-100' : 'bg-blue-100'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Settings className={`w-5 h-5 ${!hasLogbookPeriod ? 'text-amber-600' : 'text-blue-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="body-base font-semibold text-neutral-dark mb-0.5">Logbook Settings</p>
                        {!hasLogbookPeriod && (
                          <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-xs rounded font-medium">Setup needed</span>
                        )}
                      </div>
                      <p className="caption leading-relaxed">Logbook periods, supervisors, targets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* CPD Hub Settings */}
            <Card 
              className={`card-interactive cursor-pointer ${!hasCPDYear ? 'border-2 border-amber-300 bg-amber-50/50' : ''}`}
              onClick={() => navigate('/cpd/settings')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 ${!hasCPDYear ? 'bg-amber-100' : 'bg-green-100'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Settings className={`w-5 h-5 ${!hasCPDYear ? 'text-amber-600' : 'text-green-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="body-base font-semibold text-neutral-dark mb-0.5">CPD Settings</p>
                      {!hasCPDYear && (
                        <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-xs rounded font-medium">Setup needed</span>
                      )}
                    </div>
                    <p className="caption leading-relaxed">CPD year cycles and periods</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Your Portals - Mobile First */}
        <div className="mb-6">
          <h2 className="heading-4 mb-1">Your Portals</h2>
          <p className="caption mb-4">Access your development tools</p>
          
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredPortals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Card 
                  key={portal.id} 
                  className="card-interactive cursor-pointer"
                  onClick={() => navigate(portal.path)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 ${portal.gradient} rounded-xl flex items-center justify-center flex-shrink-0`} style={{ boxShadow: 'var(--shadow-sm)' }}>
                        <Icon className={`icon-md ${portal.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="body-base font-semibold text-neutral-dark mb-1">{portal.title}</p>
                        <p className="caption leading-relaxed">{portal.description}</p>
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
            <h2 className="heading-4 mb-2">Your Progress Snapshot</h2>
            <div className="bg-primary-light border border-primary rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="icon-sm text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="caption font-medium text-neutral-dark">Showing Current Period Data</p>
                  <p className="caption text-neutral mt-0.5">
                    All statistics below reflect data from the reporting periods that include today&apos;s date.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* All Practice Summary Widget */}
          <AllPracticeWidget />
        </div>

        {/* Admin Section - Only visible to admin user */}
        {user?.email === 'admin' && (
          <div className="mb-6">
            <h2 className="heading-4 mb-1">Administration</h2>
            <p className="caption mb-4">Manage user accounts</p>
            
            <Card 
              className="card-interactive cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary/50"
              onClick={() => navigate('/admin/users')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0" style={{ boxShadow: 'var(--shadow-sm)' }}>
                    <UserPlus className="icon-md text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="body-base font-semibold text-neutral-dark mb-1">User Management</p>
                    <p className="caption leading-relaxed">Create accounts for friends to use their own logbook</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
