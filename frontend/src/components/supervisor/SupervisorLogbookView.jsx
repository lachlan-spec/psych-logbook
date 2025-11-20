import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../dashboard/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { logbookAPI } from '../../services/api';
import { groupByWeek, formatWeekRange } from '../../lib/dateUtils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

export default function SupervisorLogbookView() {
  const { psychologistId } = useParams();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogbook();
  }, [psychologistId]);

  const loadLogbook = async () => {
    try {
      const response = await logbookAPI.getEntries(psychologistId);
      setEntries(response.data);
    } catch (error) {
      console.error('Failed to load logbook');
    } finally {
      setLoading(false);
    }
  };

  const weeklyData = groupByWeek(entries);
  const totalHours = entries.reduce((sum, e) => sum + e.duration, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
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
