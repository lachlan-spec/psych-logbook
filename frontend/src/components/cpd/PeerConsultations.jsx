import React, { useState, useEffect } from 'react';
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
import { cpdAPI, logbookAPI } from '../../services/api';
import { toast } from 'sonner';
import { groupByWeek, groupByMonth, getMonthName, formatWeekRange } from '../../lib/dateUtils';
import { Users, Plus, ArrowLeft, Settings, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PeerConsultations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [years, setYears] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    minutes_spent: '',
    activity_description: '',
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

  const loadData = async () => {
    try {
      const [yearsResp, consultationsResp] = await Promise.all([
        cpdAPI.getYears(),
        cpdAPI.getConsultations()
      ]);
      
      setYears(yearsResp.data);
      setConsultations(consultationsResp.data);
      
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
      toast.error('Failed to load data');
    }
  };

  const loadPlansForYear = async () => {
    try {
      const response = await cpdAPI.getPlans(null, selectedYearId);
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to load plans');
    }
  };

  const handleOpenAddDialog = () => {
    setEditingConsultation(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      minutes_spent: '',
      activity_description: '',
      linked_goal_id: ''
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (consultation) => {
    setEditingConsultation(consultation);
    setFormData({
      date: consultation.date,
      minutes_spent: String(consultation.minutes_spent),
      activity_description: consultation.activity_description,
      linked_goal_id: consultation.linked_goal_id || ''
    });
    setDialogOpen(true);
  };

  const handleSaveConsultation = async () => {
    if (!formData.minutes_spent || !formData.activity_description) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      if (editingConsultation) {
        await cpdAPI.updateConsultation(editingConsultation.id, {
          ...formData,
          linked_goal_id: formData.linked_goal_id || null
        });
        toast.success('Consultation updated');
      } else {
        const hours = parseFloat(formData.minutes_spent) / 60;
        
        // Create peer consultation record
        await cpdAPI.createConsultation({
          ...formData,
          year_id: selectedYearId,
          linked_goal_id: formData.linked_goal_id || null
        });
        
        // Also create corresponding CPD activity (peer consultation counts toward total CPD)
        await cpdAPI.createActivity({
          year_id: selectedYearId,
          activity_type: 'Peer Consultation',
          hours: hours,
          description: formData.activity_description,
          reflection: '',
          date: formData.date,
          linked_goal_id: formData.linked_goal_id || null,
          tags: []
        });
        
        // Also create logbook entry (peer consultation counts toward practice hours)
        try {
          const logbookYears = await logbookAPI.getYears();
          if (logbookYears.data.length > 0) {
            const currentLogbookYear = logbookYears.data[0];
            await logbookAPI.createEntry({
              logbook_id: currentLogbookYear.id,
              date: formData.date,
              duration: hours,
              activity_type: 'Peer Consultation',
              notes: formData.activity_description,
              reflections: ''
            });
          }
        } catch (logbookError) {
          console.error('Failed to auto-log to logbook:', logbookError);
        }
        
        toast.success('Peer consultation logged to CPD, activities, and practice logbook');
      }
      
      setDialogOpen(false);
      setEditingConsultation(null);
      loadData();
    } catch (error) {
      toast.error(editingConsultation ? 'Failed to update consultation' : 'Failed to log consultation');
    }
  };

  const handleDeleteConsultation = async (consultationId) => {
    if (!confirm("Delete this consultation?")) return;
    try {
      await cpdAPI.deleteConsultation(consultationId);
      toast.success("Consultation deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete consultation");
    }
  };

  const yearConsultations = consultations.filter(c => c.year_id === selectedYearId);
  const totalMinutes = yearConsultations.reduce((sum, c) => sum + c.minutes_spent, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  
  const weeklyData = groupByWeek(yearConsultations);
  const monthlyData = groupByMonth(yearConsultations);

  const availableGoals = plans.length > 0 && plans[0].goals ? plans[0].goals.filter(g => g.status === 'active') : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <PortalNav />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-3 -ml-2 hover:bg-slate-100 text-xs text-slate-600 h-7"
        >
          <ArrowLeft className="w-3 h-3 mr-1.5" />
          Back
        </Button>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-1">Peer Consultations</h1>
            <p className="text-xs sm:text-sm text-slate-500">Track your peer consultation hours</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleOpenAddDialog} className="h-8 px-3 text-xs bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 hover:from-purple-200 hover:to-violet-200 border border-purple-200">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Log Consultation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingConsultation ? "Edit Peer Consultation" : "Log Peer Consultation"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Minutes Spent</Label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={formData.minutes_spent}
                    onChange={(e) => setFormData({...formData, minutes_spent: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Activity Description</Label>
                  <Textarea
                    rows={4}
                    placeholder="Describe what was discussed during the consultation..."
                    value={formData.activity_description}
                    onChange={(e) => setFormData({...formData, activity_description: e.target.value})}
                  />
                </div>
                {availableGoals.length > 0 && (
                  <div>
                    <Label>Link to Learning Goal (Optional)</Label>
                    <Select
                      value={formData.linked_goal_id || "none"}
                      onValueChange={(v) => setFormData({...formData, linked_goal_id: v === "none" ? "" : v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {availableGoals.map(goal => (
                          <SelectItem key={goal.id} value={goal.id}>{goal.goal}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={handleSaveConsultation} className="w-full btn-primary">
                  {editingConsultation ? "Update Consultation" : "Save Consultation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {years.length > 0 && selectedYearId && (
          <div className="mb-4">
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Year</Label>
            <Select value={String(selectedYearId)} onValueChange={(val) => setSelectedYearId(val)}>
              <SelectTrigger className="w-32 h-8 text-sm border-slate-200">
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

        <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-sm">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-800">Consultations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="yearly">
              <TabsList className="hidden">
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">All</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekly">
                {Object.keys(weeklyData).length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-slate-400">No consultations yet</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible>
                    {Object.keys(weeklyData).sort().reverse().map(weekStart => {
                      const weekConsultations = weeklyData[weekStart];
                      const weekMinutes = weekConsultations.reduce((sum, c) => sum + c.minutes_spent, 0);
                      return (
                        <AccordionItem key={weekStart} value={weekStart} className="border-b border-slate-100 last:border-0">
                          <AccordionTrigger className="hover:bg-slate-50/50 px-4 py-3 transition-all">
                            <div className="flex items-center justify-between w-full pr-3">
                              <span className="text-sm font-medium text-slate-700">{formatWeekRange(weekStart)}</span>
                              <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
                                {(weekMinutes / 60).toFixed(1)}h
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 px-4 pb-3">
                              {weekConsultations.map(consultation => (
                                <div key={consultation.id} className="bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-slate-600 mb-1">{consultation.activity_description}</p>
                                      <p className="text-xs text-slate-400">{consultation.date}</p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-3">
                                      <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                        {consultation.minutes_spent}m
                                      </span>
                                      <Button size="sm" variant="ghost" onClick={() => handleOpenEditDialog(consultation)} className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600">
                                        <Edit className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => handleDeleteConsultation(consultation.id)} className="h-7 w-7 p-0 hover:bg-red-50 text-slate-600 hover:text-red-600">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
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
              </TabsContent>

              <TabsContent value="monthly">
                {Object.keys(monthlyData).length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-slate-400">No consultations yet</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible>
                    {Object.keys(monthlyData).sort().reverse().map(monthKey => {
                      const monthConsultations = monthlyData[monthKey];
                      const monthMinutes = monthConsultations.reduce((sum, c) => sum + c.minutes_spent, 0);
                      return (
                        <AccordionItem key={monthKey} value={monthKey} className="border-b border-slate-100 last:border-0">
                          <AccordionTrigger className="hover:bg-slate-50/50 px-4 py-3 transition-all">
                            <div className="flex items-center justify-between w-full pr-3">
                              <span className="text-sm font-medium text-slate-700">{getMonthName(monthKey)}</span>
                              <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
                                {(monthMinutes / 60).toFixed(1)}h
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 px-4 pb-3">
                              {monthConsultations.map(consultation => (
                                <div key={consultation.id} className="bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-slate-600 mb-1">{consultation.activity_description}</p>
                                      <p className="text-xs text-slate-400">{consultation.date}</p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-3">
                                      <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                        {consultation.minutes_spent}m
                                      </span>
                                      <Button size="sm" variant="ghost" onClick={() => handleOpenEditDialog(consultation)} className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600">
                                        <Edit className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => handleDeleteConsultation(consultation.id)} className="h-7 w-7 p-0 hover:bg-red-50 text-slate-600 hover:text-red-600">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
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
              </TabsContent>

              <TabsContent value="yearly">
                {yearConsultations.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-slate-400">No consultations yet</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible>
                    <AccordionItem value="total" className="border-b border-slate-100 last:border-0">
                      <AccordionTrigger className="hover:bg-slate-50/50 px-4 py-3 transition-all">
                        <div className="flex items-center justify-between w-full pr-3">
                          <span className="text-sm font-medium text-slate-700">All Entries</span>
                          <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
                            {(yearConsultations.reduce((sum, c) => sum + c.minutes_spent, 0) / 60).toFixed(1)}h
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 px-4 pb-3">
                          {yearConsultations.sort((a, b) => new Date(b.date) - new Date(a.date)).map(consultation => (
                            <div key={consultation.id} className="bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-600 mb-1">{consultation.activity_description}</p>
                                  <p className="text-xs text-slate-400">{consultation.date}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-3">
                                  <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                    {consultation.minutes_spent}m
                                  </span>
                                  <Button size="sm" variant="ghost" onClick={() => handleOpenEditDialog(consultation)} className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600">
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteConsultation(consultation.id)} className="h-7 w-7 p-0 hover:bg-red-50 text-slate-600 hover:text-red-600">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
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
