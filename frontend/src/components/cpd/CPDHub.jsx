import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../dashboard/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cpdAPI } from '../../services/api';
import { BookOpen, Target, Users, ArrowRight, TrendingUp } from 'lucide-react';

export default function CPDHub() {
  const { user } = useAuth();
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
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">CPD Portal</h1>
          <p className="text-gray-600">Manage your continuing professional development</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* Quick Stats Overview */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="stat-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-gray-500 mb-2">CPD Hours</p>
                      <p className="text-[36px] font-bold leading-none text-gray-900 mb-2">{stats.totalCPDHours}</p>
                      <p className="text-xs text-gray-400 mt-2">of {stats.cpdRequired} required</p>
                    </div>
                    <div className="w-14 h-14 icon-green rounded-xl flex items-center justify-center shadow-sm">
                      <TrendingUp className="w-7 h-7 text-green-600" />
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

              <Card className="stat-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-gray-500 mb-2">Goals</p>
                      <p className="text-[36px] font-bold leading-none text-gray-900 mb-2">{stats.completedGoals}/{stats.totalGoals}</p>
                      <p className="text-xs text-gray-400 mt-2">completed</p>
                    </div>
                    <div className="w-14 h-14 icon-blue rounded-xl flex items-center justify-center shadow-sm">
                      <Target className="w-7 h-7 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-gray-500 mb-2">Consults</p>
                      <p className="text-[36px] font-bold leading-none text-gray-900 mb-2">{consultationHours}h</p>
                      <p className="text-xs text-gray-400 mt-2">{stats.totalConsultationMinutes}m total</p>
                    </div>
                    <div className="w-14 h-14 icon-purple rounded-xl flex items-center justify-center shadow-sm">
                      <Users className="w-7 h-7 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CPD Activities Card */}
              <Link to="/cpd/activities" data-testid="cpd-activities-card">
                <Card className="glass-card hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all" className="bg-green-100">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-base mb-1">CPD Activities</h3>
                        <p className="text-sm text-gray-400 mb-3">Log workshops & courses</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Hours</span>
                            <span className="font-semibold text-emerald-400">{stats.totalCPDHours}h / {stats.cpdRequired}h</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Progress</span>
                            <span className="font-semibold text-emerald-400">{cpdProgress.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Learning Plans Card */}
              <Link to="/cpd/plans" data-testid="learning-plans-card">
                <Card className="glass-card hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all" className="bg-blue-100">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-base mb-1">Learning Plans</h3>
                        <p className="text-sm text-gray-400 mb-3">Set & track goals</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Goals</span>
                            <span className="font-semibold text-blue-400">{stats.totalGoals}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Completed</span>
                            <span className="font-semibold text-blue-400">{stats.completedGoals}</span>
                          </div>
                          {!stats.hasActivePlan && stats.totalGoals === 0 && (
                            <div className="mt-2 px-2 py-1 rounded text-xs font-medium border" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                              No plan yet
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Peer Consultations Card */}
              <Link to="/cpd/consultations" data-testid="peer-consultations-card">
                <Card className="glass-card hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all" className="bg-purple-100">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-base mb-1">Peer Consultations</h3>
                        <p className="text-sm text-gray-400 mb-3">Track sessions</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Hours</span>
                            <span className="font-semibold text-purple-400">{consultationHours}h</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Minutes</span>
                            <span className="font-semibold text-purple-400">{stats.totalConsultationMinutes}m</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1 group-hover:text-purple-400 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Info Note */}
            <div className="mt-6">
              <Card className="glass-card border-blue-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" className="bg-blue-100">
                      <BookOpen className="w-5 h-5 text-green-600" />
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
