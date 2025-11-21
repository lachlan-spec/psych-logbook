import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../dashboard/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import api from '../../services/api';
import { BookOpen, MessageSquare, ArrowLeft, Save, Target, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { groupByWeek, groupByMonth, formatWeekRange, getMonthName } from '../../lib/dateUtils';

export default function SupervisorCPDView() {
  const { psychologistId } = useParams();
  const navigate = useNavigate();
  const [allActivities, setAllActivities] = useState([]);
  const [plans, setPlans] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentingItem, setCommentingItem] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [viewMode, setViewMode] = useState('weekly');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      // Get activities from supervisor endpoint (includes all connected psychologists)
      const activitiesResp = await api.get('/supervisor/cpd-activities');
      const activitiesData = activitiesResp.data || activitiesResp;
      
      // Filter activities by psychologist
      const filteredActivities = psychologistId 
        ? activitiesData.filter(a => a.user_id === psychologistId)
        : activitiesData;
      
      setAllActivities(filteredActivities);
      
      // If we have a specific psychologist, fetch their plans and consultations
      if (psychologistId) {
        const [plansResp, consultationsResp] = await Promise.all([
          api.get('/cpd/plans', { params: { user_id: psychologistId } }),
          api.get('/cpd/consultations', { params: { user_id: psychologistId } })
        ]);
        
        setPlans(plansResp.data || plansResp);
        setConsultations(consultationsResp.data || consultationsResp);
      } else {
        // For overview, get all consultations from all connected psychologists
        const consultationsResp = await api.get('/cpd/consultations');
        const consultationsData = consultationsResp.data || consultationsResp;
        setConsultations(consultationsData);
      }
    } catch (error) {
      console.error('Failed to load CPD data:', error);
      toast.error('Failed to load CPD data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (itemId, itemType) => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await api.patch(`/supervisor/${itemType}/${itemId}/comment`, {
        comment: commentText
      });
      
      toast.success('Comment added successfully');
      setCommentingItem(null);
      setCommentText('');
      loadAllData();
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const totalCPDHours = allActivities.reduce((sum, a) => sum + a.hours, 0);
  const totalConsultationHours = consultations.reduce((sum, c) => sum + (c.minutes_spent / 60), 0);
  const psychologistName = allActivities.length > 0 ? allActivities[0].psychologist_name : 'Psychologist';

  // Group data
  const weeklyActivities = groupByWeek(allActivities);
  const monthlyActivities = groupByMonth(allActivities);
  const weeklyConsultations = groupByWeek(consultations);
  const monthlyConsultations = groupByMonth(consultations);

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

        <h1 className="text-4xl font-bold gradient-text mb-2">{psychologistName}'s CPD</h1>
        <p className="text-gray-600 mb-8">Review and provide feedback on professional development</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="stat-card">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 mb-1">CPD Hours</p>
                  <p className="text-2xl font-bold leading-none text-gray-900">{totalCPDHours.toFixed(1)}h</p>
                </div>
                <div className="w-12 h-12 icon-blue rounded-xl flex items-center justify-center shadow-sm">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 mb-1">Consultation Hours</p>
                  <p className="text-2xl font-bold leading-none text-gray-900">{totalConsultationHours.toFixed(1)}h</p>
                </div>
                <div className="w-12 h-12 icon-green rounded-xl flex items-center justify-center shadow-sm">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activities" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="activities">CPD Activities</TabsTrigger>
            <TabsTrigger value="goals">Learning Goals</TabsTrigger>
            <TabsTrigger value="consultations">Peer Consultations</TabsTrigger>
          </TabsList>

          {/* CPD Activities Tab */}
          <TabsContent value="activities">
            <Card className="glass-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">CPD Activities</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={viewMode === 'weekly' ? 'default' : 'outline'}
                      onClick={() => setViewMode('weekly')}
                      className={viewMode === 'weekly' ? 'btn-primary' : ''}
                    >
                      Weekly
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'monthly' ? 'default' : 'outline'}
                      onClick={() => setViewMode('monthly')}
                      className={viewMode === 'monthly' ? 'btn-primary' : ''}
                    >
                      Monthly
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'yearly' ? 'default' : 'outline'}
                      onClick={() => setViewMode('yearly')}
                      className={viewMode === 'yearly' ? 'btn-primary' : ''}
                    >
                      All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {allActivities.length === 0 ? (
                  <div className="empty-state py-8">
                    <p className="text-gray-500">No activities yet</p>
                  </div>
                ) : (
                  <>
                    {viewMode === 'weekly' && (
                      <Accordion type="single" collapsible>
                        {Object.keys(weeklyActivities).sort().reverse().map(weekStart => {
                          const weekActivities = weeklyActivities[weekStart];
                          const weekTotal = weekActivities.reduce((sum, a) => sum + a.hours, 0);
                          return (
                            <AccordionItem key={weekStart} value={weekStart} className="border-b border-gray-200">
                              <AccordionTrigger className="hover:bg-gray-50 px-3 rounded-lg transition-all">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <span className="font-medium text-gray-900">{formatWeekRange(weekStart)}</span>
                                  <span className="font-bold text-base text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{weekTotal.toFixed(1)}h</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-3 pt-3">
                                  {weekActivities.map(activity => (
                                    <ActivityCard 
                                      key={activity.id} 
                                      activity={activity} 
                                      commentingItem={commentingItem}
                                      setCommentingItem={setCommentingItem}
                                      commentText={commentText}
                                      setCommentText={setCommentText}
                                      handleAddComment={handleAddComment}
                                    />
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}

                    {viewMode === 'monthly' && (
                      <Accordion type="single" collapsible>
                        {Object.keys(monthlyActivities).sort().reverse().map(monthKey => {
                          const monthActivities = monthlyActivities[monthKey];
                          const monthTotal = monthActivities.reduce((sum, a) => sum + a.hours, 0);
                          return (
                            <AccordionItem key={monthKey} value={monthKey} className="border-b border-gray-200">
                              <AccordionTrigger className="hover:bg-gray-50 px-3 rounded-lg transition-all">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <span className="font-medium text-gray-900">{getMonthName(monthKey)}</span>
                                  <span className="font-bold text-base text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{monthTotal.toFixed(1)}h</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-3 pt-3">
                                  {monthActivities.map(activity => (
                                    <ActivityCard 
                                      key={activity.id} 
                                      activity={activity} 
                                      commentingItem={commentingItem}
                                      setCommentingItem={setCommentingItem}
                                      commentText={commentText}
                                      setCommentText={setCommentText}
                                      handleAddComment={handleAddComment}
                                    />
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}

                    {viewMode === 'yearly' && (
                      <div className="space-y-3">
                        {allActivities.sort((a, b) => new Date(b.date) - new Date(a.date)).map(activity => (
                          <ActivityCard 
                            key={activity.id} 
                            activity={activity} 
                            commentingItem={commentingItem}
                            setCommentingItem={setCommentingItem}
                            commentText={commentText}
                            setCommentText={setCommentText}
                            handleAddComment={handleAddComment}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Learning Goals Tab */}
          <TabsContent value="goals">
            <Card className="glass-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Learning Goals</CardTitle>
              </CardHeader>
              <CardContent>
                {plans.length === 0 ? (
                  <div className="empty-state py-8">
                    <p className="text-gray-500">No learning plans yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {plans.map(plan => (
                      <div key={plan.id} className="list-item-card p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{plan.year}</h3>
                            <p className="text-sm text-gray-600">{plan.start_date} - {plan.end_date}</p>
                          </div>
                          {plan.is_finished && (
                            <span className="badge badge-green">Completed</span>
                          )}
                        </div>
                        {plan.goals && plan.goals.length > 0 && (
                          <div className="space-y-2 mt-3">
                            {plan.goals.map(goal => (
                              <div key={goal.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm text-gray-900">{goal.goal}</p>
                                    <p className="text-xs text-gray-600 mt-1">{goal.what_to_learn}</p>
                                    <p className="text-xs text-gray-500 mt-1">Target: {goal.target_date}</p>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full ${goal.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {goal.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Peer Consultations Tab */}
          <TabsContent value="consultations">
            <Card className="glass-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Peer Consultations</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={viewMode === 'weekly' ? 'default' : 'outline'}
                      onClick={() => setViewMode('weekly')}
                      className={viewMode === 'weekly' ? 'btn-primary' : ''}
                    >
                      Weekly
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'monthly' ? 'default' : 'outline'}
                      onClick={() => setViewMode('monthly')}
                      className={viewMode === 'monthly' ? 'btn-primary' : ''}
                    >
                      Monthly
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'yearly' ? 'default' : 'outline'}
                      onClick={() => setViewMode('yearly')}
                      className={viewMode === 'yearly' ? 'btn-primary' : ''}
                    >
                      All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {consultations.length === 0 ? (
                  <div className="empty-state py-8">
                    <p className="text-gray-500">No consultations yet</p>
                  </div>
                ) : (
                  <>
                    {viewMode === 'weekly' && (
                      <Accordion type="single" collapsible>
                        {Object.keys(weeklyConsultations).sort().reverse().map(weekStart => {
                          const weekConsults = weeklyConsultations[weekStart];
                          const weekTotal = weekConsults.reduce((sum, c) => sum + (c.minutes_spent / 60), 0);
                          return (
                            <AccordionItem key={weekStart} value={weekStart} className="border-b border-gray-200">
                              <AccordionTrigger className="hover:bg-gray-50 px-3 rounded-lg transition-all">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <span className="font-medium text-gray-900">{formatWeekRange(weekStart)}</span>
                                  <span className="font-bold text-base text-green-600 bg-green-50 px-3 py-1 rounded-full">{weekTotal.toFixed(1)}h</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-3 pt-3">
                                  {weekConsults.map(consultation => (
                                    <ConsultationCard key={consultation.id} consultation={consultation} />
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}

                    {viewMode === 'monthly' && (
                      <Accordion type="single" collapsible>
                        {Object.keys(monthlyConsultations).sort().reverse().map(monthKey => {
                          const monthConsults = monthlyConsultations[monthKey];
                          const monthTotal = monthConsults.reduce((sum, c) => sum + (c.minutes_spent / 60), 0);
                          return (
                            <AccordionItem key={monthKey} value={monthKey} className="border-b border-gray-200">
                              <AccordionTrigger className="hover:bg-gray-50 px-3 rounded-lg transition-all">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <span className="font-medium text-gray-900">{getMonthName(monthKey)}</span>
                                  <span className="font-bold text-base text-green-600 bg-green-50 px-3 py-1 rounded-full">{monthTotal.toFixed(1)}h</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-3 pt-3">
                                  {monthConsults.map(consultation => (
                                    <ConsultationCard key={consultation.id} consultation={consultation} />
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}

                    {viewMode === 'yearly' && (
                      <div className="space-y-3">
                        {consultations.sort((a, b) => new Date(b.date) - new Date(a.date)).map(consultation => (
                          <ConsultationCard key={consultation.id} consultation={consultation} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Activity Card Component
function ActivityCard({ activity, commentingItem, setCommentingItem, commentText, setCommentText, handleAddComment }) {
  return (
    <div className="list-item-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900 mb-1">{activity.activity_type}</p>
          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
          {activity.reflection && (
            <p className="text-sm text-gray-500 italic mt-2">Reflection: {activity.reflection}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">{activity.date}</p>
        </div>
        <span className="text-base font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{activity.hours.toFixed(1)}h</span>
      </div>

      {activity.supervisor_comment && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-blue-900 mb-1">Supervisor Feedback</p>
              <p className="text-sm text-gray-700">{activity.supervisor_comment}</p>
              {activity.supervisor_comment_date && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.supervisor_comment_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {commentingItem === activity.id ? (
        <div className="mt-3 space-y-2">
          <Textarea
            placeholder="Add your feedback for this activity..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleAddComment(activity.id, 'cpd-activities')}
              className="btn-primary"
            >
              <Save className="w-3 h-3 mr-1" />
              Save Feedback
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCommentingItem(null);
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
            setCommentingItem(activity.id);
            setCommentText(activity.supervisor_comment || '');
          }}
          className="mt-3"
        >
          <MessageSquare className="w-3 h-3 mr-1" />
          {activity.supervisor_comment ? 'Edit Feedback' : 'Add Feedback'}
        </Button>
      )}
    </div>
  );
}

// Consultation Card Component
function ConsultationCard({ consultation }) {
  return (
    <div className="list-item-card p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600">{consultation.activity_description}</p>
          <p className="text-xs text-gray-400 mt-2">{consultation.date}</p>
        </div>
        <span className="text-base font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
          {(consultation.minutes_spent / 60).toFixed(1)}h
        </span>
      </div>
    </div>
  );
}
