import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { logbookAPI, cpdAPI } from '../../services/api';
import { Clock, BookOpen, Users, Target } from 'lucide-react';

export function SupervisorSupervisionRatioWidget({ psychologists }) {
  const [aggregateData, setAggregateData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (psychologists && psychologists.length > 0) {
      loadAggregateRatio();
    }
  }, [psychologists]);

  const loadAggregateRatio = async () => {
    try {
      let totalSupervision = 0;
      let totalPractice = 0;

      // Aggregate data from all psychologists
      for (const psych of psychologists) {
        try {
          const entriesResponse = await logbookAPI.getEntriesByUserId(psych.id);
          const entries = entriesResponse.data;

          const supervisionHours = entries
            .filter(e => e.activity_type === 'Supervision - Individual' || 
                         e.activity_type === 'Supervision - Group' ||
                         e.activity_type === 'Supervision')
            .reduce((sum, e) => sum + e.duration, 0);

          const practiceHours = entries
            .filter(e => e.activity_type === 'Direct Client Contact')
            .reduce((sum, e) => sum + e.duration, 0);

          totalSupervision += supervisionHours;
          totalPractice += practiceHours;
        } catch (error) {
          console.error(`Failed to load data for ${psych.name}:`, error);
        }
      }

      const currentRatio = totalSupervision > 0 ? totalPractice / totalSupervision : 0;

      setAggregateData({
        totalSupervision,
        totalPractice,
        currentRatio,
        psychologistCount: psychologists.length
      });
    } catch (error) {
      console.error('Failed to load aggregate ratio:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
        <CardHeader className="p-4 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-800">Supervision Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="skeleton skeleton-card h-24"></div>
        </CardContent>
      </Card>
    );
  }

  if (!aggregateData || aggregateData.totalPractice === 0) {
    return (
      <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
        <CardHeader className="p-4 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Supervision Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-slate-500">No practice hours logged yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
      <CardHeader className="p-4 border-b border-slate-100">
        <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Supervision Overview (All Psychologists)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Average Ratio */}
        <div className="text-center">
          <div className="text-3xl font-bold text-slate-900 mb-1">
            1:{aggregateData.currentRatio.toFixed(1)}
          </div>
          <div className="text-xs text-slate-600">
            Average Supervision Ratio
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Total Practice Hours</p>
            <p className="text-lg font-bold text-blue-600">{aggregateData.totalPractice.toFixed(1)}h</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Total Supervision</p>
            <p className="text-lg font-bold text-green-600">{aggregateData.totalSupervision.toFixed(1)}h</p>
          </div>
        </div>

        {/* Psychologist Count */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            Tracking <strong>{aggregateData.psychologistCount}</strong> {aggregateData.psychologistCount === 1 ? 'psychologist' : 'psychologists'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function SupervisorCPDWidget({ psychologists }) {
  const [aggregateData, setAggregateData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (psychologists && psychologists.length > 0) {
      loadAggregateCPD();
    }
  }, [psychologists]);

  const loadAggregateCPD = async () => {
    try {
      let totalCPD = 0;
      let totalPeerConsultation = 0;

      // Aggregate data from all psychologists
      for (const psych of psychologists) {
        try {
          const activitiesResponse = await cpdAPI.getActivitiesByUserId(psych.id);
          const activities = activitiesResponse.data;

          const peerHours = activities
            .filter(a => a.activity_type === 'Peer Consultation')
            .reduce((sum, a) => sum + a.hours, 0);

          const allHours = activities.reduce((sum, a) => sum + a.hours, 0);

          totalPeerConsultation += peerHours;
          totalCPD += allHours;
        } catch (error) {
          console.error(`Failed to load CPD data for ${psych.name}:`, error);
        }
      }

      const generalCPD = totalCPD - totalPeerConsultation;

      setAggregateData({
        totalCPD,
        totalPeerConsultation,
        generalCPD,
        psychologistCount: psychologists.length,
        averageCPD: totalCPD / psychologists.length,
        averagePeer: totalPeerConsultation / psychologists.length
      });
    } catch (error) {
      console.error('Failed to load aggregate CPD:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
        <CardHeader className="p-4 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-800">CPD Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="skeleton skeleton-card h-32"></div>
        </CardContent>
      </Card>
    );
  }

  if (!aggregateData) {
    return (
      <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
        <CardHeader className="p-4 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-800">CPD Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-slate-500">No CPD activities logged yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
      <CardHeader className="p-4 border-b border-slate-100">
        <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          CPD Overview (All Psychologists)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Total CPD */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Total CPD Hours</span>
            </div>
            <span className="text-lg font-bold text-slate-900">{aggregateData.totalCPD.toFixed(1)}h</span>
          </div>
        </div>

        {/* Peer Consultation */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200/50">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-700" />
              <span className="text-sm font-semibold text-green-900">Peer Consultation</span>
            </div>
            <span className="text-lg font-bold text-green-900">{aggregateData.totalPeerConsultation.toFixed(1)}h</span>
          </div>
        </div>

        {/* Averages */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-600 mb-2">Average per psychologist:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <p className="text-slate-500">CPD</p>
              <p className="font-bold text-slate-900">{aggregateData.averageCPD.toFixed(1)}h</p>
            </div>
            <div className="text-center">
              <p className="text-slate-500">Peer Consultation</p>
              <p className="font-bold text-slate-900">{aggregateData.averagePeer.toFixed(1)}h</p>
            </div>
          </div>
        </div>

        {/* Count */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            Tracking <strong>{aggregateData.psychologistCount}</strong> {aggregateData.psychologistCount === 1 ? 'psychologist' : 'psychologists'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
