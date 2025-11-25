import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { logbookAPI } from '../../services/api';
import { Clock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

export default function LogbookWidget() {
  const [logbookData, setLogbookData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogbookData();
  }, []);

  const loadLogbookData = async () => {
    try {
      // Get logbook years to find current period
      const yearsResponse = await logbookAPI.getYears();
      const years = yearsResponse.data;
      
      // Find the year that includes today's date
      const today = new Date().toISOString().split('T')[0];
      const currentYear = years.find(y => y.start_date <= today && y.end_date >= today);
      
      if (!currentYear) {
        setLoading(false);
        return;
      }

      // Get entries for current year
      const entriesResponse = await logbookAPI.getEntries();
      const allEntries = entriesResponse.data;
      const entries = allEntries.filter(e => e.logbook_id === currentYear.id);

      // Calculate totals by activity type
      const totalHours = entries.reduce((sum, e) => sum + e.duration, 0);
      
      const directClientHours = entries
        .filter(e => e.activity_type === 'Direct Client Contact')
        .reduce((sum, e) => sum + e.duration, 0);
      
      const supervisionHours = entries
        .filter(e => e.activity_type === 'Supervision - Individual' || 
                     e.activity_type === 'Supervision - Group' ||
                     e.activity_type === 'Supervision')
        .reduce((sum, e) => sum + e.duration, 0);
      
      const cpdHours = entries
        .filter(e => e.activity_type === 'CPD' || e.activity_type === 'Peer Consultation')
        .reduce((sum, e) => sum + e.duration, 0);

      const otherHours = entries
        .filter(e => !['Direct Client Contact', 'Supervision - Individual', 'Supervision - Group', 
                       'Supervision', 'CPD', 'Peer Consultation'].includes(e.activity_type))
        .reduce((sum, e) => sum + e.duration, 0);

      // Get targets from the year
      const targetHours = currentYear.target_hours || 1500;
      const progress = (totalHours / targetHours) * 100;

      // Get individual targets
      const targetDirectClient = currentYear.target_direct_client || 0;
      const targetSupervision = currentYear.target_supervision || 0;
      const targetCPD = currentYear.target_cpd || 0;
      const targetOther = currentYear.target_other || 0;

      // Calculate individual percentages
      const directClientPercent = targetDirectClient > 0 ? (directClientHours / targetDirectClient) * 100 : 0;
      const supervisionPercent = targetSupervision > 0 ? (supervisionHours / targetSupervision) * 100 : 0;
      const cpdPercent = targetCPD > 0 ? (cpdHours / targetCPD) * 100 : 0;
      const otherPercent = targetOther > 0 ? (otherHours / targetOther) * 100 : 0;

      setLogbookData({
        totalHours,
        directClientHours,
        supervisionHours,
        cpdHours,
        otherHours,
        targetHours,
        progress,
        yearName: currentYear.year_name,
        targetMet: totalHours >= targetHours,
        // Individual targets and percentages
        targetDirectClient,
        targetSupervision,
        targetCPD,
        targetOther,
        directClientPercent,
        supervisionPercent,
        cpdPercent,
        otherPercent
      });
    } catch (error) {
      console.error('Failed to load logbook data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="card">
        <CardHeader className="p-4 border-b border-neutral">
          <CardTitle className="text-sm font-semibold text-neutral-dark">Practice Logbook</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="skeleton skeleton-card h-32"></div>
        </CardContent>
      </Card>
    );
  }

  if (!logbookData) {
    return (
      <Card className="card">
        <CardHeader className="p-4 border-b border-neutral">
          <CardTitle className="text-sm font-semibold text-neutral-dark flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Practice Logbook
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-neutral-light">No logbook data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card">
      <CardHeader className="p-3 sm:p-4 border-b border-neutral">
        <CardTitle className="text-xs sm:text-sm font-semibold text-neutral-dark flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Practice Logbook
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 space-y-3">
        {/* Total Hours Display */}
        <div className="text-center">
          <div className="text-2xl sm:text-3xl font-bold text-neutral-dark mb-0.5">
            {logbookData.totalHours.toFixed(1)}h
          </div>
          <div className="text-xs text-neutral-light">
            of {logbookData.targetHours}h ({logbookData.progress.toFixed(0)}%)
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2 bg-neutral rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r bg-gradient-blue transition-all"
              style={{ width: `${Math.min(logbookData.progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Hours Breakdown - Compact */}
        <div className="pt-2 border-t border-neutral space-y-1.5">
          {logbookData.targetDirectClient > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral">Direct Client</span>
              <span className="font-semibold text-neutral-dark">{logbookData.directClientHours.toFixed(1)}h <span className="text-neutral-light font-normal">({logbookData.directClientPercent.toFixed(0)}%)</span></span>
            </div>
          )}
          {logbookData.targetSupervision > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral">Supervision</span>
              <span className="font-semibold text-neutral-dark">{logbookData.supervisionHours.toFixed(1)}h <span className="text-neutral-light font-normal">({logbookData.supervisionPercent.toFixed(0)}%)</span></span>
            </div>
          )}
          {logbookData.targetCPD > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral">CPD</span>
              <span className="font-semibold text-neutral-dark">{logbookData.cpdHours.toFixed(1)}h <span className="text-neutral-light font-normal">({logbookData.cpdPercent.toFixed(0)}%)</span></span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
