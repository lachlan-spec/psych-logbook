import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logbookAPI, cpdAPI } from '../../services/api';
import PortalNav from './PortalNav';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { toast } from 'sonner';
import { ArrowLeft, Clock, BookOpen, Users, FileText } from 'lucide-react';
import { groupByWeek, formatWeekRange } from '../../lib/dateUtils';

export default function AllPracticeSummary() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('weekly');
  
  // Logbook data
  const [logbookYears, setLogbookYears] = useState([]);
  const [logbookEntries, setLogbookEntries] = useState([]);
  const [selectedLogbookYearId, setSelectedLogbookYearId] = useState(null);
  
  // CPD data
  const [cpdYears, setCpdYears] = useState([]);
  const [cpdActivities, setCpdActivities] = useState([]);
  const [peerConsultations, setPeerConsultations] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [logYearsResp, logEntriesResp, cpdYearsResp, cpdResp, consultResp] = await Promise.all([
        logbookAPI.getYears(),
        logbookAPI.getEntries(),
        cpdAPI.getYears(),
        cpdAPI.getActivities(),
        cpdAPI.getConsultations()
      ]);
      
      setLogbookYears(logYearsResp.data);
      setLogbookEntries(logEntriesResp.data);
      setCpdYears(cpdYearsResp.data);
      setCpdActivities(cpdResp.data || []);
      setPeerConsultations(consultResp.data || []);
      
      if (logYearsResp.data.length > 0) {
        setSelectedLogbookYearId(logYearsResp.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load practice data');
    } finally {
      setLoading(false);
    }
  };

  // Get the selected logbook year
  const selectedLogbookYear = logbookYears.find(y => y.id === selectedLogbookYearId);
  
  // Filter logbook entries for selected year
  const yearLogbookEntries = logbookEntries.filter(e => e.logbook_id === selectedLogbookYearId);
  
  // Filter CPD activities and peer consultations by date range
  const filterByDateRange = (items) => {
    if (!selectedLogbookYear) return [];
    return items.filter(item => {
      const itemDate = new Date(item.date);
      const startDate = new Date(selectedLogbookYear.start_date);
      const endDate = new Date(selectedLogbookYear.end_date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };
  
  const yearCpdActivities = filterByDateRange(cpdActivities);
  const yearPeerConsultations = filterByDateRange(peerConsultations);

  // Convert all items to a unified format
  const allPracticeItems = [
    ...yearLogbookEntries.map(entry => ({
      id: entry.id,
      date: entry.date,
      hours: entry.duration,
      type: 'logbook',
      category: entry.activity_type,
      description: entry.notes,
      icon: FileText,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      badgeColor: 'text-blue-600 bg-blue-100'
    })),
    ...yearCpdActivities.map(activity => ({
      id: `cpd-${activity.id}`,
      date: activity.date,
      hours: activity.hours || 0,
      type: 'cpd',
      category: `CPD: ${activity.activity_type}`,
      description: activity.description,
      icon: BookOpen,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      badgeColor: 'text-green-600 bg-green-100'
    })),
    ...yearPeerConsultations.map(consult => ({
      id: `peer-${consult.id}`,
      date: consult.date,
      hours: (consult.minutes_spent || 0) / 60,
      type: 'peer',
      category: 'Peer Consultation',
      description: consult.activity_description,
      icon: Users,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      badgeColor: 'text-purple-600 bg-purple-100'
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Calculate totals
  const totals = {
    logbook: yearLogbookEntries.reduce((sum, e) => sum + e.duration, 0),
    cpd: yearCpdActivities.reduce((sum, a) => sum + (a.hours || 0), 0),
    peer: yearPeerConsultations.reduce((sum, c) => sum + ((c.minutes_spent || 0) / 60), 0)
  };
  totals.all = totals.logbook + totals.cpd + totals.peer;

  // Group by week/month
  const weeklyData = groupByWeek(allPracticeItems.map(item => ({ ...item, duration: item.hours })));
  
  const groupByMonth = (items) => {
    const grouped = {};
    items.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(item);
    });
    return grouped;
  };
  const monthlyData = groupByMonth(allPracticeItems);

  const formatMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary">
        <PortalNav />
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <PortalNav />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4 -ml-2 hover:bg-neutral"
        >
          <ArrowLeft className="icon-sm mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">All Practice Summary</h1>
          <p className="text-sm text-neutral-light mt-1">Combined view of all your practice hours</p>
        </div>

        {/* Totals Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="card p-3">
            <p className="text-xs text-neutral-light mb-1">Total Hours</p>
            <p className="text-xl font-bold text-neutral-dark">{totals.all.toFixed(1)}h</p>
          </Card>
          <Card className="card p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <p className="text-xs text-neutral-light">Practice Log</p>
            </div>
            <p className="text-lg font-bold text-blue-600">{totals.logbook.toFixed(1)}h</p>
          </Card>
          <Card className="card p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-green-600" />
              <p className="text-xs text-neutral-light">CPD Activities</p>
            </div>
            <p className="text-lg font-bold text-green-600">{totals.cpd.toFixed(1)}h</p>
          </Card>
          <Card className="card p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <p className="text-xs text-neutral-light">Peer Consult</p>
            </div>
            <p className="text-lg font-bold text-purple-600">{totals.peer.toFixed(1)}h</p>
          </Card>
        </div>

        {/* View Tabs */}
        <Card className="card">
          <CardHeader className="p-4 border-b border-neutral">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-sm font-semibold text-neutral-dark flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Practice Log
              </CardTitle>
              <Tabs value={viewMode} onValueChange={setViewMode}>
                <TabsList className="h-8">
                  <TabsTrigger value="weekly" className="text-xs px-3 h-7">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs px-3 h-7">Monthly</TabsTrigger>
                  <TabsTrigger value="all" className="text-xs px-3 h-7">All</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {allPracticeItems.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-neutral-light">No practice items recorded yet</p>
              </div>
            ) : (
              <>
                {viewMode === 'weekly' && (
                  <Accordion type="single" collapsible defaultValue={Object.keys(weeklyData).sort().reverse()[0]}>
                    {Object.keys(weeklyData).sort().reverse().map(weekStart => {
                      const weekItems = weeklyData[weekStart];
                      const weekTotal = weekItems.reduce((sum, e) => sum + e.duration, 0);
                      return (
                        <AccordionItem key={weekStart} value={weekStart} className="border-b border-neutral last:border-0">
                          <AccordionTrigger className="hover:bg-neutral/50 px-4 py-3 transition-all">
                            <div className="flex items-center justify-between w-full pr-3">
                              <span className="text-sm font-medium text-neutral-dark">{formatWeekRange(weekStart)}</span>
                              <span className="text-sm font-semibold text-primary bg-primary-light px-2.5 py-0.5 rounded-full">
                                {weekTotal.toFixed(1)}h
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 px-4 pb-3">
                              {weekItems.map(item => {
                                const Icon = item.icon;
                                return (
                                  <div key={item.id} className={`rounded-lg p-3 border ${item.bgColor} ${item.borderColor}`}>
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Icon className="w-3.5 h-3.5" />
                                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${item.badgeColor}`}>
                                            {item.category}
                                          </span>
                                        </div>
                                        <p className="text-xs text-neutral-dark mb-1">{item.description}</p>
                                        <p className="text-xs text-neutral-light">{item.date}</p>
                                      </div>
                                      <span className={`text-sm font-semibold px-2 py-0.5 rounded ml-2 ${item.badgeColor}`}>
                                        {item.hours.toFixed(1)}h
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}

                {viewMode === 'monthly' && (
                  <Accordion type="single" collapsible defaultValue={Object.keys(monthlyData).sort().reverse()[0]}>
                    {Object.keys(monthlyData).sort().reverse().map(monthKey => {
                      const monthItems = monthlyData[monthKey];
                      const monthTotal = monthItems.reduce((sum, e) => sum + e.hours, 0);
                      return (
                        <AccordionItem key={monthKey} value={monthKey} className="border-b border-neutral last:border-0">
                          <AccordionTrigger className="hover:bg-neutral/50 px-4 py-3 transition-all">
                            <div className="flex items-center justify-between w-full pr-3">
                              <span className="text-sm font-medium text-neutral-dark">{formatMonthLabel(monthKey)}</span>
                              <span className="text-sm font-semibold text-primary bg-primary-light px-2.5 py-0.5 rounded-full">
                                {monthTotal.toFixed(1)}h
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 px-4 pb-3">
                              {monthItems.map(item => {
                                const Icon = item.icon;
                                return (
                                  <div key={item.id} className={`rounded-lg p-3 border ${item.bgColor} ${item.borderColor}`}>
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Icon className="w-3.5 h-3.5" />
                                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${item.badgeColor}`}>
                                            {item.category}
                                          </span>
                                        </div>
                                        <p className="text-xs text-neutral-dark mb-1">{item.description}</p>
                                        <p className="text-xs text-neutral-light">{item.date}</p>
                                      </div>
                                      <span className={`text-sm font-semibold px-2 py-0.5 rounded ml-2 ${item.badgeColor}`}>
                                        {item.hours.toFixed(1)}h
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}

                {viewMode === 'all' && (
                  <div className="space-y-2 p-4">
                    {allPracticeItems.map(item => {
                      const Icon = item.icon;
                      return (
                        <div key={item.id} className={`rounded-lg p-3 border ${item.bgColor} ${item.borderColor}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className="w-3.5 h-3.5" />
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${item.badgeColor}`}>
                                  {item.category}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-dark mb-1">{item.description}</p>
                              <p className="text-xs text-neutral-light">{item.date}</p>
                            </div>
                            <span className={`text-sm font-semibold px-2 py-0.5 rounded ml-2 ${item.badgeColor}`}>
                              {item.hours.toFixed(1)}h
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
