import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Clock, BookOpen, Target, CheckCircle, AlertCircle } from 'lucide-react';

// Logbook Progress Widget for specific client
export function ClientLogbookWidget({ entries, selectedYear, allYears }) {
  if (!selectedYear || !allYears) return null;
  
  const yearData = allYears.find(y => y.id === selectedYear);
  if (!yearData) return null;

  // Calculate hours
  const yearEntries = entries.filter(e => e.logbook_id === selectedYear);
  const totalHours = yearEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const targetHours = yearData.target_hours || 1500;
  const progress = (totalHours / targetHours) * 100;

  // Calculate by type
  const directClient = yearEntries.filter(e => e.activity_type === 'Direct Client Contact')
    .reduce((sum, e) => sum + e.duration, 0);
  const supervision = yearEntries.filter(e => 
    e.activity_type === 'Supervision - Individual' || 
    e.activity_type === 'Supervision - Group' ||
    e.activity_type === 'Supervision')
    .reduce((sum, e) => sum + e.duration, 0);
  const cpd = yearEntries.filter(e => e.activity_type === 'CPD' || e.activity_type === 'Peer Consultation')
    .reduce((sum, e) => sum + e.duration, 0);

  return (
    <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
      <CardHeader className="p-3 sm:p-4 border-b border-slate-100">
        <CardTitle className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Logbook Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 space-y-3">
        <div className="text-center">
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-0.5">
            {totalHours.toFixed(1)}h
          </div>
          <div className="text-xs text-slate-500">
            of {targetHours}h ({progress.toFixed(0)}%)
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Direct Client</span>
            <span className="font-semibold text-slate-900">{directClient.toFixed(1)}h</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Supervision</span>
            <span className="font-semibold text-slate-900">{supervision.toFixed(1)}h</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">CPD</span>
            <span className="font-semibold text-slate-900">{cpd.toFixed(1)}h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// CPD Progress Widget for specific client
export function ClientCPDWidget({ activities, selectedYear, allYears }) {
  if (!selectedYear || !allYears) return null;
  
  const yearData = allYears.find(y => y.id === selectedYear);
  if (!yearData) return null;

  const yearActivities = activities.filter(a => a.year_id === selectedYear);
  const totalHours = yearActivities.reduce((sum, a) => sum + (a.hours || 0), 0);
  const targetHours = 40; // Standard CPD target
  const progress = (totalHours / targetHours) * 100;

  const peerConsultation = yearActivities
    .filter(a => a.activity_type === 'Peer Consultation')
    .reduce((sum, a) => sum + a.hours, 0);
  
  const generalCPD = totalHours - peerConsultation;

  return (
    <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
      <CardHeader className="p-3 sm:p-4 border-b border-slate-100">
        <CardTitle className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          CPD Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 space-y-3">
        <div className="text-center">
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-0.5">
            {totalHours.toFixed(1)}h
          </div>
          <div className="text-xs text-slate-500">
            of {targetHours}h ({progress.toFixed(0)}%)
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Peer Consultation</span>
            <span className="font-semibold text-slate-900">{peerConsultation.toFixed(1)}h</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">General CPD</span>
            <span className="font-semibold text-slate-900">{generalCPD.toFixed(1)}h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Supervision Ratio Widget for specific client
export function ClientSupervisionWidget({ entries, selectedYear }) {
  if (!selectedYear) return null;

  const yearEntries = entries.filter(e => e.logbook_id === selectedYear);
  
  const supervisionHours = yearEntries
    .filter(e => e.activity_type === 'Supervision - Individual' || 
                 e.activity_type === 'Supervision - Group' ||
                 e.activity_type === 'Supervision')
    .reduce((sum, e) => sum + e.duration, 0);

  const practiceHours = yearEntries
    .filter(e => e.activity_type === 'Direct Client Contact')
    .reduce((sum, e) => sum + e.duration, 0);

  const targetRatio = 17.5;
  const currentRatio = supervisionHours > 0 ? practiceHours / supervisionHours : 0;
  const maxAllowedPractice = supervisionHours * targetRatio;
  const percentage = supervisionHours > 0 ? (practiceHours / maxAllowedPractice) * 100 : 0;

  const isCompliant = currentRatio <= targetRatio && practiceHours > 0;
  const getStatusColor = () => {
    if (percentage < 80) return 'green';
    if (percentage < 95) return 'amber';
    return 'red';
  };

  const statusColor = getStatusColor();

  if (practiceHours === 0) {
    return (
      <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
        <CardHeader className="p-3 sm:p-4 border-b border-slate-100">
          <CardTitle className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Supervision Ratio
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <p className="text-xs text-slate-500">No practice hours logged yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
      <CardHeader className="p-3 sm:p-4 border-b border-slate-100">
        <CardTitle className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Supervision Ratio (1:{targetRatio})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 space-y-3">
        <div className="text-center">
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-0.5">
            1:{currentRatio.toFixed(1)}
          </div>
          <div className={`text-xs font-medium ${
            statusColor === 'green' ? 'text-green-600' :
            statusColor === 'amber' ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {isCompliant ? 'Compliant' : 'Needs Attention'}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                statusColor === 'green' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                statusColor === 'amber' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                'bg-gradient-to-r from-red-400 to-rose-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Practice Hours</span>
            <span className="font-semibold text-blue-600">{practiceHours.toFixed(1)}h</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Supervision Hours</span>
            <span className="font-semibold text-green-600">{supervisionHours.toFixed(1)}h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
