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
      <div className="min-h-screen bg-neutral">
        <Navbar />
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4 -ml-2 hover:bg-neutral"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-4xl font-bold gradient-text mb-2">{psychologistName}'s Competencies</h1>
        <p className="text-neutral mb-8">Review professional development across 6 core areas</p>

        {journals.length === 0 ? (
          <Card className="card">
            <CardContent className="pt-6">
              <div className="empty-state py-8">
                <p className="text-neutral-light">No competency journal entries yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groupedJournals.map(competency => (
              <Card key={competency.id} className="card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Award className={`w-5 h-5 text-${competency.color}-600`} />
                    {competency.name}
                    <span className="ml-auto text-sm font-normal text-neutral-light">
                      {competency.entries.length} {competency.entries.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {competency.entries.length === 0 ? (
                    <p className="text-sm text-neutral-light">No entries yet</p>
                  ) : (
                    <div className="space-y-3">
                      {competency.entries.map(entry => (
                        <div key={entry.id} className="p-3 bg-neutral rounded-lg">
                          <p className="text-sm text-neutral">{entry.entry}</p>
                          <p className="text-xs text-neutral-light mt-2">{new Date(entry.date).toLocaleDateString()}</p>
                          
                          {/* Supervisor Comment */}
                          {entry.supervisor_comment && (
                            <div className="mt-3 p-2 bg-primary-light border border-primary rounded-lg">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-blue-900 mb-1">Supervisor Feedback</p>
                                  <p className="text-xs text-neutral">{entry.supervisor_comment}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Add/Edit Comment */}
                          {commentingJournal === entry.id ? (
                            <div className="mt-2 space-y-2">
                              <Textarea
                                placeholder="Add your feedback..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                rows={2}
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAddComment(entry.id)}
                                  className="btn-primary text-xs"
                                >
                                  <Save className="w-3 h-3 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setCommentingJournal(null);
                                    setCommentText('');
                                  }}
                                  className="text-xs"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setCommentingJournal(entry.id);
                                setCommentText(entry.supervisor_comment || '');
                              }}
                              className="mt-2 text-xs"
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {entry.supervisor_comment ? 'Edit Feedback' : 'Add Feedback'}
                            </Button>
                          )}
                        </div>
                      ))}
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
