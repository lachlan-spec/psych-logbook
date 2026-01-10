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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '../ui/breadcrumb';
import { cpdAPI } from '../../services/api';
import { toast } from 'sonner';
import { Plus, Target, CheckCircle, MessageSquare, Link as LinkIcon, Settings, Edit, Trash2, Home } from 'lucide-react';

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
    if (!selectedYearId) {
      toast.error('Please select a year first');
      return;
    }
    
    // Get the dates from the selected CPD year
    const selectedYear = years.find(y => y.id === selectedYearId);
    if (!selectedYear) {
      toast.error('Year not found');
      return;
    }
    
    try {
      await cpdAPI.createPlan({
        year_id: selectedYearId,
        start_date: selectedYear.start_date || `${selectedYear.year}-12-01`,
        end_date: selectedYear.end_date || `${parseInt(selectedYear.year) + 1}-11-30`
      });
      
      toast.success('Learning plan created');
      setCreatePlanDialogOpen(false);
      loadPlanForYear();
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
              <BreadcrumbPage>Learning Plans</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex items-center justify-between mb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-dark mb-1">Learning Plans</h1>
            <p className="text-xs sm:text-sm text-neutral-light">Set and track your professional development goals</p>
          </div>
          {plan && !plan.is_finished && (
            <div className="flex gap-2 flex-shrink-0 ml-4">
              <Button onClick={handleFinishPlan} variant="outline" size="sm" className="h-8 px-3 text-xs border-green-600 text-green-700 hover:bg-green-50 whitespace-nowrap">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden sm:inline">Finish Plan</span>
                <span className="sm:hidden">Finish</span>
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
                <Label className="text-xs font-medium text-neutral mb-1.5 block">Year</Label>
                <Select value={selectedYearId || ''} onValueChange={setSelectedYearId}>
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

            {!plan ? (
              <Card className="card shadow-sm">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gradient-blue rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium mb-1 text-neutral-dark">No Learning Plan Yet</p>
                  <p className="text-xs text-neutral-light mb-6">Create a learning plan for this CPD year</p>
                  
                  <Dialog open={createPlanDialogOpen} onOpenChange={setCreatePlanDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-8 px-3 text-xs bg-gradient-blue text-primary hover:from-blue-200 hover:to-indigo-200 border border-primary">Create Learning Plan</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Learning Plan</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-neutral">
                          Create a learning plan for <strong>{selectedYear?.year || ''} CPD Year</strong>.
                          {selectedYear?.start_date && selectedYear?.end_date && (
                            <span className="block text-xs text-neutral-light mt-1">
                              Period: {selectedYear.start_date} to {selectedYear.end_date}
                            </span>
                          )}
                        </p>
                        <Button onClick={handleCreatePlan} className="w-full h-9 text-sm bg-gradient-blue text-primary hover:from-blue-200 hover:to-indigo-200 border border-primary">
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
                  <Card className="card mb-6">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="icon-md" />
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
                            <div key={comment.id} className="p-4 bg-warning rounded-lg border border-warning">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{comment.author_name}</span>
                                <span className="text-xs text-neutral-light">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-neutral">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )}

                <Card className="card shadow-sm">
                  <CardHeader className="p-4 border-b border-neutral">
                    <CardTitle className="text-sm font-semibold text-neutral-dark">Learning Goals</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {!plan.goals || plan.goals.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-sm text-neutral-light mb-4">No goals yet</p>
                        {!plan.is_finished && (
                          <Button onClick={() => setAddGoalDialogOpen(true)} size="sm" className="h-10 px-4 text-sm btn-primary">
                            <Plus className="w-4 h-4 mr-2" />
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
                            <AccordionItem key={goal.id} value={goal.id} className="border-b border-neutral last:border-0">
                              <AccordionTrigger className="hover:bg-neutral/50 px-4 py-3 transition-all">
                                <div className="flex items-center justify-between w-full pr-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-neutral-light">#{index + 1}</span>
                                    <span className={`text-sm font-medium ${isCompleted ? 'line-through text-neutral-light' : 'text-neutral'}`}>
                                      {goal.goal}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {linkedItems.activities.length + linkedItems.consultations.length > 0 && (
                                      <span className="text-xs font-medium text-primary bg-primary-light px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <LinkIcon className="icon-sm" />
                                        {linkedItems.activities.length + linkedItems.consultations.length}
                                      </span>
                                    )}
                                    {isCompleted ? (
                                      <span className="text-xs font-medium text-success bg-success px-2 py-0.5 rounded-full">✓ Completed</span>
                                    ) : (
                                      <span className="text-xs font-medium text-warning bg-warning px-2 py-0.5 rounded-full">Active</span>
                                    )}
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-3 px-4 pb-3">
                                  <div className="grid md:grid-cols-2 gap-3">
                                    <div className="p-3 bg-primary-light/50 rounded border border-blue-100">
                                      <p className="text-xs font-medium text-primary mb-1">What to Learn</p>
                                      <p className="text-xs text-neutral">{goal.what_to_learn}</p>
                                    </div>
                                    <div className="p-3 bg-success/50 rounded border border-green-100">
                                      <p className="text-xs font-medium text-success mb-1">Expected Outcomes</p>
                                      <p className="text-xs text-neutral">{goal.expected_outcomes}</p>
                                    </div>
                                  </div>
                                  
                                  {goal.target_date && (
                                    <p className="text-xs text-neutral-light">Target Date: {goal.target_date}</p>
                                  )}

                                  {(linkedItems.activities.length > 0 || linkedItems.consultations.length > 0) && (
                                    <div className="border-t pt-4">
                                      <p className="text-sm font-semibold mb-3">Linked Activities</p>
                                      
                                      {linkedItems.activities.length > 0 && (
                                        <div className="mb-3">
                                          <p className="text-xs text-neutral mb-2">CPD Activities:</p>
                                          <div className="space-y-2">
                                            {linkedItems.activities.map(activity => (
                                              <div key={activity.id} className="p-3 bg-neutral rounded-lg">
                                                <div className="flex items-center justify-between">
                                                  <div>
                                                    <p className="font-medium text-sm">{activity.activity_type}</p>
                                                    <p className="text-xs text-neutral">{activity.description}</p>
                                                    <p className="text-xs text-neutral-light mt-1">{activity.date}</p>
                                                  </div>
                                                  <span className="text-sm font-semibold text-success">{activity.hours}h</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {linkedItems.consultations.length > 0 && (
                                        <div>
                                          <p className="text-xs text-neutral mb-2">Peer Consultations:</p>
                                          <div className="space-y-2">
                                            {linkedItems.consultations.map(consultation => (
                                              <div key={consultation.id} className="p-3 bg-neutral rounded-lg">
                                                <div className="flex items-center justify-between">
                                                  <div>
                                                    <p className="text-xs text-neutral">{consultation.activity_description}</p>
                                                    <p className="text-xs text-neutral-light mt-1">{consultation.date}</p>
                                                  </div>
                                                  <span className="text-sm font-semibold text-secondary">{consultation.minutes_spent}m</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {user.role === 'psychologist' && (
                                    <div className="flex gap-2 mt-3">
                                      {!isCompleted && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleMarkGoalComplete(goal.id)}
                                          variant="ghost"
                                          className="h-7 px-2.5 text-xs text-neutral hover:bg-neutral"
                                        >
                                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                          Complete
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleOpenEditGoalDialog(goal)}
                                        className="h-7 px-2.5 text-xs text-neutral hover:bg-neutral"
                                      >
                                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteGoal(goal.id)}
                                        className="h-7 px-2.5 text-xs text-neutral hover:bg-error hover:text-error"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
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

                {/* Add Goal Dialog - placed here for clean mobile layout */}
                <Dialog open={addGoalDialogOpen} onOpenChange={setAddGoalDialogOpen}>
                  <DialogContent className="max-w-lg mx-4">
                    <DialogHeader>
                      <DialogTitle className="text-lg">{editingGoal ? "Edit Learning Goal" : "Add Learning Goal"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Goal Title *</Label>
                        <Input
                          className="mt-1"
                          placeholder="e.g., Enhance trauma therapy skills"
                          value={newGoal.goal}
                          onChange={(e) => setNewGoal({...newGoal, goal: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">What I Want to Learn *</Label>
                        <Textarea
                          className="mt-1"
                          rows={3}
                          placeholder="Describe what you want to learn or develop"
                          value={newGoal.what_to_learn}
                          onChange={(e) => setNewGoal({...newGoal, what_to_learn: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Expected Outcomes *</Label>
                        <Textarea
                          className="mt-1"
                          rows={3}
                          placeholder="What do you expect to achieve?"
                          value={newGoal.expected_outcomes}
                          onChange={(e) => setNewGoal({...newGoal, expected_outcomes: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Target Date (Optional)</Label>
                        <Input
                          className="mt-1"
                          type="date"
                          value={newGoal.target_date}
                          onChange={(e) => setNewGoal({...newGoal, target_date: e.target.value})}
                        />
                      </div>
                      <Button onClick={handleSaveGoal} className="w-full h-10 text-sm btn-primary">
                        {editingGoal ? "Update Goal" : "Add Goal"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
