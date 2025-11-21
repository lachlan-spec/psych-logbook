import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../dashboard/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import api from '../../services/api';
import { BookOpen, MessageSquare, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SupervisorCPDView() {
  const { psychologistId } = useParams();
  const navigate = useNavigate();
  const [allActivities, setAllActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentingActivity, setCommentingActivity] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadCPD();
  }, []);

  const loadCPD = async () => {
    try {
      const response = await api.get('/supervisor/cpd-activities');
      const data = response.data || response;
      
      // Filter by psychologist if psychologistId is provided
      const filteredActivities = psychologistId 
        ? data.filter(a => a.user_id === psychologistId)
        : data;
      
      setAllActivities(filteredActivities);
    } catch (error) {
      console.error('Failed to load CPD:', error);
      toast.error('Failed to load CPD activities');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (activityId) => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await api.patch(`/supervisor/cpd-activities/${activityId}/comment`, {
        comment: commentText
      });
      
      toast.success('Comment added successfully');
      setCommentingActivity(null);
      setCommentText('');
      loadCPD(); // Reload to show updated comment
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const totalHours = allActivities.reduce((sum, a) => sum + a.hours, 0);
  const psychologistName = allActivities.length > 0 ? allActivities[0].psychologist_name : 'Psychologist';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4 -ml-2 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-4xl font-bold gradient-text mb-2">{psychologistName}'s CPD Activities</h1>
        <p className="text-gray-600 mb-8">Review and provide feedback on professional development</p>
        
        <Card className="glass-card mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">CPD Hours Completed</p>
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
                        <p className="text-sm text-gray-600">{activity.description}</p>
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
