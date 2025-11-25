import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { logbookAPI } from '../../services/api';
import { AlertTriangle, CheckCircle, Clock, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function SupervisionRatioWidget() {
  const [ratio, setRatio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [targetRatio, setTargetRatio] = useState(17.5);
  const [tempRatio, setTempRatio] = useState(17.5);

  useEffect(() => {
    loadRatio();
    // Load saved ratio from localStorage
    const savedRatio = localStorage.getItem('supervision_target_ratio');
    if (savedRatio) {
      setTargetRatio(parseFloat(savedRatio));
      setTempRatio(parseFloat(savedRatio));
    }
  }, []);

  const handleSaveRatio = () => {
    const newRatio = parseFloat(tempRatio);
    if (isNaN(newRatio) || newRatio <= 0) {
      toast.error('Please enter a valid ratio');
      return;
    }
    setTargetRatio(newRatio);
    localStorage.setItem('supervision_target_ratio', newRatio.toString());
    setSettingsOpen(false);
    toast.success(`Supervision ratio updated to 1:${newRatio}`);
    loadRatio(); // Recalculate with new ratio
  };

  const loadRatio = async () => {
    try {
      const entriesResponse = await logbookAPI.getEntries();
      const entries = entriesResponse.data;

      // Calculate supervision hours (both individual and group combined)
      const supervisionHours = entries
        .filter(e => e.activity_type === 'Supervision - Individual' || 
                     e.activity_type === 'Supervision - Group' ||
                     e.activity_type === 'Supervision') // Legacy support
        .reduce((sum, e) => sum + e.duration, 0);

      // Calculate practice hours (Direct Client Contact only)
      const practiceHours = entries
        .filter(e => e.activity_type === 'Direct Client Contact')
        .reduce((sum, e) => sum + e.duration, 0);

      // Get current target ratio
      const savedRatio = localStorage.getItem('supervision_target_ratio');
      const currentTargetRatio = savedRatio ? parseFloat(savedRatio) : 17.5;

      // Calculate current ratio (practice:supervision)
      const currentRatio = supervisionHours > 0 ? practiceHours / supervisionHours : 0;
      
      // Maximum allowed practice hours for current supervision
      const maxAllowedPractice = supervisionHours * currentTargetRatio;
      
      // Required supervision hours for current practice
      const requiredSupervision = practiceHours / currentTargetRatio;

      setRatio({
        supervisionHours,
        practiceHours,
        currentRatio,
        maxAllowedPractice,
        requiredSupervision,
        isCompliant: currentRatio <= 17.5 && practiceHours > 0,
        percentage: supervisionHours > 0 ? (practiceHours / maxAllowedPractice) * 100 : 0
      });
    } catch (error) {
      console.error('Failed to load ratio:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
        <CardHeader className="p-4 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-800">Supervision Ratio</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="skeleton skeleton-card h-24"></div>
        </CardContent>
      </Card>
    );
  }

  if (!ratio || ratio.practiceHours === 0) {
    return (
      <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
        <CardHeader className="p-4 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Supervision Ratio (1:17.5)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-slate-500">No practice hours logged yet</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (ratio.percentage < 80) return 'green';
    if (ratio.percentage < 95) return 'amber';
    return 'red';
  };

  const getStatusIcon = () => {
    if (ratio.percentage < 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (ratio.percentage < 95) return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  const getStatusText = () => {
    if (ratio.percentage < 80) return 'Compliant';
    if (ratio.percentage < 95) return 'Approaching Limit';
    if (ratio.percentage < 100) return 'Near Maximum';
    return 'Ratio Exceeded';
  };

  const statusColor = getStatusColor();

  return (
    <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
      <CardHeader className="p-4 border-b border-slate-100">
        <CardTitle className="text-sm font-semibold text-slate-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Supervision Ratio (1:17.5)
          </span>
          {getStatusIcon()}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Current Ratio Display */}
        <div className="text-center">
          <div className="text-3xl font-bold text-slate-900 mb-1">
            1:{ratio.currentRatio.toFixed(1)}
          </div>
          <div className={`text-xs font-medium ${
            statusColor === 'green' ? 'text-green-600' :
            statusColor === 'amber' ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {getStatusText()}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                statusColor === 'green' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                statusColor === 'amber' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                'bg-gradient-to-r from-red-400 to-rose-500'
              }`}
              style={{ width: `${Math.min(ratio.percentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-center text-slate-500">
            {ratio.practiceHours.toFixed(1)}h / {ratio.maxAllowedPractice.toFixed(1)}h allowed
          </p>
        </div>

        {/* Hours Breakdown */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Practice Hours</p>
            <p className="text-lg font-bold text-blue-600">{ratio.practiceHours.toFixed(1)}h</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Supervision Hours</p>
            <p className="text-lg font-bold text-green-600">{ratio.supervisionHours.toFixed(1)}h</p>
          </div>
        </div>

        {/* Alert Messages */}
        {ratio.percentage >= 80 && ratio.percentage < 100 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>Alert:</strong> You need {(ratio.requiredSupervision - ratio.supervisionHours).toFixed(1)}h more supervision 
              or reduce practice hours to maintain compliance.
            </p>
          </div>
        )}

        {ratio.percentage >= 100 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-800">
              <strong>Ratio Exceeded:</strong> You need {(ratio.requiredSupervision - ratio.supervisionHours).toFixed(1)}h additional 
              supervision to meet the 1:17.5 requirement.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
