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
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-50 mb-1">CPD Portal</h1>
          <p className="text-slate-400 text-sm">Manage your continuing professional development</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* Quick Stats Overview */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Card className="stat-card">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <p className="text-xs text-slate-400">CPD Hours</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-50">{stats.totalCPDHours}</p>
                  <p className="text-xs text-slate-500 mt-1">of {stats.cpdRequired}</p>
                  <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${Math.min(cpdProgress, 100)}%` }} />
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    <p className="text-xs text-slate-400">Goals</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-50">{stats.completedGoals}/{stats.totalGoals}</p>
                  <p className="text-xs text-slate-500 mt-1">completed</p>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <p className="text-xs text-slate-400">Consults</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-50">{consultationHours}h</p>
                  <p className="text-xs text-slate-500 mt-1">{stats.totalConsultationMinutes}m</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Navigation Cards - Compact Design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* CPD Activities Card */}
              <Link to="/cpd/activities" data-testid="cpd-activities-card">
                <Card className="glass-card hover:border-green-500 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-50 text-base mb-1">CPD Activities</h3>
                        <p className="text-xs text-slate-400 mb-3">Log workshops & courses</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Hours</span>
                          <span className="font-semibold text-green-400">{stats.totalCPDHours}h / {stats.cpdRequired}h</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-slate-400">Progress</span>
                          <span className="font-semibold text-green-400">{cpdProgress.toFixed(0)}%</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Learning Plans Card */}
              <Link to="/cpd/plans" data-testid="learning-plans-card">
                <Card className="glass-card hover:border-blue-500 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-50 text-base mb-1">Learning Plans</h3>
                        <p className="text-xs text-slate-400 mb-3">Set & track goals</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Goals</span>
                          <span className="font-semibold text-blue-400">{stats.totalGoals}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-slate-400">Completed</span>
                          <span className="font-semibold text-blue-400">{stats.completedGoals}</span>
                        </div>
                        {!stats.hasActivePlan && stats.totalGoals === 0 && (
                          <div className="mt-2 px-2 py-1 bg-amber-500/10 rounded text-xs text-amber-400">
                            No plan yet
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Peer Consultations Card */}
              <Link to="/cpd/consultations" data-testid="peer-consultations-card">
                <Card className="glass-card hover:border-purple-500 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-50 text-base mb-1">Peer Consultations</h3>
                        <p className="text-xs text-slate-400 mb-3">Track sessions</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Hours</span>
                          <span className="font-semibold text-purple-400">{consultationHours}h</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-slate-400">Minutes</span>
                          <span className="font-semibold text-purple-400">{stats.totalConsultationMinutes}m</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Info Note - Desktop Only */}
            <div className="hidden md:block mt-6">
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300 mb-1">CPD Year Cycle</p>
                      <p className="text-xs text-slate-400">
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
