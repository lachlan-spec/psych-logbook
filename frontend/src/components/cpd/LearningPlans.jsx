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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { cpdAPI } from '../../services/api';
import { toast } from 'sonner';
import { Plus, Target, CheckCircle, MessageSquare, Link as LinkIcon, ArrowLeft, Settings, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LearningPlans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [years, setYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [plan, setPlan] = useState(null);
  const [activities, setActivities] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createPlanDialogOpen, setCreatePlanDialogOpen] = useState(false);
  const [addGoalDialogOpen, setAddGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [supervisorComment, setSupervisorComment] = useState('');
  
  const [newPlanDates, setNewPlanDates] = useState({
    start_date: '',
    end_date: ''
  });
  
  const [newGoal, setNewGoal] = useState({
    goal: '',
    what_to_learn: '',
    expected_outcomes: '',
    target_date: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      loadPlanForYear();
    }
  }, [selectedYearId]);

  const loadData = async () => {
    try {
      const [yearsResp, activitiesResp, consultationsResp] = await Promise.all([
        cpdAPI.getYears(),
        cpdAPI.getActivities(),
        cpdAPI.getConsultations()
      ]);
      
      setYears(yearsResp.data);
      setActivities(activitiesResp.data);
      setConsultations(consultationsResp.data);
      
      if (yearsResp.data.length > 0) {
        setSelectedYearId(yearsResp.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPlanForYear = async () => {
    try {
      const response = await cpdAPI.getPlans(null, selectedYearId);
      if (response.data.length > 0) {
        setPlan(response.data[0]);
      } else {
        setPlan(null);
      }
    } catch (error) {
      console.error('Failed to load plan');
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlanDates.start_date || !newPlanDates.end_date) {
      toast.error('Please enter start and end dates');
      return;
    }
    
    try {
      await cpdAPI.createPlan({
        year_id: selectedYearId,
        start_date: newPlanDates.start_date,
        end_date: newPlanDates.end_date
      });
      
      toast.success('Learning plan created');
      setCreatePlanDialogOpen(false);
      loadPlanForYear();
      setNewPlanDates({ start_date: '', end_date: '' });
    } catch (error) {
      toast.error('Failed to create plan');
    }
  };

  const handleOpenAddGoalDialog = () => {
    setEditingGoal(null);
    setNewGoal({ goal: '', what_to_learn: '', expected_outcomes: '', target_date: '' });
    setAddGoalDialogOpen(true);
  };

  const handleOpenEditGoalDialog = (goal) => {
    setEditingGoal(goal);
    setNewGoal({
      goal: goal.goal,
      what_to_learn: goal.what_to_learn,
      expected_outcomes: goal.expected_outcomes,
      target_date: goal.target_date || ''
    });
    setAddGoalDialogOpen(true);
  };

  const handleSaveGoal = async () => {
    if (!newGoal.goal || !newGoal.what_to_learn || !newGoal.expected_outcomes) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      if (editingGoal) {
        await cpdAPI.updateGoal(plan.id, editingGoal.id, newGoal);
        toast.success('Goal updated');
      } else {
        await cpdAPI.addGoalToPlan(plan.id, newGoal);
        toast.success('Goal added');
      }
      setAddGoalDialogOpen(false);
      setEditingGoal(null);
      loadPlanForYear();
    } catch (error) {
      toast.error(editingGoal ? 'Failed to update goal' : 'Failed to add goal');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!confirm("Delete this learning goal?")) return;
    try {
      // Update plan to remove the goal
      const updatedGoals = plan.goals.filter(g => g.id !== goalId);
      await cpdAPI.updatePlan(plan.id, { goals: updatedGoals });
      toast.success("Goal deleted");
      loadPlanForYear();
    } catch (error) {
      toast.error("Failed to delete goal");
    }
  };

  const handleMarkGoalComplete = async (goalId) => {
    try {
      await cpdAPI.updateGoal(plan.id, goalId, { status: 'completed' });
      toast.success('Goal marked as completed');
      loadPlanForYear();
    } catch (error) {
      toast.error('Failed to update goal');
    }
  };

  const handleFinishPlan = async () => {
    try {
      await cpdAPI.updatePlan(plan.id, { is_finished: true });
      toast.success('Learning plan marked as finished');
      loadPlanForYear();
    } catch (error) {
      toast.error('Failed to finish plan');
    }
  };

  const handleAddSupervisorComment = async () => {
    if (!supervisorComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    
    try {
      await cpdAPI.addSupervisorComment(plan.id, { content: supervisorComment });
      toast.success('Comment added');
      setCommentDialogOpen(false);
      setSupervisorComment('');
      loadPlanForYear();
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const getLinkedItems = (goalId) => {
    const linkedActivities = activities.filter(a => a.linked_goal_id === goalId);
    const linkedConsultations = consultations.filter(c => c.linked_goal_id === goalId);
    return { activities: linkedActivities, consultations: linkedConsultations };
  };

  const selectedYear = years.find(y => y.id === selectedYearId);

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
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-1">Learning Plans</h1>
            <p className="text-xs sm:text-sm text-slate-500">Set and track your professional development goals</p>
          </div>
          {plan && !plan.is_finished && (
            <div className="flex gap-2">
              <Dialog open={addGoalDialogOpen} onOpenChange={setAddGoalDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={handleOpenAddGoalDialog} className="h-8 px-3 text-xs bg-slate-900 hover:bg-slate-800 text-white">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Goal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingGoal ? "Edit Learning Goal" : "Add Learning Goal"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Goal Title *</Label>
                      <Input
                        placeholder="e.g., Enhance trauma therapy skills"
                        value={newGoal.goal}
                        onChange={(e) => setNewGoal({...newGoal, goal: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>What I Want to Learn *</Label>
                      <Textarea
                        rows={3}
                        placeholder="Describe what you want to learn or develop"
                        value={newGoal.what_to_learn}
                        onChange={(e) => setNewGoal({...newGoal, what_to_learn: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Expected Outcomes *</Label>
                      <Textarea
                        rows={3}
                        placeholder="What do you expect to achieve?"
                        value={newGoal.expected_outcomes}
                        onChange={(e) => setNewGoal({...newGoal, expected_outcomes: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Target Date (Optional)</Label>
                      <Input
                        type="date"
                        value={newGoal.target_date}
                        onChange={(e) => setNewGoal({...newGoal, target_date: e.target.value})}
                      />
                    </div>
                    <Button onClick={handleSaveGoal} className="w-full btn-primary">
                      {editingGoal ? "Update Goal" : "Add Goal"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button onClick={handleFinishPlan} variant="ghost" size="sm" className="h-8 px-3 text-xs text-slate-600 hover:bg-slate-100">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                Finish Plan
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {years.length > 0 && (
              <div className="mb-4">
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Year</Label>
                <Select value={selectedYearId || ''} onValueChange={setSelectedYearId}>
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

            {!plan ? (
              <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-sm">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium mb-1 text-slate-800">No Learning Plan Yet</p>
                  <p className="text-xs text-slate-500 mb-6">Create a learning plan for this CPD year</p>
                  
                  <Dialog open={createPlanDialogOpen} onOpenChange={setCreatePlanDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-8 px-3 text-xs bg-slate-900 hover:bg-slate-800 text-white">Create Learning Plan</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Learning Plan</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Start Date (Usually Dec 1)</Label>
                          <Input
                            type="date"
                            value={newPlanDates.start_date}
                            onChange={(e) => setNewPlanDates({...newPlanDates, start_date: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>End Date (Usually Nov 30)</Label>
                          <Input
                            type="date"
                            value={newPlanDates.end_date}
                            onChange={(e) => setNewPlanDates({...newPlanDates, end_date: e.target.value})}
                          />
                        </div>
                        <Button onClick={handleCreatePlan} className="w-full btn-primary">
                          Create Plan
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ) : (
              <>
                {user.role === 'supervisor' && (
                  <Card className="glass-card mb-6">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          Supervisor Comments
                        </CardTitle>
                        <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm">Add Comment</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Comment</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                rows={4}
                                placeholder="Enter your feedback on this learning plan..."
                                value={supervisorComment}
                                onChange={(e) => setSupervisorComment(e.target.value)}
                              />
                              <Button onClick={handleAddSupervisorComment} className="w-full btn-primary">
                                Add Comment
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    {plan.supervisor_comments && plan.supervisor_comments.length > 0 && (
                      <CardContent>
                        <div className="space-y-3">
                          {plan.supervisor_comments.map(comment => (
                            <div key={comment.id} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{comment.author_name}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-600">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )}

                <Card className="glass-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold">Learning Goals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!plan.goals || plan.goals.length === 0 ? (
                      <div className="empty-state py-8">
                        <p className="text-gray-500 mb-2">No goals added yet</p>
                        <p className="text-xs text-gray-400 mb-4">Start by adding your first learning goal</p>
                        {!plan.is_finished && (
                          <Button onClick={() => setAddGoalDialogOpen(true)} className="btn-primary">
                            Add First Goal
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Accordion type="single" collapsible>
                        {plan.goals.map((goal, index) => {
                          const linkedItems = getLinkedItems(goal.id);
                          const isCompleted = goal.status === 'completed';
                          
                          return (
                            <AccordionItem key={goal.id} value={goal.id} className="border-b border-gray-200">
                              <AccordionTrigger className="hover:bg-gray-50 px-3 rounded-lg transition-all">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-gray-400">#{index + 1}</span>
                                    <span className={`font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                      {goal.goal}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {linkedItems.activities.length + linkedItems.consultations.length > 0 && (
                                      <span className="badge badge-blue">
                                        <LinkIcon className="w-3 h-3 mr-1" />
                                        {linkedItems.activities.length + linkedItems.consultations.length}
                                      </span>
                                    )}
                                    {isCompleted ? (
                                      <span className="badge badge-green">✓ Completed</span>
                                    ) : (
                                      <span className="badge badge-amber">Active</span>
                                    )}
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4 pt-3">
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                      <p className="text-sm font-semibold text-blue-900 mb-2">What to Learn</p>
                                      <p className="text-gray-600">{goal.what_to_learn}</p>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-lg">
                                      <p className="text-sm font-semibold text-green-900 mb-2">Expected Outcomes</p>
                                      <p className="text-gray-600">{goal.expected_outcomes}</p>
                                    </div>
                                  </div>
                                  
                                  {goal.target_date && (
                                    <p className="text-sm text-gray-600">Target Date: {goal.target_date}</p>
                                  )}

                                  {(linkedItems.activities.length > 0 || linkedItems.consultations.length > 0) && (
                                    <div className="border-t pt-4">
                                      <p className="text-sm font-semibold mb-3">Linked Activities</p>
                                      
                                      {linkedItems.activities.length > 0 && (
                                        <div className="mb-3">
                                          <p className="text-xs text-gray-600 mb-2">CPD Activities:</p>
                                          <div className="space-y-2">
                                            {linkedItems.activities.map(activity => (
                                              <div key={activity.id} className="p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                  <div>
                                                    <p className="font-medium text-sm">{activity.activity_type}</p>
                                                    <p className="text-xs text-gray-600">{activity.description}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                                                  </div>
                                                  <span className="text-sm font-semibold text-green-600">{activity.hours}h</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {linkedItems.consultations.length > 0 && (
                                        <div>
                                          <p className="text-xs text-gray-600 mb-2">Peer Consultations:</p>
                                          <div className="space-y-2">
                                            {linkedItems.consultations.map(consultation => (
                                              <div key={consultation.id} className="p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                  <div>
                                                    <p className="text-xs text-gray-600">{consultation.activity_description}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{consultation.date}</p>
                                                  </div>
                                                  <span className="text-sm font-semibold text-purple-600">{consultation.minutes_spent}m</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {user.role === 'psychologist' && (
                                    <div className="flex gap-2 mt-4">
                                      {!isCompleted && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleMarkGoalComplete(goal.id)}
                                          variant="outline"
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Mark as Completed
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleOpenEditGoalDialog(goal)}
                                        className="hover:bg-blue-50 hover:text-blue-600"
                                      >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDeleteGoal(goal.id)}
                                        className="hover:bg-red-50 hover:text-red-600"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
