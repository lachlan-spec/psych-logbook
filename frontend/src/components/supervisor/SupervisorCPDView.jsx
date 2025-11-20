import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../dashboard/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cpdAPI } from '../../services/api';
import { BookOpen } from 'lucide-react';

export default function SupervisorCPDView() {
  const { psychologistId } = useParams();
  const [activities, setActivities] = useState([]);
  const [years, setYears] = useState([]);

  useEffect(() => {
    loadCPD();
  }, [psychologistId]);

  const loadCPD = async () => {
    try {
      const [activitiesResp, yearsResp] = await Promise.all([
        cpdAPI.getActivities(psychologistId),
        cpdAPI.getYears(psychologistId)
      ]);
      setActivities(activitiesResp.data);
      setYears(yearsResp.data);
    } catch (error) {
      console.error('Failed to load CPD');
    }
  };

  const totalHours = activities.reduce((sum, a) => sum + a.hours, 0);
  const requiredHours = years[0]?.cpd_hours_required || 30;
  const progress = (totalHours / requiredHours) * 100;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1333 0%, #2d1b4e 50%, #1a1333 100%)' }}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold gradient-text mb-8">Psychologist CPD (Read-Only)</h1>
        
        <Card className="glass-card mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-300">CPD Hours Completed</p>
                <p className="text-4xl font-bold text-green-700">{totalHours} / {requiredHours}</p>
              </div>
              <BookOpen className="w-12 h-12 text-green-600" />
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <p className="text-sm text-gray-600 mt-2">{progress.toFixed(0)}% complete</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>All Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="empty-state py-8">
                <p>No activities yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.sort((a, b) => new Date(b.date) - new Date(a.date)).map(activity => (
                  <div key={activity.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{activity.activity_type}</p>
                        <p className="text-sm text-gray-300">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                      </div>
                      <span className="text-sm font-semibold text-green-600">{activity.hours}h</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
