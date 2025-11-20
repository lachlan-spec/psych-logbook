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
    <div className="min-h-screen bg-slate-950">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="stat-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">CPD Hours</p>
                      <p className="text-3xl font-bold text-green-700">{stats.totalCPDHours}</p>
                      <p className="text-xs text-gray-500 mt-1">of {stats.cpdRequired} required</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(cpdProgress, 100)}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Learning Goals</p>
                      <p className="text-3xl font-bold text-blue-700">{stats.completedGoals}/{stats.totalGoals}</p>
                      <p className="text-xs text-gray-500 mt-1">completed</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Consultations</p>
                      <p className="text-3xl font-bold text-purple-700">{consultationHours}h</p>
                      <p className="text-xs text-gray-500 mt-1">{stats.totalConsultationMinutes} minutes</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CPD Activities Card */}
              <Link to="/cpd/activities" data-testid="cpd-activities-card">
                <Card className="glass-card hover:shadow-xl transition-all cursor-pointer h-full group">
                  <CardHeader>
                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-8 h-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl mb-2">CPD Activities</CardTitle>
                    <p className="text-sm text-gray-600">Log workshops, courses, reading, and professional development activities</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-gray-700">Total Hours</span>
                        <span className="font-semibold text-green-700">{stats.totalCPDHours}h</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-gray-700">Progress</span>
                        <span className="font-semibold text-green-700">{cpdProgress.toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-green-600 font-medium mt-4">
                        <span>View Activities</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Learning Plans Card */}
              <Link to="/cpd/plans" data-testid="learning-plans-card">
                <Card className="glass-card hover:shadow-xl transition-all cursor-pointer h-full group">
                  <CardHeader>
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Target className="w-8 h-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl mb-2">Learning Plans</CardTitle>
                    <p className="text-sm text-gray-600">Set goals, track progress, and link your development activities</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm text-gray-700">Total Goals</span>
                        <span className="font-semibold text-blue-700">{stats.totalGoals}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm text-gray-700">Completed</span>
                        <span className="font-semibold text-blue-700">{stats.completedGoals}</span>
                      </div>
                      {!stats.hasActivePlan && stats.totalGoals === 0 && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-xs text-amber-800 font-medium">Create your first plan!</p>
                        </div>
                      )}
                      <div className="flex items-center justify-center gap-2 text-blue-600 font-medium mt-4">
                        <span>View Plans</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Peer Consultations Card */}
              <Link to="/cpd/consultations" data-testid="peer-consultations-card">
                <Card className="glass-card hover:shadow-xl transition-all cursor-pointer h-full group">
                  <CardHeader>
                    <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Users className="w-8 h-8 text-purple-600" />
                    </div>
                    <CardTitle className="text-2xl mb-2">Peer Consultations</CardTitle>
                    <p className="text-sm text-gray-600">Track consultation sessions and link them to your learning goals</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <span className="text-sm text-gray-700">Total Hours</span>
                        <span className="font-semibold text-purple-700">{consultationHours}h</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <span className="text-sm text-gray-700">Minutes</span>
                        <span className="font-semibold text-purple-700">{stats.totalConsultationMinutes}m</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-purple-600 font-medium mt-4">
                        <span>View Consultations</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Info Section */}
            <Card className="glass-card mt-8">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      CPD Activities
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Log workshops, conferences, courses</li>
                      <li>• Track progress toward 30-hour requirement</li>
                      <li>• View weekly, monthly, or yearly summaries</li>
                      <li>• Link activities to your learning goals</li>
                      <li>• Export PDF reports</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      Learning Plans
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Create annual plans (Dec 1 - Nov 30)</li>
                      <li>• Set and track learning goals</li>
                      <li>• View linked CPD activities & consultations</li>
                      <li>• Supervisor can add comments</li>
                      <li>• Mark goals as completed</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Peer Consultations
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Log peer consultation sessions</li>
                      <li>• Track minutes spent on discussions</li>
                      <li>• Link consultations to learning goals</li>
                      <li>• View weekly, monthly summaries</li>
                      <li>• Auto-convert minutes to hours</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2 text-blue-900">CPD Year Cycle</h3>
                    <p className="text-sm text-blue-800">
                      CPD years run from <strong>December 1 to November 30</strong>
                    </p>
                    <p className="text-xs text-blue-700 mt-2">
                      Example: CPD Year 2025 = Dec 1, 2024 → Nov 30, 2025
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
