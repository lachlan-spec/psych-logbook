import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PortalNav from '../dashboard/PortalNav';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import api from '../../services/api';
import { toast } from 'sonner';
import { groupByWeek, groupByMonth, formatWeekRange, getMonthName } from '../../lib/dateUtils';
import { ArrowLeft, Clock, BookOpen, Award, MessageSquare, Mail, Users, Save } from 'lucide-react';

const COMPETENCIES = [
  { id: '0', name: 'Ethical Practice', color: 'blue' },
  { id: '1', name: 'Assessment & Formulation', color: 'green' },
  { id: '2', name: 'Intervention', color: 'purple' },
  { id: '3', name: 'Communication', color: 'amber' },
  { id: '4', name: 'Professional Development', color: 'red' },
  { id: '5', name: 'Research & Evaluation', color: 'indigo' }
];

export default function SupervisorPsychologistView() {
  const { psychologistId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Logbook state
  const [logbookEntries, setLogbookEntries] = useState([]);
  const [logbookYears, setLogbookYears] = useState([]);
  const [selectedLogbookYear, setSelectedLogbookYear] = useState(null);
  
  // CPD state
  const [cpdActivities, setCpdActivities] = useState([]);
  const [cpdPlans, setCpdPlans] = useState([]);
  const [cpdConsultations, setCpdConsultations] = useState([]);
  const [cpdYears, setCpdYears] = useState([]);
  const [selectedCpdYear, setSelectedCpdYear] = useState(null);
  const [cpdViewMode, setCpdViewMode] = useState('weekly');
  
  // Competencies state
  const [competencyJournals, setCompetencyJournals] = useState([]);
  
  // Common state
  const [loading, setLoading] = useState(true);
  const [commentingItem, setCommentingItem] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [psychologistName, setPsychologistName] = useState('Psychologist');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadLogbookData(),
        loadCPDData(),
        loadCompetencyData()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load psychologist data');
    } finally {
      setLoading(false);
    }
  };

  // Logbook data loading
  const loadLogbookData = async () => {
    try {
      const yearsResp = await api.getLogbookYears(psychologistId);
      const yearsData = yearsResp.data || yearsResp;
      setLogbookYears(yearsData);
      
      if (yearsData.length > 0 && !selectedLogbookYear) {
        setSelectedLogbookYear(yearsData[0].id);
      }
      
      const response = await api.get('/supervisor/logbook-entries');
      const data = response.data || response;
      
      const filteredEntries = data.filter(e => 
        e.user_id === psychologistId && 
        (!selectedLogbookYear || e.logbook_id === selectedLogbookYear)
      );
      
      setLogbookEntries(filteredEntries);
      
      if (filteredEntries.length > 0 && filteredEntries[0].psychologist_name) {
        setPsychologistName(filteredEntries[0].psychologist_name);
      }
    } catch (error) {
      console.error('Failed to load logbook:', error);
    }
  };

  // CPD data loading
  const loadCPDData = async () => {
    try {
      const yearsResp = await api.getCPDYears(psychologistId);
      const yearsData = yearsResp.data || yearsResp;
      setCpdYears(yearsData);
      
      if (yearsData.length > 0 && !selectedCpdYear) {
        setSelectedCpdYear(yearsData[0].id);
      }
      
      const activitiesResp = await api.get('/supervisor/cpd-activities');
      const activitiesData = activitiesResp.data || activitiesResp;
      
      const filteredActivities = activitiesData.filter(a => 
        a.user_id === psychologistId && 
        (!selectedCpdYear || a.year_id === selectedCpdYear)
      );
      
      setCpdActivities(filteredActivities);
      
      const [plansResp, consultationsResp] = await Promise.all([
        api.get('/cpd/plans', { params: { user_id: psychologistId, year_id: selectedCpdYear } }),
        api.get('/cpd/consultations', { params: { user_id: psychologistId } })
      ]);
      
      setCpdPlans(plansResp.data || plansResp);
      
      let consultationsData = consultationsResp.data || consultationsResp;
      if (selectedCpdYear) {
        consultationsData = consultationsData.filter(c => c.year_id === selectedCpdYear);
      }
      setCpdConsultations(consultationsData);
    } catch (error) {
      console.error('Failed to load CPD data:', error);
    }
  };

  // Competency data loading
  const loadCompetencyData = async () => {
    try {
      const response = await api.get('/competencies/journals', {
        params: { user_id: psychologistId }
      });
      const data = response.data || response;
      console.log('🔍 Competency API Response:', {
        fullResponse: response,
        data: data,
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: data?.length,
        psychologistId: psychologistId
      });
      
      // Ensure we have an array
      const journals = Array.isArray(data) ? data : (data?.data ? data.data : []);
      console.log('📝 Setting competency journals:', journals.length, 'entries');
      setCompetencyJournals(journals);
    } catch (error) {
      console.error('Failed to load competency journals:', error);
    }
  };

  // Reload logbook when year changes
  useEffect(() => {
    if (selectedLogbookYear) {
      loadLogbookData();
    }
  }, [selectedLogbookYear]);

  // Reload CPD when year changes
  useEffect(() => {
    if (selectedCpdYear) {
      loadCPDData();
    }
  }, [selectedCpdYear]);

  // Comment handlers
  const handleAddLogbookComment = async (entryId) => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await api.patch(`/supervisor/logbook-entries/${entryId}/comment`, {
        comment: commentText
      });
      
      toast.success('Comment added successfully');
      setCommentingItem(null);
      setCommentText('');
      loadLogbookData();
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleAddCPDComment = async (itemId, itemType) => {
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
      loadCPDData();
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleAddCompetencyComment = async (journalId) => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await api.patch(`/supervisor/competencies/${journalId}/comment`, {
        comment: commentText
      });
      
      toast.success('Comment added successfully');
      setCommentingItem(null);
      setCommentText('');
      loadCompetencyData();
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };


  const handleAddConsultationComment = async (consultationId) => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await api.patch(`/supervisor/consultations/${consultationId}/comment`, {
        comment: commentText
      });
      
      toast.success('Comment added successfully');
      setCommentingItem(null);
      setCommentText('');
      loadCPDData();
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleAddGoalComment = async (goalId) => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await api.patch(`/supervisor/goals/${goalId}/comment`, {
        comment: commentText
      });
      
      toast.success('Comment added successfully');
      setCommentingItem(null);
      setCommentText('');
      loadCPDData();
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };


  // Calculations
  const totalLogbookHours = logbookEntries.reduce((sum, e) => sum + e.duration, 0);
  const totalCPDHours = cpdActivities.reduce((sum, a) => sum + a.hours, 0);
  const totalConsultationHours = cpdConsultations.reduce((sum, c) => sum + (c.minutes_spent / 60), 0);
  
  const weeklyLogbook = groupByWeek(logbookEntries);
  const weeklyCPD = groupByWeek(cpdActivities);
  const monthlyCPD = groupByMonth(cpdActivities);
  const weeklyConsultations = groupByWeek(cpdConsultations);
  const monthlyConsultations = groupByMonth(cpdConsultations);
  
  const groupedCompetencies = COMPETENCIES.map(comp => ({
    ...comp,
    entries: competencyJournals.filter(j => j.competency_id === comp.id)
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Supervisor Navigation */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <div className="flex items-center gap-2 sm:gap-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="font-semibold hover:bg-blue-50 text-sm sm:text-base"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Dashboard
                </Button>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={logout} 
                  className="text-gray-600 text-sm sm:text-base"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </nav>
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <PortalNav />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-3 -ml-2 hover:bg-slate-100 text-xs text-slate-600 h-7"
          >
            <ArrowLeft className="w-3 h-3 mr-1.5" />
            Back
          </Button>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-800 mb-0.5">{psychologistName}'s Progress</h1>
              <p className="text-xs text-slate-500">Review and provide feedback</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/messages')}
              className="h-8 px-3 text-xs text-slate-600 hover:bg-slate-100"
            >
              <Mail className="w-3.5 h-3.5 mr-1.5" />
              Message
            </Button>
          </div>
        </div>

        <Tabs defaultValue="logbook" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-5 h-9 bg-white/80 border border-slate-200/50">
            <TabsTrigger value="logbook" className="text-xs data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              Logbook
            </TabsTrigger>
            <TabsTrigger value="cpd" className="text-xs data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              CPD
            </TabsTrigger>
            <TabsTrigger value="competencies" className="text-xs data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Award className="w-3.5 h-3.5 mr-1.5" />
              Competencies
            </TabsTrigger>
          </TabsList>

          {/* LOGBOOK TAB */}
          <TabsContent value="logbook">
            {logbookYears.length > 0 && (
              <div className="mb-4">
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Year</Label>
                <Select 
                  value={selectedLogbookYear ? String(selectedLogbookYear) : (logbookYears[0]?.id || '')} 
                  onValueChange={setSelectedLogbookYear}
                >
                  <SelectTrigger className="w-32 h-8 text-sm border-slate-200">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {logbookYears.map(y => (
                      <SelectItem key={y.id} value={y.id} className="text-sm">{y.year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium">Total Hours</p>
                    <p className="text-2xl font-semibold text-slate-800">{totalLogbookHours.toFixed(1)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
              <CardHeader className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-slate-800">Practice Log</CardTitle>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCpdViewMode('weekly')}
                      className={`h-7 px-2.5 text-xs ${cpdViewMode === 'weekly' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      Week
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCpdViewMode('monthly')}
                      className={`h-7 px-2.5 text-xs ${cpdViewMode === 'monthly' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      Month
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCpdViewMode('total')}
                      className={`h-7 px-2.5 text-xs ${cpdViewMode === 'total' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {logbookEntries.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-slate-400">No entries yet</p>
                  </div>
                ) : (
                  <>
                    {cpdViewMode === 'weekly' && (
                      <Accordion type="single" collapsible>
                        {Object.keys(weeklyLogbook).sort().reverse().map(weekStart => {
                          const weekEntries = weeklyLogbook[weekStart];
                          const weekTotal = weekEntries.reduce((sum, e) => sum + e.duration, 0);
                          return (
                            <AccordionItem key={weekStart} value={weekStart} className="border-b border-slate-100 last:border-0">
                              <AccordionTrigger className="hover:bg-slate-50/50 px-4 py-3 transition-all">
                                <div className="flex items-center justify-between w-full pr-3">
                                  <span className="text-sm font-medium text-slate-700">{formatWeekRange(weekStart)}</span>
                                  <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">{weekTotal}h</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-2 px-4 pb-3">
                                  {weekEntries.map(entry => (
                                    <LogbookEntryCard 
                                      key={entry.id}
                                      entry={entry}
                                      commentingItem={commentingItem}
                                      setCommentingItem={setCommentingItem}
                                      commentText={commentText}
                                      setCommentText={setCommentText}
                                      handleAddComment={handleAddLogbookComment}
                                    />
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}
                    {cpdViewMode === 'monthly' && (
                      <Accordion type="single" collapsible>
                        {Object.keys(groupByMonth(logbookEntries)).sort().reverse().map(monthKey => {
                          const monthEntries = groupByMonth(logbookEntries)[monthKey];
                          const monthTotal = monthEntries.reduce((sum, e) => sum + e.duration, 0);
                          return (
                            <AccordionItem key={monthKey} value={monthKey} className="border-b border-slate-100 last:border-0">
                              <AccordionTrigger className="hover:bg-slate-50/50 px-4 py-3 transition-all">
                                <div className="flex items-center justify-between w-full pr-3">
                                  <span className="text-sm font-medium text-slate-700">{getMonthName(monthKey)}</span>
                                  <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">{monthTotal}h</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-2 px-4 pb-3">
                                  {monthEntries.map(entry => (
                                    <LogbookEntryCard 
                                      key={entry.id}
                                      entry={entry}
                                      commentingItem={commentingItem}
                                      setCommentingItem={setCommentingItem}
                                      commentText={commentText}
                                      setCommentText={setCommentText}
                                      handleAddComment={handleAddLogbookComment}
                                    />
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}
                    {cpdViewMode === 'total' && (
                      <Accordion type="single" collapsible>
                        <AccordionItem value="total" className="border-b border-slate-100 last:border-0">
                          <AccordionTrigger className="hover:bg-slate-50/50 px-4 py-3 transition-all">
                            <div className="flex items-center justify-between w-full pr-3">
                              <span className="text-sm font-medium text-slate-700">All Entries</span>
                              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">{totalLogbookHours.toFixed(1)}h</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 px-4 pb-3">
                              {logbookEntries.sort((a, b) => new Date(b.date) - new Date(a.date)).map(entry => (
                                <LogbookEntryCard 
                                  key={entry.id}
                                  entry={entry}
                                  commentingItem={commentingItem}
                                  setCommentingItem={setCommentingItem}
                                  commentText={commentText}
                                  setCommentText={setCommentText}
                                  handleAddComment={handleAddLogbookComment}
                                />
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CPD TAB */}
          <TabsContent value="cpd">
            {cpdYears.length > 0 && (
              <div className="mb-6">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">CPD Year</Label>
                <Select 
                  value={selectedCpdYear ? String(selectedCpdYear) : (cpdYears[0]?.id || '')} 
                  onValueChange={setSelectedCpdYear}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {cpdYears.map(y => (
                      <SelectItem key={y.id} value={y.id}>{y.year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="stat-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-gray-500 mb-2">CPD Hours</p>
                      <p className="text-[36px] font-bold leading-none text-gray-900">{totalCPDHours.toFixed(1)}h</p>
                    </div>
                    <div className="w-14 h-14 icon-green rounded-xl flex items-center justify-center shadow-sm">
                      <BookOpen className="w-7 h-7 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-gray-500 mb-2">Consultation Hours</p>
                      <p className="text-[36px] font-bold leading-none text-gray-900">{totalConsultationHours.toFixed(1)}h</p>
                    </div>
                    <div className="w-14 h-14 icon-purple rounded-xl flex items-center justify-center shadow-sm">
                      <Users className="w-7 h-7 text-purple-600" />
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

              {/* CPD Activities Sub-tab */}
              <TabsContent value="activities">
                <Card className="glass-card">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">CPD Activities</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={cpdViewMode === 'weekly' ? 'default' : 'outline'}
                          onClick={() => setCpdViewMode('weekly')}
                          className={cpdViewMode === 'weekly' ? 'btn-primary' : ''}
                        >
                          Weekly
                        </Button>
                        <Button
                          size="sm"
                          variant={cpdViewMode === 'monthly' ? 'default' : 'outline'}
                          onClick={() => setCpdViewMode('monthly')}
                          className={cpdViewMode === 'monthly' ? 'btn-primary' : ''}
                        >
                          Monthly
                        </Button>
                        <Button
                          size="sm"
                          variant={cpdViewMode === 'yearly' ? 'default' : 'outline'}
                          onClick={() => setCpdViewMode('yearly')}
                          className={cpdViewMode === 'yearly' ? 'btn-primary' : ''}
                        >
                          Total Period
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {cpdActivities.length === 0 ? (
                      <div className="empty-state py-8">
                        <p className="text-gray-500">No activities yet</p>
                      </div>
                    ) : (
                      <>
                        {cpdViewMode === 'weekly' && (
                          <CPDWeeklyView 
                            data={weeklyCPD}
                            commentingItem={commentingItem}
                            setCommentingItem={setCommentingItem}
                            commentText={commentText}
                            setCommentText={setCommentText}
                            handleAddComment={handleAddCPDComment}
                          />
                        )}
                        {cpdViewMode === 'monthly' && (
                          <CPDMonthlyView 
                            data={monthlyCPD}
                            commentingItem={commentingItem}
                            setCommentingItem={setCommentingItem}
                            commentText={commentText}
                            setCommentText={setCommentText}
                            handleAddComment={handleAddCPDComment}
                          />
                        )}
                        {cpdViewMode === 'yearly' && (
                          <Accordion type="single" collapsible>
                            <AccordionItem value="total" className="border-b border-gray-200">
                              <AccordionTrigger className="hover:bg-gray-50 px-3 rounded-lg transition-all">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <span className="font-medium text-gray-900">Total Period</span>
                                  <span className="font-bold text-base text-green-600 bg-green-50 px-3 py-1 rounded-full">{totalCPDHours.toFixed(1)}h</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-3 pt-3">
                                  {cpdActivities.sort((a, b) => new Date(b.date) - new Date(a.date)).map(activity => (
                                    <CPDActivityCard 
                                      key={activity.id}
                                      activity={activity}
                                      commentingItem={commentingItem}
                                      setCommentingItem={setCommentingItem}
                                      commentText={commentText}
                                      setCommentText={setCommentText}
                                      handleAddComment={handleAddCPDComment}
                                    />
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Learning Goals Sub-tab */}
              <TabsContent value="goals">
                <Card className="glass-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold">Learning Goals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cpdPlans.length === 0 ? (
                      <div className="empty-state py-8">
                        <p className="text-gray-500">No learning plans yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cpdPlans.map(plan => (
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
                              <div className="space-y-3 mt-3">
                                {plan.goals.map(goal => (
                                  <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <p className="font-medium text-sm text-gray-900 mb-1">{goal.goal}</p>
                                        <p className="text-xs text-gray-600 mt-1">{goal.what_to_learn}</p>
                                        <p className="text-xs text-gray-500 mt-1">Target: {goal.target_date}</p>
                                      </div>
                                      <span className={`text-xs px-2 py-1 rounded-full ${goal.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {goal.status}
                                      </span>
                                    </div>
                                    
                                    {goal.supervisor_comment && (
                                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-start gap-2">
                                          <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                                          <div className="flex-1">
                                            <p className="text-xs font-semibold text-blue-900 mb-1">Supervisor Feedback</p>
                                            <p className="text-sm text-gray-700">{goal.supervisor_comment}</p>
                                            {goal.supervisor_comment_date && (
                                              <p className="text-xs text-gray-500 mt-1">
                                                {new Date(goal.supervisor_comment_date).toLocaleDateString()}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {commentingItem === goal.id ? (
                                      <div className="mt-3 space-y-2">
                                        <Textarea
                                          placeholder="Add your feedback on this learning goal..."
                                          value={commentText}
                                          onChange={(e) => setCommentText(e.target.value)}
                                          rows={3}
                                          className="text-sm"
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() => handleAddGoalComment(goal.id)}
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
                                          setCommentingItem(goal.id);
                                          setCommentText(goal.supervisor_comment || '');
                                        }}
                                        className="mt-3"
                                      >
                                        <MessageSquare className="w-3 h-3 mr-1" />
                                        {goal.supervisor_comment ? 'Edit Feedback' : 'Add Feedback'}
                                      </Button>
                                    )}
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

              {/* Peer Consultations Sub-tab */}
              <TabsContent value="consultations">
                <Card className="glass-card">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">Peer Consultations</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={cpdViewMode === 'weekly' ? 'default' : 'outline'}
                          onClick={() => setCpdViewMode('weekly')}
                          className={cpdViewMode === 'weekly' ? 'btn-primary' : ''}
                        >
                          Weekly
                        </Button>
                        <Button
                          size="sm"
                          variant={cpdViewMode === 'monthly' ? 'default' : 'outline'}
                          onClick={() => setCpdViewMode('monthly')}
                          className={cpdViewMode === 'monthly' ? 'btn-primary' : ''}
                        >
                          Monthly
                        </Button>
                        <Button
                          size="sm"
                          variant={cpdViewMode === 'yearly' ? 'default' : 'outline'}
                          onClick={() => setCpdViewMode('yearly')}
                          className={cpdViewMode === 'yearly' ? 'btn-primary' : ''}
                        >
                          Total Period
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {cpdConsultations.length === 0 ? (
                      <div className="empty-state py-8">
                        <p className="text-gray-500">No consultations yet</p>
                      </div>
                    ) : (
                      <>
                        {cpdViewMode === 'weekly' && (
                          <ConsultationsWeeklyView 
                            data={weeklyConsultations}
                            commentingItem={commentingItem}
                            setCommentingItem={setCommentingItem}
                            commentText={commentText}
                            setCommentText={setCommentText}
                            handleAddComment={handleAddConsultationComment}
                          />
                        )}
                        {cpdViewMode === 'monthly' && (
                          <ConsultationsMonthlyView 
                            data={monthlyConsultations}
                            commentingItem={commentingItem}
                            setCommentingItem={setCommentingItem}
                            commentText={commentText}
                            setCommentText={setCommentText}
                            handleAddComment={handleAddConsultationComment}
                          />
                        )}
                        {cpdViewMode === 'yearly' && (
                          <Accordion type="single" collapsible>
                            <AccordionItem value="all" className="border-b border-gray-200">
                              <AccordionTrigger className="hover:bg-gray-50 px-3 rounded-lg transition-all">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <span className="font-medium text-gray-900">Total Period</span>
                                  <span className="font-bold text-base text-purple-600 bg-purple-50 px-3 py-1 rounded-full">{totalConsultationHours.toFixed(1)}h</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-3 pt-3">
                                  {cpdConsultations.sort((a, b) => new Date(b.date) - new Date(a.date)).map(consultation => (
                                    <ConsultationCard 
                                      key={consultation.id} 
                                      consultation={consultation}
                                      commentingItem={commentingItem}
                                      setCommentingItem={setCommentingItem}
                                      commentText={commentText}
                                      setCommentText={setCommentText}
                                      handleAddComment={handleAddConsultationComment}
                                    />
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* COMPETENCIES TAB */}
          <TabsContent value="competencies">
            {competencyJournals.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="empty-state py-8">
                    <p className="text-gray-500">No competency journal entries yet</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groupedCompetencies.map(competency => (
                  <Card key={competency.id} className="glass-card">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Award className={`w-5 h-5 text-${competency.color}-600`} />
                        {competency.name}
                        <span className="ml-auto text-sm font-normal text-gray-500">
                          {competency.entries.length} {competency.entries.length === 1 ? 'entry' : 'entries'}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {competency.entries.length === 0 ? (
                        <p className="text-sm text-gray-500">No entries yet</p>
                      ) : (
                        <div className="space-y-3">
                          {competency.entries.map(entry => (
                            <CompetencyEntryCard
                              key={entry.id}
                              entry={entry}
                              commentingItem={commentingItem}
                              setCommentingItem={setCommentingItem}
                              commentText={commentText}
                              setCommentText={setCommentText}
                              handleAddComment={handleAddCompetencyComment}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Component: Logbook Entry Card
function LogbookEntryCard({ entry, commentingItem, setCommentingItem, commentText, setCommentText, handleAddComment }) {
  return (
    <div className="list-item-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900 mb-1">{entry.activity_type}</p>
          <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
          <p className="text-xs text-gray-400 mt-2">{entry.date}</p>
        </div>
        <span className="text-base font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{entry.duration}h</span>
      </div>

      {entry.supervisor_comment && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-blue-900 mb-1">Supervisor Feedback</p>
              <p className="text-sm text-gray-700">{entry.supervisor_comment}</p>
              {entry.supervisor_comment_date && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(entry.supervisor_comment_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {commentingItem === entry.id ? (
        <div className="mt-3 space-y-2">
          <Textarea
            placeholder="Add your feedback for this entry..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleAddComment(entry.id)}
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
            setCommentingItem(entry.id);
            setCommentText(entry.supervisor_comment || '');
          }}
          className="mt-3"
        >
          <MessageSquare className="w-3 h-3 mr-1" />
          {entry.supervisor_comment ? 'Edit Feedback' : 'Add Feedback'}
        </Button>
      )}
    </div>
  );
}

// Component: CPD Activity Card
function CPDActivityCard({ activity, commentingItem, setCommentingItem, commentText, setCommentText, handleAddComment }) {
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
        <span className="text-base font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">{activity.hours.toFixed(1)}h</span>
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

// Component: CPD Weekly View
function CPDWeeklyView({ data, commentingItem, setCommentingItem, commentText, setCommentText, handleAddComment }) {
  return (
    <Accordion type="single" collapsible>
      {Object.keys(data).sort().reverse().map(weekStart => {
        const weekActivities = data[weekStart];
        const weekTotal = weekActivities.reduce((sum, a) => sum + a.hours, 0);
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
                {weekActivities.map(activity => (
                  <CPDActivityCard 
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
  );
}

// Component: CPD Monthly View
function CPDMonthlyView({ data, commentingItem, setCommentingItem, commentText, setCommentText, handleAddComment }) {
  return (
    <Accordion type="single" collapsible>
      {Object.keys(data).sort().reverse().map(monthKey => {
        const monthActivities = data[monthKey];
        const monthTotal = monthActivities.reduce((sum, a) => sum + a.hours, 0);
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
                {monthActivities.map(activity => (
                  <CPDActivityCard 
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
  );
}

// Component: Consultation Card
function ConsultationCard({ consultation, commentingItem, setCommentingItem, commentText, setCommentText, handleAddComment }) {
  return (
    <div className="list-item-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm text-gray-700">{consultation.activity_description}</p>
          <p className="text-xs text-gray-400 mt-2">{consultation.date}</p>
        </div>
        <span className="text-base font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
          {(consultation.minutes_spent / 60).toFixed(1)}h
        </span>
      </div>

      {consultation.supervisor_comment && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-blue-900 mb-1">Supervisor Feedback</p>
              <p className="text-sm text-gray-700">{consultation.supervisor_comment}</p>
              {consultation.supervisor_comment_date && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(consultation.supervisor_comment_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {commentingItem === consultation.id ? (
        <div className="mt-3 space-y-2">
          <Textarea
            placeholder="Add your feedback..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleAddComment(consultation.id)}
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
            setCommentingItem(consultation.id);
            setCommentText(consultation.supervisor_comment || '');
          }}
          className="mt-3"
        >
          <MessageSquare className="w-3 h-3 mr-1" />
          {consultation.supervisor_comment ? 'Edit Feedback' : 'Add Feedback'}
        </Button>
      )}
    </div>
  );
}

// Component: Consultations Weekly View
function ConsultationsWeeklyView({ data, commentingItem, setCommentingItem, commentText, setCommentText, handleAddComment }) {
  return (
    <Accordion type="single" collapsible>
      {Object.keys(data).sort().reverse().map(weekStart => {
        const weekConsults = data[weekStart];
        const weekTotal = weekConsults.reduce((sum, c) => sum + (c.minutes_spent / 60), 0);
        return (
          <AccordionItem key={weekStart} value={weekStart} className="border-b border-gray-200">
            <AccordionTrigger className="hover:bg-gray-50 px-3 rounded-lg transition-all">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-medium text-gray-900">{formatWeekRange(weekStart)}</span>
                <span className="font-bold text-base text-purple-600 bg-purple-50 px-3 py-1 rounded-full">{weekTotal.toFixed(1)}h</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-3">
                {weekConsults.map(consultation => (
                  <ConsultationCard 
                    key={consultation.id} 
                    consultation={consultation}
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
  );
}

// Component: Consultations Monthly View
function ConsultationsMonthlyView({ data, commentingItem, setCommentingItem, commentText, setCommentText, handleAddComment }) {
  return (
    <Accordion type="single" collapsible>
      {Object.keys(data).sort().reverse().map(monthKey => {
        const monthConsults = data[monthKey];
        const monthTotal = monthConsults.reduce((sum, c) => sum + (c.minutes_spent / 60), 0);
        return (
          <AccordionItem key={monthKey} value={monthKey} className="border-b border-gray-200">
            <AccordionTrigger className="hover:bg-gray-50 px-3 rounded-lg transition-all">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-medium text-gray-900">{getMonthName(monthKey)}</span>
                <span className="font-bold text-base text-purple-600 bg-purple-50 px-3 py-1 rounded-full">{monthTotal.toFixed(1)}h</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-3">
                {monthConsults.map(consultation => (
                  <ConsultationCard 
                    key={consultation.id} 
                    consultation={consultation}
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
  );
}

// Component: Competency Entry Card
function CompetencyEntryCard({ entry, commentingItem, setCommentingItem, commentText, setCommentText, handleAddComment }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-700">{entry.entry}</p>
      <p className="text-xs text-gray-400 mt-2">{new Date(entry.date).toLocaleDateString()}</p>
      
      {entry.supervisor_comment && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-blue-900 mb-1">Supervisor Feedback</p>
              <p className="text-xs text-gray-700">{entry.supervisor_comment}</p>
            </div>
          </div>
        </div>
      )}

      {commentingItem === entry.id ? (
        <div className="mt-2 space-y-2">
          <Textarea
            placeholder="Add your feedback..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleAddComment(entry.id)}
              className="btn-primary text-xs"
            >
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCommentingItem(null);
                setCommentText('');
              }}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setCommentingItem(entry.id);
            setCommentText(entry.supervisor_comment || '');
          }}
          className="mt-2 text-xs"
        >
          <MessageSquare className="w-3 h-3 mr-1" />
          {entry.supervisor_comment ? 'Edit Feedback' : 'Add Feedback'}
        </Button>
      )}
    </div>
  );
}
