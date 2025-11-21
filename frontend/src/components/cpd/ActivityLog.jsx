import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../dashboard/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { cpdAPI, logbookAPI } from '../../services/api';
import { toast } from 'sonner';
import { groupByWeek, groupByMonth, getMonthName, formatWeekRange } from '../../lib/dateUtils';
import { BookOpen, Plus, Download, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ActivityLog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [years, setYears] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    activity_type: 'Workshop',
    hours: '',
    description: '',
    reflection: '',
    date: new Date().toISOString().split('T')[0],
    linked_goal_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      loadPlansForYear();
    }
  }, [selectedYearId]);

  const loadPlansForYear = async () => {
    try {
      const response = await cpdAPI.getPlans(null, selectedYearId);
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to load plans');
    }
  };

  const loadData = async () => {
    try {
      const [yearsResp, activitiesResp] = await Promise.all([
        cpdAPI.getYears(),
        cpdAPI.getActivities()
      ]);
      setYears(yearsResp.data);
      setActivities(activitiesResp.data);
      if (yearsResp.data.length > 0) {
        setSelectedYearId(yearsResp.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load CPD data');
    }
  };

  const handleAddActivity = async () => {
    if (!formData.hours || !formData.description) {
      toast.error('Please fill required fields');
      return;
    }
    try {
      // Create CPD activity
      await cpdAPI.createActivity({ ...formData, year_id: selectedYearId });
      
      // Auto-create logbook entry for CPD
      try {
        const logbookYears = await logbookAPI.getYears();
        if (logbookYears.data.length > 0) {
          // Find the most recent or current logbook year
          const currentLogbookYear = logbookYears.data[0];
          await logbookAPI.createEntry({
            logbook_id: currentLogbookYear.id,
            date: formData.date,
            duration: parseFloat(formData.hours),
            activity_type: 'CPD',
            notes: `${formData.activity_type}: ${formData.description}`,
            reflections: formData.reflection || ''
          });
        }
      } catch (logbookError) {
        console.error('Failed to auto-log to logbook:', logbookError);
        // Don't fail the whole operation if logbook entry fails
      }
      
      toast.success('Activity added and logged to logbook');
      setDialogOpen(false);
      loadData();
      setFormData({ ...formData, hours: '', description: '', reflection: '', linked_goal_id: '' });
    } catch (error) {
      toast.error('Failed to add activity');
    }
  };

  const handleCreateYear = async () => {
    const year = prompt('Enter year (e.g., 2025):');
    if (!year) return;
    try {
      await cpdAPI.createYear({ year, cpd_hours_required: 30 });
      loadData();
      toast.success('Year created');
    } catch (error) {
      toast.error('Failed to create year');
    }
  };

  const yearActivities = activities.filter(a => a.year_id === selectedYearId);
  const totalHours = yearActivities.reduce((sum, a) => sum + a.hours, 0);
  const selectedYear = years.find(y => y.id === selectedYearId);
  const progress = selectedYear ? (totalHours / selectedYear.cpd_hours_required) * 100 : 0;

  const weeklyData = groupByWeek(yearActivities);
  const monthlyData = groupByMonth(yearActivities);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">CPD Activities</h1>
            <p className="text-gray-600">Track your continuing professional development</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/cpd/settings')} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Activity
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add CPD Activity</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Activity Type</Label>
                    <Select value={formData.activity_type} onValueChange={v => setFormData({...formData, activity_type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Workshop">Workshop</SelectItem>
                        <SelectItem value="Conference">Conference</SelectItem>
                        <SelectItem value="Reading">Reading</SelectItem>
                        <SelectItem value="Online Course">Online Course</SelectItem>
                        <SelectItem value="Peer Consultation">Peer Consultation</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div>
                    <Label>Hours</Label>
                    <Input type="number" step="0.5" value={formData.hours} onChange={e => setFormData({...formData, hours: e.target.value})} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} />
                  </div>
                  <div>
                    <Label>Reflection (optional)</Label>
                    <Textarea value={formData.reflection} onChange={e => setFormData({...formData, reflection: e.target.value})} rows={2} />
                  </div>
                  {plans.length > 0 && plans[0]?.goals && plans[0].goals.length > 0 && (
                    <div>
                      <Label>Link to Learning Goal (Optional)</Label>
                      <Select value={formData.linked_goal_id || "none"} onValueChange={v => setFormData({...formData, linked_goal_id: v === "none" ? "" : v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a goal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {plans[0].goals.filter(g => g.status === 'active').map(goal => (
                            <SelectItem key={goal.id} value={goal.id}>{goal.goal}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button onClick={handleAddActivity} className="w-full btn-primary">Add Activity</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {years.length > 0 && (
          <div className="mb-6">
            <Select value={selectedYearId || ""} onValueChange={setSelectedYearId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select year" />
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
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-[13px] font-medium text-gray-500 mb-2">CPD Hours Completed</p>
                <p className="text-[36px] font-bold leading-none text-gray-900 mb-2">{totalHours} <span className="text-xl text-gray-400">/ {selectedYear?.cpd_hours_required || 30}</span></p>
                <p className="text-xs text-gray-400 mt-2">{progress.toFixed(0)}% of annual requirement</p>
              </div>
              <div className="w-14 h-14 icon-green rounded-xl flex items-center justify-center shadow-sm">
                <BookOpen className="w-7 h-7 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
              <p className="text-xs font-medium text-gray-500 mt-2">{progress.toFixed(0)}% complete</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-4">
            <CardTitle>Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="yearly">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">All Activities</TabsTrigger>
              </TabsList>
              <TabsContent value="weekly" className="space-y-4">
                {Object.keys(weeklyData).length === 0 ? (
                  <div className="empty-state py-8">
                    <p>No activities yet</p>
                  </div>
                ) : (
                  Object.keys(weeklyData).sort().reverse().map(weekStart => {
                    const weekActivities = weeklyData[weekStart];
                    const weekTotal = weekActivities.reduce((sum, a) => sum + a.hours, 0);
                    return (
                      <div key={weekStart} className="list-item-card p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">{formatWeekRange(weekStart)}</h3>
                          <span className="text-base font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">{weekTotal}h</span>
                        </div>
                        <div className="space-y-2">
                          {weekActivities.map(activity => (
                            <div key={activity.id} className="list-item-card p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-gray-900">{activity.activity_type}</p>
                                  <p className="text-sm text-gray-600">{activity.description}</p>
                                  <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                                </div>
                                <span className="text-base font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">{activity.hours}h</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </TabsContent>
              <TabsContent value="monthly" className="space-y-4">
                {Object.keys(monthlyData).length === 0 ? (
                  <div className="empty-state py-8">
                    <p>No activities yet</p>
                  </div>
                ) : (
                  Object.keys(monthlyData).sort().reverse().map(monthKey => {
                    const monthActivities = monthlyData[monthKey];
                    const monthTotal = monthActivities.reduce((sum, a) => sum + a.hours, 0);
                    return (
                      <div key={monthKey} className="list-item-card p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">{getMonthName(monthKey)}</h3>
                          <span className="text-base font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">{monthTotal}h</span>
                        </div>
                        <div className="space-y-2">
                          {monthActivities.map(activity => (
                            <div key={activity.id} className="list-item-card p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-gray-900">{activity.activity_type}</p>
                                  <p className="text-sm text-gray-600">{activity.description}</p>
                                  <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                                </div>
                                <span className="text-base font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">{activity.hours}h</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </TabsContent>
              <TabsContent value="yearly" className="space-y-3">
                {yearActivities.length === 0 ? (
                  <div className="empty-state py-8">
                    <p>No activities yet</p>
                  </div>
                ) : (
                  yearActivities.sort((a, b) => new Date(b.date) - new Date(a.date)).map(activity => (
                    <div key={activity.id} className="list-item-card p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{activity.activity_type}</p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                        </div>
                        <span className="text-base font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">{activity.hours}h</span>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
