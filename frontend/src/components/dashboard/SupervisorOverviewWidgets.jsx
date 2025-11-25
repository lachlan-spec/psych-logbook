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
      <Card className="card">
        <CardHeader className="p-4 border-b border-neutral">
          <CardTitle className="text-sm font-semibold text-neutral-dark">Supervision Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="skeleton skeleton-card h-24"></div>
        </CardContent>
      </Card>
    );
  }

  if (!aggregateData || aggregateData.totalPractice === 0) {
    return (
      <Card className="card">
        <CardHeader className="p-4 border-b border-neutral">
          <CardTitle className="text-sm font-semibold text-neutral-dark flex items-center gap-2">
            <Clock className="icon-sm" />
            Supervision Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-neutral-light">No practice hours logged yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card">
      <CardHeader className="p-4 border-b border-neutral">
        <CardTitle className="text-sm font-semibold text-neutral-dark flex items-center gap-2">
          <Clock className="icon-sm" />
          Supervision Overview (All Psychologists)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Average Ratio */}
        <div className="text-center">
          <div className="text-3xl font-bold text-neutral-dark mb-1">
            1:{aggregateData.currentRatio.toFixed(1)}
          </div>
          <div className="text-xs text-neutral">
            Average Supervision Ratio
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral">
          <div className="text-center">
            <p className="text-xs text-neutral-light mb-1">Total Practice Hours</p>
            <p className="text-lg font-bold text-primary">{aggregateData.totalPractice.toFixed(1)}h</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-neutral-light mb-1">Total Supervision</p>
            <p className="text-lg font-bold text-success">{aggregateData.totalSupervision.toFixed(1)}h</p>
          </div>
        </div>

        {/* Psychologist Count */}
        <div className="pt-2 border-t border-neutral text-center">
          <p className="text-xs text-neutral">
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
      <Card className="card">
        <CardHeader className="p-4 border-b border-neutral">
          <CardTitle className="text-sm font-semibold text-neutral-dark">CPD Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="skeleton skeleton-card h-32"></div>
        </CardContent>
      </Card>
    );
  }

  if (!aggregateData) {
    return (
      <Card className="card">
        <CardHeader className="p-4 border-b border-neutral">
          <CardTitle className="text-sm font-semibold text-neutral-dark">CPD Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-neutral-light">No CPD activities logged yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card">
      <CardHeader className="p-4 border-b border-neutral">
        <CardTitle className="text-sm font-semibold text-neutral-dark flex items-center gap-2">
          <BookOpen className="icon-sm" />
          CPD Overview (All Psychologists)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Total CPD */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="icon-sm text-primary" />
              <span className="text-sm font-medium text-neutral">Total CPD Hours</span>
            </div>
            <span className="text-lg font-bold text-neutral-dark">{aggregateData.totalCPD.toFixed(1)}h</span>
          </div>
        </div>

        {/* Peer Consultation */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-success/50">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Users className="icon-sm text-success" />
              <span className="text-sm font-semibold text-success">Peer Consultation</span>
            </div>
            <span className="text-lg font-bold text-success">{aggregateData.totalPeerConsultation.toFixed(1)}h</span>
          </div>
        </div>

        {/* Averages */}
        <div className="pt-2 border-t border-neutral">
          <p className="text-xs text-neutral mb-2">Average per psychologist:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <p className="text-neutral-light">CPD</p>
              <p className="font-bold text-neutral-dark">{aggregateData.averageCPD.toFixed(1)}h</p>
            </div>
            <div className="text-center">
              <p className="text-neutral-light">Peer Consultation</p>
              <p className="font-bold text-neutral-dark">{aggregateData.averagePeer.toFixed(1)}h</p>
            </div>
          </div>
        </div>

        {/* Count */}
        <div className="pt-2 border-t border-neutral text-center">
          <p className="text-xs text-neutral">
            Tracking <strong>{aggregateData.psychologistCount}</strong> {aggregateData.psychologistCount === 1 ? 'psychologist' : 'psychologists'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
