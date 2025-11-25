import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cpdAPI } from '../../services/api';
import { Target, Users, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';

export default function CPDHoursWidget() {
  const [cpdData, setCpdData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCPDData();
  }, []);

  const loadCPDData = async () => {
    try {
      // Get CPD years to find current period
      const yearsResponse = await cpdAPI.getYears();
      const years = yearsResponse.data;
      
      // Find the year that includes today's date
      const today = new Date().toISOString().split('T')[0];
      const currentYearNumber = new Date(today).getFullYear().toString();
      
      // First try to find by date range, then fall back to year name match
      let currentYear = years.find(y => y.start_date && y.end_date && y.start_date <= today && y.end_date >= today);
      
      if (!currentYear) {
        // Fall back to matching year name
        currentYear = years.find(y => y.year_name?.includes(currentYearNumber) || y.year?.includes(currentYearNumber));
      }
      
      if (!currentYear) {
        setLoading(false);
        return;
      }

      // Get activities and filter by current year
      const activitiesResponse = await cpdAPI.getActivities();
      const allActivities = activitiesResponse.data;
      const activities = allActivities.filter(a => a.year_id === currentYear.id);

      // Calculate peer consultation hours
      const peerConsultationHours = activities
        .filter(a => a.activity_type === 'Peer Consultation')
        .reduce((sum, a) => sum + a.hours, 0);

      // Calculate total CPD hours (includes peer consultation)
      const totalCPDHours = activities.reduce((sum, a) => sum + a.hours, 0);

      // General CPD is total minus peer consultation
      const generalCPDHours = totalCPDHours - peerConsultationHours;

      setCpdData({
        peerConsultationHours,
        generalCPDHours,
        totalCPDHours,
        peerConsultationTarget: 10,
        totalTarget: 40, // Total CPD requirement is 40 hours annually
        peerConsultationMet: peerConsultationHours >= 10,
        totalMet: totalCPDHours >= 40
      });
    } catch (error) {
      console.error('Failed to load CPD data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
        <CardHeader className="p-4 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-800">CPD Hours</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="skeleton skeleton-card h-32"></div>
        </CardContent>
      </Card>
    );
  }

  if (!cpdData) {
    return (
      <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
        <CardHeader className="p-4 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-800">CPD Hours</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-slate-500">No CPD activities logged yet</p>
        </CardContent>
      </Card>
    );
  }

  const peerPercentage = (cpdData.peerConsultationHours / cpdData.peerConsultationTarget) * 100;
  const totalPercentage = (cpdData.totalCPDHours / cpdData.totalTarget) * 100;

  return (
    <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
      <CardHeader className="p-4 border-b border-slate-100">
        <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          CPD Hours
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Total CPD */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Total CPD</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                {cpdData.totalCPDHours.toFixed(1)}h / {cpdData.totalTarget}h
              </span>
              {cpdData.totalMet ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600" />
              )}
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all"
              style={{ width: `${Math.min(totalPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {totalPercentage >= 100 ? 'Annual requirement met' : `${(100 - totalPercentage).toFixed(0)}% remaining`}
          </p>
        </div>

        {/* Mandatory Peer Consultation */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-700" />
              <span className="text-sm font-semibold text-green-900">Peer Consultation</span>
              <span className="text-xs px-2 py-0.5 bg-green-200 text-green-800 rounded-full font-medium">
                Mandatory 10h
              </span>
            </div>
            {cpdData.peerConsultationMet && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </div>
          <div className="mb-2">
            <div className="w-full h-3 bg-green-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                style={{ width: `${Math.min(peerPercentage, 100)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-800 font-medium">
              {cpdData.peerConsultationHours.toFixed(1)}h / {cpdData.peerConsultationTarget}h
            </span>
            <span className={`font-medium ${
              cpdData.peerConsultationMet ? 'text-green-700' : 'text-amber-700'
            }`}>
              {cpdData.peerConsultationMet 
                ? '✓ Requirement Met' 
                : `${(cpdData.peerConsultationTarget - cpdData.peerConsultationHours).toFixed(1)}h needed`}
            </span>
          </div>
        </div>

        {/* General CPD */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">General CPD Activities</span>
            <span className="text-sm font-semibold text-slate-900">
              {cpdData.generalCPDHours.toFixed(1)}h
            </span>
          </div>
        </div>

        {/* Alert if peer consultation not met */}
        {!cpdData.peerConsultationMet && cpdData.totalCPDHours > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>Reminder:</strong> You must complete {(cpdData.peerConsultationTarget - cpdData.peerConsultationHours).toFixed(1)}h 
              more Peer Consultation to meet the mandatory 10-hour requirement.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
