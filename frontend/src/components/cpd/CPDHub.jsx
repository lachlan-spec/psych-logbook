import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PortalNav from '../dashboard/PortalNav';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cpdAPI } from '../../services/api';
import { BookOpen, Target, Users, ArrowRight, TrendingUp, Settings, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

export default function CPDHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCPDHours: 0,
    cpdRequired: 30,
    totalGoals: 0,
    completedGoals: 0,
    totalConsultationMinutes: 0,
    hasActivePlan: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [activitiesResp, plansResp, consultationsResp] = await Promise.all([
        cpdAPI.getActivities(),
        cpdAPI.getPlans(),
        cpdAPI.getConsultations()
      ]);

      const totalCPD = activitiesResp.data.reduce((sum, a) => sum + a.hours, 0);
      const totalMinutes = consultationsResp.data.reduce((sum, c) => sum + c.minutes_spent, 0);
      
      let totalGoals = 0;
      let completedGoals = 0;
      let hasActivePlan = false;

      if (plansResp.data.length > 0) {
        const activePlans = plansResp.data.filter(p => !p.is_finished);
        hasActivePlan = activePlans.length > 0;
        
        plansResp.data.forEach(plan => {
          if (plan.goals) {
            totalGoals += plan.goals.length;
            completedGoals += plan.goals.filter(g => g.status === 'completed').length;
          }
        });
      }

      setStats({
        totalCPDHours: totalCPD,
        cpdRequired: 30,
        totalGoals,
        completedGoals,
        totalConsultationMinutes: totalMinutes,
        hasActivePlan
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const cpdProgress = (stats.totalCPDHours / stats.cpdRequired) * 100;
  const consultationHours = (stats.totalConsultationMinutes / 60).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNav />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="mb-3 sm:mb-4 -ml-2 hover:bg-gray-100"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="text-xs sm:text-sm">Back</span>
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">CPD Portal</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your continuing professional development</p>
          </div>
          <Button onClick={() => navigate('/cpd/settings')} variant="outline" size="sm" className="text-xs sm:text-sm self-start sm:self-auto">
            <Settings className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">CPD Year Settings</span>
            <span className="sm:hidden">Settings</span>
          </Button>
        </div>

        {loading ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="skeleton skeleton-card"></div>
              <div className="skeleton skeleton-card"></div>
              <div className="skeleton skeleton-card"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="skeleton" style={{ height: '180px' }}></div>
              <div className="skeleton" style={{ height: '180px' }}></div>
              <div className="skeleton" style={{ height: '180px' }}></div>
            </div>
          </>
        ) : (
          <>
            {/* Main Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CPD Activities Card */}
              <Link to="/cpd/activities" data-testid="cpd-activities-card">
                <Card className="glass-card cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 icon-green rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <BookOpen className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base mb-1">CPD Activities</h3>
                        <p className="text-sm text-gray-600 mb-3">Log workshops & courses</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Hours</span>
                            <span className="font-semibold text-green-600">{stats.totalCPDHours}h / {stats.cpdRequired}h</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-semibold text-green-600">{cpdProgress.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1 group-hover:text-green-600 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Learning Plans Card */}
              <Link to="/cpd/plans" data-testid="learning-plans-card">
                <Card className="glass-card cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 icon-blue rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Target className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base mb-1">Learning Plans</h3>
                        <p className="text-sm text-gray-600 mb-3">Set & track goals</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Goals</span>
                            <span className="font-semibold text-blue-600">{stats.totalGoals}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Completed</span>
                            <span className="font-semibold text-blue-600">{stats.completedGoals}</span>
                          </div>
                          {!stats.hasActivePlan && stats.totalGoals === 0 && (
                            <div className="mt-2 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs font-medium text-amber-700">
                              No plan yet
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Peer Consultations Card */}
              <Link to="/cpd/consultations" data-testid="peer-consultations-card">
                <Card className="glass-card cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 icon-purple rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base mb-1">Peer Consultations</h3>
                        <p className="text-sm text-gray-600 mb-3">Track sessions</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Hours</span>
                            <span className="font-semibold text-purple-600">{consultationHours}h</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Minutes</span>
                            <span className="font-semibold text-purple-600">{stats.totalConsultationMinutes}m</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1 group-hover:text-purple-600 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Info Note */}
            <div className="mt-6">
              <Card className="glass-card bg-blue-50/50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 icon-blue rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">CPD Year Cycle</p>
                      <p className="text-sm text-gray-600">
                        CPD years run from December 1 to November 30. Example: CPD Year 2025 = Dec 1, 2024 → Nov 30, 2025
                      </p>
                    </div>
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
