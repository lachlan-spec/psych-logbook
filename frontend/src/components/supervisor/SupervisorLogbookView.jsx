import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../dashboard/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import api from '../../services/api';
import { groupByWeek, formatWeekRange } from '../../lib/dateUtils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { MessageSquare, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SupervisorLogbookView() {
  const { psychologistId } = useParams();
  const navigate = useNavigate();
  const [allEntries, setAllEntries] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentingEntry, setCommentingEntry] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadLogbook();
  }, []);

  const loadLogbook = async () => {
    try {
      // Get years first
      const yearsResp = await api.getLogbookYears();
      const yearsData = yearsResp.data || yearsResp;
      setYears(yearsData);
      
      if (yearsData.length > 0 && !selectedYearId) {
        setSelectedYearId(yearsData[0].id);
      }
      
      const response = await api.get('/supervisor/logbook-entries');
      const data = response.data || response;
      
      // Filter by psychologist and year if provided
      let filteredEntries = psychologistId 
        ? data.filter(e => e.user_id === psychologistId)
        : data;
      
      if (selectedYearId) {
        filteredEntries = filteredEntries.filter(e => e.logbook_id === selectedYearId);
      }
      
      setAllEntries(filteredEntries);
    } catch (error) {
      console.error('Failed to load logbook:', error);
      toast.error('Failed to load logbook entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedYearId) {
      loadLogbook();
    }
  }, [selectedYearId]);

  const handleAddComment = async (entryId) => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await api.patch(`/supervisor/logbook-entries/${entryId}/comment`, {
        comment: commentText
      });
      
      toast.success('Comment added successfully');
      setCommentingEntry(null);
      setCommentText('');
      loadLogbook(); // Reload to show updated comment
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const weeklyData = groupByWeek(allEntries);
  const totalHours = allEntries.reduce((sum, e) => sum + e.duration, 0);
  const psychologistName = allEntries.length > 0 ? allEntries[0].psychologist_name : 'Psychologist';

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

        <h1 className="text-4xl font-bold gradient-text mb-2">{psychologistName}'s Logbook</h1>
        <p className="text-gray-600 mb-4">Review and provide feedback on practice entries</p>
        
        {years.length > 0 && (
          <div className="mb-6">
            <Select value={selectedYearId || ''} onValueChange={setSelectedYearId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y.id} value={y.id}>{y.year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <Card className="stat-card mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1">Total Hours Logged</p>
                <p className="text-2xl font-bold leading-none text-gray-900">{totalHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Weekly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(weeklyData).length === 0 ? (
              <div className="empty-state py-8">
                <p className="text-gray-500">No entries yet</p>
              </div>
            ) : (
              <Accordion type="single" collapsible>
                {Object.keys(weeklyData).sort().reverse().map(weekStart => {
                  const weekEntries = weeklyData[weekStart];
                  const weekTotal = weekEntries.reduce((sum, e) => sum + e.duration, 0);
                  return (
                    <AccordionItem key={weekStart} value={weekStart} className="border-b border-gray-200">
                      <AccordionTrigger className="hover:bg-gray-50 px-3 rounded-lg transition-all">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="font-medium text-gray-900">{formatWeekRange(weekStart)}</span>
                          <span className="font-bold text-base text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{weekTotal}h</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-3">
                          {weekEntries.map(entry => (
                            <div key={entry.id} className="list-item-card p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <p className="font-semibold text-sm text-gray-900 mb-1">{entry.activity_type}</p>
                                  <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                                  <p className="text-xs text-gray-400 mt-2">{entry.date}</p>
                                </div>
                                <span className="text-base font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{entry.duration}h</span>
                              </div>

                              {/* Supervisor Comment Section */}
                              {entry.supervisor_comment && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-xs font-semibold text-blue-900 mb-1">Supervisor Feedback</p>
                                      <p className="text-sm text-gray-700">{entry.supervisor_comment}</p>
                                      {entry.supervisor_comment_date && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          {new Date(entry.supervisor_comment_date).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Add/Edit Comment */}
                              {commentingEntry === entry.id ? (
                                <div className="mt-3 space-y-2">
                                  <Textarea
                                    placeholder="Add your feedback for this entry..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    rows={3}
                                    className="text-sm"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddComment(entry.id)}
                                      className="btn-primary"
                                    >
                                      <Save className="w-3 h-3 mr-1" />
                                      Save Feedback
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setCommentingEntry(null);
                                        setCommentText('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setCommentingEntry(entry.id);
                                    setCommentText(entry.supervisor_comment || '');
                                  }}
                                  className="mt-3"
                                >
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  {entry.supervisor_comment ? 'Edit Feedback' : 'Add Feedback'}
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
