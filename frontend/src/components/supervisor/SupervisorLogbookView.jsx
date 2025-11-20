import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../dashboard/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import api from '../../services/api';
import { groupByWeek, formatWeekRange } from '../../lib/dateUtils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { MessageSquare, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SupervisorLogbookView() {
  const { psychologistId } = useParams();
  const navigate = useNavigate();
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentingEntry, setCommentingEntry] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadLogbook();
  }, []);

  const loadLogbook = async () => {
    try {
      const response = await api.get('/supervisor/logbook-entries');
      const data = response.data || response;
      
      // Filter by psychologist if psychologistId is provided
      const filteredEntries = psychologistId 
        ? data.filter(e => e.user_id === psychologistId)
        : data;
      
      setAllEntries(filteredEntries);
    } catch (error) {
      console.error('Failed to load logbook:', error);
      toast.error('Failed to load logbook entries');
    } finally {
      setLoading(false);
    }
  };

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

  const weeklyData = groupByWeek(entries);
  const totalHours = entries.reduce((sum, e) => sum + e.duration, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold gradient-text mb-8">Psychologist Logbook (Read-Only)</h1>
        
        <Card className="glass-card mb-6">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Hours Logged</p>
            <p className="text-4xl font-bold text-blue-700">{totalHours}</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Weekly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(weeklyData).length === 0 ? (
              <div className="empty-state py-8">
                <p>No entries yet</p>
              </div>
            ) : (
              <Accordion type="single" collapsible>
                {Object.keys(weeklyData).sort().reverse().map(weekStart => {
                  const weekEntries = weeklyData[weekStart];
                  const weekTotal = weekEntries.reduce((sum, e) => sum + e.duration, 0);
                  return (
                    <AccordionItem key={weekStart} value={weekStart}>
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full pr-4">
                          <span>{formatWeekRange(weekStart)}</span>
                          <span className="font-semibold text-blue-600">{weekTotal}h</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-3">
                          {weekEntries.map(entry => (
                            <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{entry.activity_type}</p>
                                  <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                                  <p className="text-xs text-gray-500 mt-1">{entry.date}</p>
                                </div>
                                <span className="text-sm font-semibold text-blue-600">{entry.duration}h</span>
                              </div>
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
