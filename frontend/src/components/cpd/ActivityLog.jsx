import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PortalNav from '../dashboard/PortalNav';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '../ui/breadcrumb';
import { cpdAPI, logbookAPI } from '../../services/api';
import { toast } from 'sonner';
import { groupByWeek, groupByMonth, getMonthName, formatWeekRange } from '../../lib/dateUtils';
import { CPD_TAGS } from '../../lib/constants';
import { BookOpen, Plus, Download, Settings, MessageSquare, Edit, Trash2, Tag, Home } from 'lucide-react';

export default function ActivityLog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [years, setYears] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    activity_type: 'Workshop',
    minutes: '',
    description: '',
    reflection: '',
    date: new Date().toISOString().split('T')[0],
    linked_goal_id: '',
    tags: []
  });

  const loadPlansForYear = async (yearId) => {
    try {
      const response = await cpdAPI.getPlans(null, yearId);
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
      
      // Auto-select the year that includes today's date
      if (yearsResp.data.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const currentYearNumber = new Date(today).getFullYear().toString();
        
        // First try to find by date range
        let currentPeriod = yearsResp.data.find(y => {
          if (y.start_date && y.end_date) {
            return y.start_date <= today && y.end_date >= today;
          }
          return false;
        });
        
        // If no date match, try to match by year name
        if (!currentPeriod) {
          currentPeriod = yearsResp.data.find(y => 
            y.year?.includes(currentYearNumber) || y.year_name?.includes(currentYearNumber)
          );
        }
        
        // If still no match, default to first year
        const selectedYear = currentPeriod || yearsResp.data[0];
        setSelectedYearId(selectedYear.id);
      }
    } catch (error) {
      toast.error('Failed to load CPD data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      loadPlansForYear(selectedYearId);
    }
  }, [selectedYearId]);

  const handleOpenAddDialog = () => {
    setEditingActivity(null);
    setFormData({
      activity_type: 'Workshop',
      minutes: '',
      description: '',
      reflection: '',
      date: new Date().toISOString().split('T')[0],
      linked_goal_id: '',
      tags: []
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (activity) => {
    setEditingActivity(activity);
    setFormData({
      activity_type: activity.activity_type,
      minutes: String(Math.round(activity.hours * 60)),
      description: activity.description,
      reflection: activity.reflection || '',
      date: activity.date,
      linked_goal_id: activity.linked_goal_id || '',
      tags: activity.tags || []
    });
    setDialogOpen(true);
  };

  const handleSaveActivity = async () => {
    if (!formData.minutes || !formData.description) {
      toast.error('Please fill required fields');
      return;
    }
    try {
      const hours = parseFloat(formData.minutes) / 60;
      
      if (editingActivity) {
        await cpdAPI.updateActivity(editingActivity.id, { ...formData, hours });
        toast.success('Activity updated');
      } else {
        await cpdAPI.createActivity({ ...formData, hours, year_id: selectedYearId });
        
        // Auto-create logbook entry for new CPD activities
        try {
          const logbookYears = await logbookAPI.getYears();
          if (logbookYears.data.length > 0) {
            const currentLogbookYear = logbookYears.data[0];
            await logbookAPI.createEntry({
              logbook_id: currentLogbookYear.id,
              date: formData.date,
              duration: hours,
              activity_type: 'CPD',
              notes: `${formData.activity_type}: ${formData.description}`,
              reflections: formData.reflection || ''
            });
          }
        } catch (logbookError) {
          console.error('Failed to auto-log to logbook:', logbookError);
        }
        
        toast.success('Activity added and logged to logbook');
      }
      
      setDialogOpen(false);
      setEditingActivity(null);
      loadData();
    } catch (error) {
      toast.error(editingActivity ? 'Failed to update activity' : 'Failed to add activity');
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!confirm("Delete this activity?")) return;
    try {
      await cpdAPI.deleteActivity(activityId);
      toast.success("Activity deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete activity");
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
    <div className="min-h-screen bg-gradient-primary">
      <PortalNav />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard" className="flex items-center gap-1">
                  <Home className="icon-sm" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/cpd">CPD Hub</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Activities</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-dark mb-1">CPD Activities</h1>
            <p className="text-xs sm:text-sm text-neutral-light">Track your professional development</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleOpenAddDialog} className="h-8 px-3 text-xs bg-gradient-to-r bg-success text-success hover:from-green-200 hover:to-emerald-200 border border-success">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Activity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingActivity ? "Edit CPD Activity" : "Add CPD Activity"}</DialogTitle>
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
                    <Label>Duration (minutes)</Label>
                    <Input 
                      type="number" 
                      min="1"
                      step="1" 
                      value={formData.minutes} 
                      onChange={e => setFormData({...formData, minutes: e.target.value})} 
                      placeholder="e.g., 90 for 1.5 hours"
                    />
                    {formData.minutes && (
                      <p className="text-xs text-neutral-light mt-1">= {(parseFloat(formData.minutes) / 60).toFixed(2)} hours</p>
                    )}
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} />
                  </div>
                  <div>
                    <Label>Reflection (optional)</Label>
                    <Textarea value={formData.reflection} onChange={e => setFormData({...formData, reflection: e.target.value})} rows={2} />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Tag className="icon-sm" />
                      Competency Tags (optional)
                    </Label>
                    <p className="text-xs text-neutral-light mb-2">Tag this activity to track specific competency areas for PBA Code compliance</p>
                    <div className="flex flex-wrap gap-2">
                      {CPD_TAGS.map(tag => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            const newTags = formData.tags.includes(tag.id)
                              ? formData.tags.filter(t => t !== tag.id)
                              : [...formData.tags, tag.id];
                            setFormData({...formData, tags: newTags});
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                            formData.tags.includes(tag.id)
                              ? `bg-${tag.color}-100 text-${tag.color}-700 border-2 border-${tag.color}-300`
                              : 'bg-neutral text-neutral border-2 border-transparent hover:bg-neutral'
                          }`}
                        >
                          {formData.tags.includes(tag.id) && '✓ '}
                          {tag.name}
                        </button>
                      ))}
                    </div>
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
                <Button onClick={handleSaveActivity} className="w-full btn-primary">{editingActivity ? "Update Activity" : "Add Activity"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {years.length > 0 && (
          <div className="mb-4">
            <Label className="text-xs font-medium text-neutral mb-1.5 block">Year</Label>
            <Select value={selectedYearId || ""} onValueChange={setSelectedYearId}>
              <SelectTrigger className="w-32 h-8 text-sm border-neutral">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y.id} value={y.id} className="text-sm">{y.year} CPD Year</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Card className="card shadow-sm">
          <CardHeader className="p-4 border-b border-neutral">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-neutral-dark">Activities</CardTitle>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => document.querySelector('[value="weekly"]')?.click()}
                  className="h-7 px-2.5 text-xs text-neutral-light hover:bg-neutral"
                >
                  Week
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => document.querySelector('[value="monthly"]')?.click()}
                  className="h-7 px-2.5 text-xs text-neutral-light hover:bg-neutral"
                >
                  Month
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => document.querySelector('[value="yearly"]')?.click()}
                  className="h-7 px-2.5 text-xs text-neutral-light hover:bg-neutral"
                >
                  All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="yearly">
              <TabsList className="hidden">
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">All Activities</TabsTrigger>
              </TabsList>
              <TabsContent value="weekly">
                {Object.keys(weeklyData).length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-neutral-light">No activities yet</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible>
                    {Object.keys(weeklyData).sort().reverse().map(weekStart => {
                      const weekActivities = weeklyData[weekStart];
                      const weekTotal = weekActivities.reduce((sum, a) => sum + a.hours, 0);
                      return (
                        <AccordionItem key={weekStart} value={weekStart} className="border-b border-neutral last:border-0">
                          <AccordionTrigger className="hover:bg-neutral/50 px-4 py-3 transition-all">
                            <div className="flex items-center justify-between w-full pr-3">
                              <span className="text-sm font-medium text-neutral">{formatWeekRange(weekStart)}</span>
                              <span className="text-sm font-semibold text-success bg-success px-2.5 py-0.5 rounded-full">{weekTotal.toFixed(1)}h</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 px-4 pb-3">
                              {weekActivities.map(activity => (
                                <div key={activity.id} className="bg-neutral/50 rounded-lg p-3 border border-neutral">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm text-neutral-dark mb-1">{activity.activity_type}</p>
                                      <p className="text-xs text-neutral mb-1">{activity.description}</p>
                                      <p className="text-xs text-neutral-light">{activity.date}</p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-3">
                                      <span className="text-sm font-semibold text-success bg-success px-2 py-0.5 rounded">{activity.hours}h</span>
                                      <Button size="sm" variant="ghost" onClick={() => handleOpenEditDialog(activity)} className="h-7 w-7 p-0 hover:bg-neutral text-neutral">
                                        <Edit className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => handleDeleteActivity(activity.id)} className="h-7 w-7 p-0 hover:bg-error text-neutral hover:text-error">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                  {activity.supervisor_comment && (
                                    <div className="mt-2 p-2 bg-success/50 border border-success/50 rounded">
                                      <div className="flex items-start gap-2">
                                        <MessageSquare className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-success mb-0.5">Supervisor Feedback</p>
                                          <p className="text-xs text-neutral">{activity.supervisor_comment}</p>
                                          {activity.supervisor_comment_date && (
                                            <p className="text-xs text-neutral-light mt-0.5">
                                              {new Date(activity.supervisor_comment_date).toLocaleDateString()}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
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
              </TabsContent>
              <TabsContent value="monthly">
                {Object.keys(monthlyData).length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-neutral-light">No activities yet</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible>
                    {Object.keys(monthlyData).sort().reverse().map(monthKey => {
                      const monthActivities = monthlyData[monthKey];
                      const monthTotal = monthActivities.reduce((sum, a) => sum + a.hours, 0);
                      return (
                        <AccordionItem key={monthKey} value={monthKey} className="border-b border-neutral last:border-0">
                          <AccordionTrigger className="hover:bg-neutral/50 px-4 py-3 transition-all">
                            <div className="flex items-center justify-between w-full pr-3">
                              <span className="text-sm font-medium text-neutral">{getMonthName(monthKey)}</span>
                              <span className="text-sm font-semibold text-success bg-success px-2.5 py-0.5 rounded-full">{monthTotal.toFixed(1)}h</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 px-4 pb-3">
                              {monthActivities.map(activity => (
                                <div key={activity.id} className="bg-neutral/50 rounded-lg p-3 border border-neutral">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm text-neutral-dark mb-1">{activity.activity_type}</p>
                                      <p className="text-xs text-neutral mb-1">{activity.description}</p>
                                      <p className="text-xs text-neutral-light">{activity.date}</p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-3">
                                      <span className="text-sm font-semibold text-success bg-success px-2 py-0.5 rounded">{activity.hours}h</span>
                                      <Button size="sm" variant="ghost" onClick={() => handleOpenEditDialog(activity)} className="h-7 w-7 p-0 hover:bg-neutral text-neutral">
                                        <Edit className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => handleDeleteActivity(activity.id)} className="h-7 w-7 p-0 hover:bg-error text-neutral hover:text-error">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                  {activity.supervisor_comment && (
                                    <div className="mt-2 p-2 bg-success/50 border border-success/50 rounded">
                                      <div className="flex items-start gap-2">
                                        <MessageSquare className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-success mb-0.5">Supervisor Feedback</p>
                                          <p className="text-xs text-neutral">{activity.supervisor_comment}</p>
                                          {activity.supervisor_comment_date && (
                                            <p className="text-xs text-neutral-light mt-0.5">
                                              {new Date(activity.supervisor_comment_date).toLocaleDateString()}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
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
              </TabsContent>
              <TabsContent value="yearly">
                {yearActivities.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-neutral-light">No activities yet</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible>
                    <AccordionItem value="total" className="border-b border-neutral last:border-0">
                      <AccordionTrigger className="hover:bg-neutral/50 px-4 py-3 transition-all">
                        <div className="flex items-center justify-between w-full pr-3">
                          <span className="text-sm font-medium text-neutral">All Entries</span>
                          <span className="text-sm font-semibold text-success bg-success px-2.5 py-0.5 rounded-full">
                            {yearActivities.reduce((sum, a) => sum + a.hours, 0).toFixed(1)}h
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 px-4 pb-3">
                          {yearActivities.sort((a, b) => new Date(b.date) - new Date(a.date)).map(activity => (
                            <div key={activity.id} className="bg-neutral/50 rounded-lg p-3 border border-neutral">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-neutral-dark mb-1">{activity.activity_type}</p>
                                  <p className="text-xs text-neutral mb-1">{activity.description}</p>
                                  <p className="text-xs text-neutral-light">{activity.date}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-3">
                                  <span className="text-sm font-semibold text-success bg-success px-2 py-0.5 rounded">{activity.hours}h</span>
                                  <Button size="sm" variant="ghost" onClick={() => handleOpenEditDialog(activity)} className="h-7 w-7 p-0 hover:bg-neutral text-neutral">
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteActivity(activity.id)} className="h-7 w-7 p-0 hover:bg-error text-neutral hover:text-error">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                              {activity.supervisor_comment && (
                                <div className="mt-2 p-2 bg-success/50 border border-success/50 rounded">
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-success mb-0.5">Supervisor Feedback</p>
                                      <p className="text-xs text-neutral">{activity.supervisor_comment}</p>
                                      {activity.supervisor_comment_date && (
                                        <p className="text-xs text-neutral-light mt-0.5">
                                          {new Date(activity.supervisor_comment_date).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
