import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PortalNav from '../dashboard/PortalNav';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '../ui/breadcrumb';
import { cpdAPI } from '../../services/api';
import { BookOpen, Target, Users, ArrowRight, TrendingUp, Settings, Home } from 'lucide-react';
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
      
      // Auto-select the year that includes today's date
      if (yearsData.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const currentYearNumber = new Date(today).getFullYear().toString();
        
        // First try to find by date range
        let currentPeriod = yearsData.find(y => {
          if (y.start_date && y.end_date) {
            return y.start_date <= today && y.end_date >= today;
          }
          return false;
        });
        
        // If no date match, try to match by year name
        if (!currentPeriod) {
          currentPeriod = yearsData.find(y => 
            y.year?.includes(currentYearNumber) || y.year_name?.includes(currentYearNumber)
          );
        }
        
        // If still no match, default to first year
        const selectedYear = currentPeriod || yearsData[0];
        setSelectedYearId(selectedYear.id);
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
    <div className="min-h-screen bg-gradient-primary">
      <PortalNav />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard" className="flex items-center gap-1">
                  <Home className="icon-sm" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>CPD Hub</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-dark mb-1">CPD Portal</h1>
            <p className="text-xs sm:text-sm text-neutral-light">Manage your professional development</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Year Selector */}
            {years.length > 0 && (
              <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.year} CPD Year
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={() => navigate('/cpd/settings')} variant="ghost" size="sm" className="h-9 px-3 text-xs text-neutral hover:bg-neutral">
              <Settings className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </div>
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
            <Card className="border-primary/50 bg-gradient-primary mb-6">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="icon-md text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-neutral-dark mb-2">Annual CPD Requirements</h3>
                    <div className="space-y-1.5 text-xs text-neutral">
                      <p className="flex items-start gap-2">
                        <span className="text-primary font-bold mt-0.5">•</span>
                        <span><strong>40 hours total CPD</strong> required annually for practicing psychologists</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-success font-bold mt-0.5">•</span>
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
                <Card className="card hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br bg-success rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="icon-md text-success" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-neutral mb-0.5">CPD Activities</h3>
                          <p className="text-xs text-neutral-light">Log workshops & courses</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-neutral">{stats.totalCPDHours}h / {stats.cpdRequired}h</p>
                        <p className="text-xs text-success">{cpdProgress.toFixed(0)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Learning Plans Card */}
              <Link to="/cpd/plans" data-testid="learning-plans-card">
                <Card className="card hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-blue rounded-lg flex items-center justify-center flex-shrink-0">
                          <Target className="icon-md text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-neutral mb-0.5">Learning Plans</h3>
                          <p className="text-xs text-neutral-light">Set & track goals</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-neutral">{stats.totalGoals} goals</p>
                        <p className="text-xs text-primary">{stats.completedGoals} completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Peer Consultations Card */}
              <Link to="/cpd/consultations" data-testid="peer-consultations-card">
                <Card className="card hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className="icon-md text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-neutral mb-0.5">Peer Consultations</h3>
                          <p className="text-xs text-neutral-light">Min. 10h required (counts toward CPD)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-neutral">{consultationHours}h</p>
                        <p className="text-xs text-purple-600">{stats.totalConsultationMinutes}m</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Info Note */}
            <div className="mt-4">
              <Card className="border-primary/50 bg-primary-light/50 backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 bg-gradient-blue rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="icon-sm text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral mb-0.5">CPD Year Cycle</p>
                      <p className="text-xs text-neutral">
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
