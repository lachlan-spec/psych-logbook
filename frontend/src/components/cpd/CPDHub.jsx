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
  const [years, setYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [stats, setStats] = useState({
    totalCPDHours: 0,
    cpdRequired: 40, // Total CPD requirement is 40 hours annually
    totalGoals: 0,
    completedGoals: 0,
    totalConsultationMinutes: 0,
    hasActivePlan: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadYears();
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      loadStats();
    }
  }, [selectedYearId]);

  const loadYears = async () => {
    try {
      const yearsResp = await cpdAPI.getYears();
      const yearsData = Array.isArray(yearsResp.data) ? yearsResp.data : yearsResp.data?.data || [];
      setYears(yearsData);
      
      // Auto-select the most recent year
      if (yearsData.length > 0) {
        const currentYear = yearsData.find(y => y.year === new Date().getFullYear().toString()) || yearsData[0];
        setSelectedYearId(currentYear.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load years:', error);
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!selectedYearId) return;
    
    try {
      const [activitiesResp, plansResp, consultationsResp] = await Promise.all([
        cpdAPI.getActivities(),
        cpdAPI.getPlans(null, selectedYearId),
        cpdAPI.getConsultations()
      ]);

      // Filter activities and consultations by selected year
      const activitiesForYear = activitiesResp.data.filter(a => a.year_id === selectedYearId);
      const consultationsForYear = consultationsResp.data.filter(c => c.year_id === selectedYearId);

      const totalCPD = activitiesForYear.reduce((sum, a) => sum + a.hours, 0);
      const totalMinutes = consultationsForYear.reduce((sum, c) => sum + c.minutes_spent, 0);
      
      let totalGoals = 0;
      let completedGoals = 0;
      let hasActivePlan = false;

      // Plans are already filtered by year_id from the API
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <PortalNav />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-3 -ml-2 hover:bg-slate-100 text-xs text-slate-600 h-7"
        >
          <ArrowLeft className="w-3 h-3 mr-1.5" />
          Back
        </Button>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-1">CPD Portal</h1>
            <p className="text-xs sm:text-sm text-slate-500">Manage your professional development</p>
          </div>
          <Button onClick={() => navigate('/cpd/settings')} variant="ghost" size="sm" className="h-8 px-3 text-xs text-slate-600 hover:bg-slate-100">
            <Settings className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Settings</span>
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
            {/* CPD Requirements Info Card */}
            <Card className="border-blue-200/50 bg-gradient-to-br from-blue-50 to-indigo-50 mb-6">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900 mb-2">Annual CPD Requirements</h3>
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <p className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-0.5">•</span>
                        <span><strong>40 hours total CPD</strong> required annually for practicing psychologists</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-green-600 font-bold mt-0.5">•</span>
                        <span><strong>At least 10 hours</strong> must be Peer Consultation (included in the 40 hours)</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-purple-600 font-bold mt-0.5">•</span>
                        <span>Peer Consultation hours count towards your total CPD requirement</span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Navigation Cards */}
            <div className="grid grid-cols-1 gap-3">
              {/* CPD Activities Card */}
              <Link to="/cpd/activities" data-testid="cpd-activities-card">
                <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-700 mb-0.5">CPD Activities</h3>
                          <p className="text-xs text-slate-400">Log workshops & courses</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-700">{stats.totalCPDHours}h / {stats.cpdRequired}h</p>
                        <p className="text-xs text-green-600">{cpdProgress.toFixed(0)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Learning Plans Card */}
              <Link to="/cpd/plans" data-testid="learning-plans-card">
                <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Target className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-700 mb-0.5">Learning Plans</h3>
                          <p className="text-xs text-slate-400">Set & track goals</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-700">{stats.totalGoals} goals</p>
                        <p className="text-xs text-blue-600">{stats.completedGoals} completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Peer Consultations Card */}
              <Link to="/cpd/consultations" data-testid="peer-consultations-card">
                <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-700 mb-0.5">Peer Consultations</h3>
                          <p className="text-xs text-slate-400">Min. 10h required (counts toward CPD)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-700">{consultationHours}h</p>
                        <p className="text-xs text-purple-600">{stats.totalConsultationMinutes}m</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Info Note */}
            <div className="mt-4">
              <Card className="border-blue-200/50 bg-blue-50/50 backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-0.5">CPD Year Cycle</p>
                      <p className="text-xs text-slate-600">
                        CPD years run from December 1 to November 30
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
