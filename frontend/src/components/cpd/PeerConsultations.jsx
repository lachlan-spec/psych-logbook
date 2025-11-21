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
import { cpdAPI } from '../../services/api';
import { toast } from 'sonner';
import { groupByWeek, groupByMonth, getMonthName, formatWeekRange } from '../../lib/dateUtils';
import { Users, Plus, ArrowLeft, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PeerConsultations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [years, setYears] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const handleAddConsultation = async () => {
    if (!formData.minutes_spent || !formData.activity_description) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      await cpdAPI.createConsultation({
        ...formData,
        year_id: selectedYearId,
        linked_goal_id: formData.linked_goal_id || null
      });
      
      toast.success('Consultation logged');
      setDialogOpen(false);
      loadData();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        minutes_spent: '',
        activity_description: '',
        linked_goal_id: ''
      });
    } catch (error) {
      toast.error('Failed to log consultation');
    }
  };

  const yearConsultations = consultations.filter(c => c.year_id === selectedYearId);
  const totalMinutes = yearConsultations.reduce((sum, c) => sum + c.minutes_spent, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  
  const weeklyData = groupByWeek(yearConsultations);
  const monthlyData = groupByMonth(yearConsultations);

  const availableGoals = plans.length > 0 && plans[0].goals ? plans[0].goals.filter(g => g.status === 'active') : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/cpd')}
          className="mb-4 -ml-2 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to CPD Hub
        </Button>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Peer Consultations</h1>
            <p className="text-gray-600">Track your peer consultation hours</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/cpd/settings')} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              CPD Year Settings
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Log Consultation
                </Button>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Peer Consultation</DialogTitle>
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
                      value={formData.linked_goal_id}
                      onValueChange={(v) => setFormData({...formData, linked_goal_id: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {availableGoals.map(goal => (
                          <SelectItem key={goal.id} value={goal.id}>{goal.goal}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={handleAddConsultation} className="w-full btn-primary">
                  Save Consultation
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {years.length > 0 && (
          <div className="mb-6">
            <Select value={selectedYearId ? String(selectedYearId) : ''} onValueChange={(val) => setSelectedYearId(Number(val))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y.id} value={String(y.id)}>{y.year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Card className="stat-card mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-[13px] font-medium text-gray-500 mb-2">Total Consultation Hours</p>
                <p className="text-[36px] font-bold leading-none text-gray-900 mb-2">{totalHours}h</p>
                <p className="text-xs text-gray-400 mt-2">{totalMinutes} minutes total</p>
              </div>
              <div className="w-14 h-14 icon-purple rounded-xl flex items-center justify-center shadow-sm">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Consultation History</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="yearly">
              <TabsList className="grid w-full grid-cols-3">
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
                  Object.keys(weeklyData).sort().reverse().map(weekStart => {
                    const weekConsultations = weeklyData[weekStart];
                    const weekMinutes = weekConsultations.reduce((sum, c) => sum + c.minutes_spent, 0);
                    return (
                      <div key={weekStart} className="list-item-card p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">{formatWeekRange(weekStart)}</h3>
                          <span className="text-base font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                            {(weekMinutes / 60).toFixed(1)}h
                          </span>
                        </div>
                        <div className="space-y-2">
                          {weekConsultations.map(consultation => (
                            <div key={consultation.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm text-gray-700">{consultation.activity_description}</p>
                                  <p className="text-xs text-gray-400 mt-1">{consultation.date}</p>
                                </div>
                                <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded ml-4">
                                  {consultation.minutes_spent}m
                                </span>
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
                    <p>No consultations logged yet</p>
                  </div>
                ) : (
                  Object.keys(monthlyData).sort().reverse().map(monthKey => {
                    const monthConsultations = monthlyData[monthKey];
                    const monthMinutes = monthConsultations.reduce((sum, c) => sum + c.minutes_spent, 0);
                    return (
                      <div key={monthKey} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{getMonthName(monthKey)}</h3>
                          <span className="font-semibold text-purple-600">
                            {(monthMinutes / 60).toFixed(1)}h ({monthMinutes}m)
                          </span>
                        </div>
                        <div className="space-y-2">
                          {monthConsultations.map(consultation => (
                            <div key={consultation.id} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm text-gray-600">{consultation.activity_description}</p>
                                  <p className="text-xs text-gray-500 mt-1">{consultation.date}</p>
                                </div>
                                <span className="text-sm font-semibold text-purple-600 ml-4">
                                  {consultation.minutes_spent}m
                                </span>
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
                {yearConsultations.length === 0 ? (
                  <div className="empty-state py-8">
                    <p>No consultations logged yet</p>
                  </div>
                ) : (
                  yearConsultations.sort((a, b) => new Date(b.date) - new Date(a.date)).map(consultation => (
                    <div key={consultation.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-gray-600">{consultation.activity_description}</p>
                          <p className="text-xs text-gray-500 mt-1">{consultation.date}</p>
                        </div>
                        <span className="text-sm font-semibold text-purple-600 ml-4">
                          {consultation.minutes_spent}m
                        </span>
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
