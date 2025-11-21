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
import { cpdAPI } from '../../services/api';
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
      
      if (yearsResp.data.length > 0) {
        setSelectedYearId(yearsResp.data[0].id);
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
        await cpdAPI.createConsultation({
          ...formData,
          year_id: selectedYearId,
          linked_goal_id: formData.linked_goal_id || null
        });
        toast.success('Consultation logged');
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
              <Button size="sm" onClick={handleOpenAddDialog} className="h-8 px-3 text-xs bg-slate-900 hover:bg-slate-800 text-white">
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
                  <SelectItem key={y.id} value={y.id} className="text-sm">{y.year}</SelectItem>
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
              
              <TabsContent value="weekly" className="space-y-4">
                {Object.keys(weeklyData).length === 0 ? (
                  <div className="empty-state py-8">
                    <p className="text-gray-500 mb-2">No consultations logged yet</p>
                    <p className="text-xs text-gray-400">Start by logging your first peer consultation</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible>
                    {Object.keys(weeklyData).sort().reverse().map(weekStart => {
                      const weekConsultations = weeklyData[weekStart];
                      const weekMinutes = weekConsultations.reduce((sum, c) => sum + c.minutes_spent, 0);
                      return (
                        <AccordionItem key={weekStart} value={weekStart} className="border-b border-gray-200">
                          <AccordionTrigger className="hover:bg-gray-50 px-3 rounded-lg transition-all">
                            <div className="flex items-center justify-between w-full pr-4">
                              <span className="font-medium text-gray-900">{formatWeekRange(weekStart)}</span>
                              <span className="text-base font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                                {(weekMinutes / 60).toFixed(1)}h
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pt-3">
                              {weekConsultations.map(consultation => (
                                <div key={consultation.id} className="list-item-card p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm text-gray-700">{consultation.activity_description}</p>
                                      <p className="text-xs text-gray-400 mt-1">{consultation.date}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                        {consultation.minutes_spent}m
                                      </span>
                                      <Button size="sm" variant="ghost" onClick={() => handleOpenEditDialog(consultation)} className="hover:bg-blue-50 hover:text-blue-600">
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => handleDeleteConsultation(consultation.id)} className="hover:bg-red-50 hover:text-red-600">
                                        <Trash2 className="w-4 h-4" />
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

              <TabsContent value="monthly" className="space-y-4">
                {Object.keys(monthlyData).length === 0 ? (
                  <div className="empty-state py-8">
                    <p>No consultations logged yet</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible>
                    {Object.keys(monthlyData).sort().reverse().map(monthKey => {
                      const monthConsultations = monthlyData[monthKey];
                      const monthMinutes = monthConsultations.reduce((sum, c) => sum + c.minutes_spent, 0);
                      return (
                        <AccordionItem key={monthKey} value={monthKey} className="border-b border-gray-200">
                          <AccordionTrigger className="hover:bg-gray-50 px-3 rounded-lg transition-all">
                            <div className="flex items-center justify-between w-full pr-4">
                              <span className="font-medium text-gray-900">{getMonthName(monthKey)}</span>
                              <span className="text-base font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                                {(monthMinutes / 60).toFixed(1)}h
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pt-3">
                              {monthConsultations.map(consultation => (
                                <div key={consultation.id} className="list-item-card p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm text-gray-600">{consultation.activity_description}</p>
                                      <p className="text-xs text-gray-500 mt-1">{consultation.date}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-purple-600">
                                        {consultation.minutes_spent}m
                                      </span>
                                      <Button size="sm" variant="ghost" onClick={() => handleOpenEditDialog(consultation)} className="hover:bg-blue-50 hover:text-blue-600">
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => handleDeleteConsultation(consultation.id)} className="hover:bg-red-50 hover:text-red-600">
                                        <Trash2 className="w-4 h-4" />
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
                  <div className="empty-state py-8">
                    <p>No consultations logged yet</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible>
                    <AccordionItem value="total" className="border-b border-gray-200">
                      <AccordionTrigger className="hover:bg-gray-50 px-3 rounded-lg transition-all">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="font-medium text-gray-900">Total Period</span>
                          <span className="font-bold text-base text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                            {(yearConsultations.reduce((sum, c) => sum + c.minutes_spent, 0) / 60).toFixed(1)}h
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-3">
                          {yearConsultations.sort((a, b) => new Date(b.date) - new Date(a.date)).map(consultation => (
                            <div key={consultation.id} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-gray-600">{consultation.activity_description}</p>
                                  <p className="text-xs text-gray-500 mt-1">{consultation.date}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-purple-600">
                                    {consultation.minutes_spent}m
                                  </span>
                                  <Button size="sm" variant="ghost" onClick={() => handleOpenEditDialog(consultation)} className="hover:bg-blue-50 hover:text-blue-600">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteConsultation(consultation.id)} className="hover:bg-red-50 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
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
