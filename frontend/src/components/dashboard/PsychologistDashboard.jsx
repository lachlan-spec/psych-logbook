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
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-2 sm:mb-3">Welcome back, {user?.name}</h1>
          <p className="text-base sm:text-lg text-gray-600">Your professional development journey</p>
        </div>

        {/* Four Portal Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {portals.map((portal) => {
            const Icon = portal.icon;
            const colorMap = {
              blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
              green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
              purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
              orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
            };
            
            return (
              <Card
                key={portal.id}
                className="group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                onClick={() => navigate(portal.path)}
              >
                <div className={`h-2 bg-gradient-to-r ${colorMap[portal.color]}`} />
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br ${colorMap[portal.color]} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">{portal.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{portal.description}</p>
                    </div>
                  </div>
                  {portal.subItems && (
                    <div className="space-y-1 pl-0 sm:pl-1">
                      {portal.subItems.map((item) => {
                        const SubIcon = item.icon;
                        return (
                          <button
                            key={item.path}
                            className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-xs sm:text-sm text-gray-700 group/item"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(item.path);
                            }}
                          >
                            <SubIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 group-hover/item:text-gray-700 flex-shrink-0" />
                            <span className="group-hover/item:text-gray-900 truncate">{item.name}</span>
                          </button>
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
  );
}
