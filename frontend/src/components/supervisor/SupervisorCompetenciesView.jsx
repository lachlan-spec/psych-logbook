import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../dashboard/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import api from '../../services/api';
import { ArrowLeft, Award, MessageSquare, Save } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';

const COMPETENCIES = [
  { id: 'ethics', name: 'Ethics and Professional Practice', color: 'blue' },
  { id: 'assessment', name: 'Psychological Assessment and Measurement', color: 'green' },
  { id: 'intervention', name: 'Intervention Strategies', color: 'purple' },
  { id: 'research', name: 'Research and Evaluation', color: 'orange' },
  { id: 'communication', name: 'Communication and Interpersonal Relationships', color: 'pink' },
  { id: 'diversity', name: 'Individual and Cultural Diversity', color: 'indigo' }
];

export default function SupervisorCompetenciesView() {
  const { psychologistId } = useParams();
  const navigate = useNavigate();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentingJournal, setCommentingJournal] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadJournals();
  }, []);

  const loadJournals = async () => {
    try {
      const response = await api.get('/competencies/journals', {
        params: psychologistId ? { user_id: psychologistId } : {}
      });
      const data = response.data || response;
      
      // Filter by psychologist if provided (double check)
      const filteredJournals = psychologistId
        ? data.filter(j => j.user_id === psychologistId)
        : data;
      
      setJournals(filteredJournals);
    } catch (error) {
      console.error('Failed to load journals:', error);
      toast.error('Failed to load competency journals');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (journalId) => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await api.patch(`/supervisor/competencies/${journalId}/comment`, {
        comment: commentText
      });
      
      toast.success('Comment added successfully');
      setCommentingJournal(null);
      setCommentText('');
      loadJournals();
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const psychologistName = journals.length > 0 && journals[0].user_id
    ? 'Psychologist' // You could fetch user name from another endpoint
    : 'Psychologist';

  // Group journals by competency
  const groupedJournals = COMPETENCIES.map(comp => ({
    ...comp,
    entries: journals.filter(j => j.competency_area === comp.id)
  }));

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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4 -ml-2 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-4xl font-bold gradient-text mb-2">{psychologistName}'s Competencies</h1>
        <p className="text-gray-600 mb-8">Review professional development across 6 core areas</p>

        {journals.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="empty-state py-8">
                <p className="text-gray-500">No competency journal entries yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groupedJournals.map(competency => (
              <Card key={competency.id} className="glass-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Award className={`w-5 h-5 text-${competency.color}-600`} />
                    {competency.name}
                    <span className="ml-auto text-sm font-normal text-gray-500">
                      {competency.entries.length} {competency.entries.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {competency.entries.length === 0 ? (
                    <p className="text-sm text-gray-500">No entries yet</p>
                  ) : (
                    <div className="space-y-3">
                      {competency.entries.slice(0, 3).map(entry => (
                        <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 line-clamp-3">{entry.entry}</p>
                          <p className="text-xs text-gray-400 mt-2">{new Date(entry.date).toLocaleDateString()}</p>
                        </div>
                      ))}
                      {competency.entries.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{competency.entries.length - 3} more entries
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
