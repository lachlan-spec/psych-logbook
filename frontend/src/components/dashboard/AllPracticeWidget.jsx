import React, { useState, useEffect } from 'react';
import { logbookAPI, cpdAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Clock, BookOpen, Users, FileText } from 'lucide-react';
import { groupByWeek, formatWeekRange } from '../../lib/dateUtils';

// Progress bar component (moved outside to avoid re-creation on each render)
const ProgressBar = ({ percentage, color }) => (
  <div className="w-full h-1.5 bg-neutral/50 rounded-full overflow-hidden mt-1">
    <div 
      className={`h-full rounded-full transition-all duration-500 ${color}`}
      style={{ width: `${Math.min(percentage, 100)}%` }}
    />
  </div>
);

export default function AllPracticeWidget() {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('weekly');
  
  // Logbook data
  const [logbookYears, setLogbookYears] = useState([]);
  const [logbookEntries, setLogbookEntries] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(null);
  
  // CPD data
  const [cpdActivities, setCpdActivities] = useState([]);
  const [peerConsultations, setPeerConsultations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logYearsResp, logEntriesResp, cpdResp, consultResp] = await Promise.all([
          logbookAPI.getYears(),
          logbookAPI.getEntries(),
          cpdAPI.getActivities(),
          cpdAPI.getConsultations()
        ]);
        
        setLogbookYears(logYearsResp.data);
        setLogbookEntries(logEntriesResp.data);
        setCpdActivities(cpdResp.data || []);
        setPeerConsultations(consultResp.data || []);
        
        // Auto-select the period that includes today's date
        if (logYearsResp.data.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          let currentPeriod = logYearsResp.data.find(y => {
            if (y.start_date && y.end_date) {
              return y.start_date <= today && y.end_date >= today;
            }
            return false;
          });
          
          // Default to first if no match
          const selectedYear = currentPeriod || logYearsResp.data[0];
          setSelectedYearId(selectedYear.id);
        }
      } catch (error) {
        console.error('Failed to load practice data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get the selected logbook year with targets
  const selectedYear = logbookYears.find(y => y.id === selectedYearId);
  
  // Calculate time elapsed percentage
  const calculateTimeElapsed = () => {
    if (!selectedYear?.start_date || !selectedYear?.end_date) return 0;
    const start = new Date(selectedYear.start_date);
    const end = new Date(selectedYear.end_date);
    const today = new Date();
    
    if (today < start) return 0;
    if (today > end) return 100;
    
    const totalDays = (end - start) / (1000 * 60 * 60 * 24);
    const elapsedDays = (today - start) / (1000 * 60 * 60 * 24);
    return Math.min((elapsedDays / totalDays) * 100, 100);
  };
  const timeElapsedPercent = calculateTimeElapsed();
  
  // Get targets from settings
  const targets = {
    total: selectedYear?.target_hours || 1500,
    practice: selectedYear?.target_direct_client || 0,
    supervision: (selectedYear?.target_supervision_individual || 0) + (selectedYear?.target_supervision_group || 0),
    cpd: selectedYear?.target_cpd || 0,
    peer: selectedYear?.target_peer_consultation || 0
  };
  
  // Filter logbook entries for selected year
  const yearLogbookEntries = logbookEntries.filter(e => e.logbook_id === selectedYearId);
  
  // Filter CPD activities and peer consultations by date range
  const filterByDateRange = (items) => {
    if (!selectedYear) return [];
    return items.filter(item => {
      const itemDate = new Date(item.date);
      const startDate = new Date(selectedYear.start_date);
      const endDate = new Date(selectedYear.end_date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };
  
  const yearCpdActivities = filterByDateRange(cpdActivities);
  const yearPeerConsultations = filterByDateRange(peerConsultations);

  // Convert all items to a unified format (excluding CPD and Peer from main list - they have their own section)
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

  // Calculate totals with supervision breakdown
  const supervisionEntries = yearLogbookEntries.filter(e => 
    e.activity_type?.includes('Supervision - Individual') || e.activity_type === 'Supervision - Group'
  );
  const primarySupervisionHours = yearLogbookEntries
    .filter(e => e.activity_type === 'Supervision - Individual (Primary)')
    .reduce((sum, e) => sum + e.duration, 0);
  const secondarySupervisionHours = yearLogbookEntries
    .filter(e => e.activity_type?.startsWith('Supervision - Individual (Secondary'))
    .reduce((sum, e) => sum + e.duration, 0);
  const groupSupervisionHours = yearLogbookEntries
    .filter(e => e.activity_type === 'Supervision - Group')
    .reduce((sum, e) => sum + e.duration, 0);
  // Include legacy "Supervision - Individual" entries
  const legacyIndividualHours = yearLogbookEntries
    .filter(e => e.activity_type === 'Supervision - Individual')
    .reduce((sum, e) => sum + e.duration, 0);
  
  const totals = {
    practice: yearLogbookEntries
      .filter(e => e.activity_type === 'Direct Client Contact')
      .reduce((sum, e) => sum + e.duration, 0),
    supervision: primarySupervisionHours + secondarySupervisionHours + groupSupervisionHours + legacyIndividualHours,
    cpd: yearCpdActivities.reduce((sum, a) => sum + (a.hours || 0), 0),
    peer: yearPeerConsultations.reduce((sum, c) => sum + ((c.minutes_spent || 0) / 60), 0)
  };
  totals.all = totals.practice + totals.supervision + totals.cpd + totals.peer + 
    yearLogbookEntries.filter(e => e.activity_type === 'Other').reduce((sum, e) => sum + e.duration, 0);

  // Supervision breakdown percentages
  const totalIndividualSupervision = primarySupervisionHours + secondarySupervisionHours + legacyIndividualHours;
  const supervisionBreakdown = {
    primary: totalIndividualSupervision > 0 ? (primarySupervisionHours / totalIndividualSupervision) * 100 : 0,
    secondary: totalIndividualSupervision > 0 ? (secondarySupervisionHours / totalIndividualSupervision) * 100 : 0
  };

  // Calculate percentages
  const percentages = {
    total: targets.total > 0 ? Math.min((totals.all / targets.total) * 100, 100) : 0,
    practice: targets.practice > 0 ? Math.min((totals.practice / targets.practice) * 100, 100) : 0,
    supervision: targets.supervision > 0 ? Math.min((totals.supervision / targets.supervision) * 100, 100) : 0,
    cpd: targets.cpd > 0 ? Math.min((totals.cpd / targets.cpd) * 100, 100) : 0,
    peer: targets.peer > 0 ? Math.min((totals.peer / targets.peer) * 100, 100) : 0
  };

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
      <Card className="card col-span-full">
        <CardContent className="p-8 text-center">
          <div className="spinner mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card col-span-full">
      <CardHeader className="p-4 border-b border-neutral">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold text-neutral-dark flex items-center gap-2">
                <Clock className="w-4 h-4" />
                All Practice Summary
              </CardTitle>
              <p className="text-xs text-neutral-light mt-1">Practice Logbook + CPD Activities + Peer Consultations</p>
            </div>
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList className="h-8">
                <TabsTrigger value="weekly" className="text-xs px-3 h-7">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-3 h-7">Monthly</TabsTrigger>
                <TabsTrigger value="all" className="text-xs px-3 h-7">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Period Selector */}
          {logbookYears.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-light">Registrar Period:</span>
              <Select value={selectedYearId || ''} onValueChange={setSelectedYearId}>
                <SelectTrigger className="h-8 w-auto min-w-[200px] text-xs">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {logbookYears.map(year => (
                    <SelectItem key={year.id} value={year.id} className="text-xs">
                      {year.year_name || year.year} ({year.start_date} - {year.end_date})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Time Elapsed Indicator */}
      {selectedYear && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-700 font-medium">Period Progress</span>
            <span className="text-amber-800 font-semibold">{timeElapsedPercent.toFixed(0)}% of period elapsed</span>
          </div>
          <div className="w-full h-1 bg-amber-200 rounded-full mt-1">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${timeElapsedPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Totals Summary with Percentages */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-4 border-b border-neutral bg-neutral/30">
        {/* Total */}
        <div className="text-center p-2">
          <p className="text-xs text-neutral-light mb-0.5">Total</p>
          <p className="text-lg font-bold text-neutral-dark">{totals.all.toFixed(1)}h</p>
          {targets.total > 0 && (
            <>
              <p className="text-xs text-neutral-light">{percentages.total.toFixed(0)}% of {targets.total.toFixed(1)}h</p>
              <ProgressBar percentage={percentages.total} color="bg-primary" />
            </>
          )}
        </div>
        
        {/* Practice (Direct Client Contact) */}
        <div className="text-center p-2">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <FileText className="w-3 h-3 text-blue-600" />
            <p className="text-xs text-neutral-light">Direct Client</p>
          </div>
          <p className="text-lg font-bold text-blue-600">{totals.practice.toFixed(1)}h</p>
          {targets.practice > 0 && (
            <>
              <p className="text-xs text-neutral-light">{percentages.practice.toFixed(0)}% of {targets.practice.toFixed(1)}h</p>
              <ProgressBar percentage={percentages.practice} color="bg-blue-500" />
            </>
          )}
        </div>
        
        {/* Supervision */}
        <div className="text-center p-2">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Users className="w-3 h-3 text-teal-600" />
            <p className="text-xs text-neutral-light">Supervision</p>
          </div>
          <p className="text-lg font-bold text-teal-600">{totals.supervision.toFixed(1)}h</p>
          {targets.supervision > 0 && (
            <>
              <p className="text-xs text-neutral-light">{percentages.supervision.toFixed(0)}% of {targets.supervision.toFixed(1)}h</p>
              <ProgressBar percentage={percentages.supervision} color="bg-teal-500" />
            </>
          )}
          {totalIndividualSupervision > 0 && (
            <p className="text-xs text-neutral-light mt-1">
              Primary {supervisionBreakdown.primary.toFixed(0)}% | Secondary {supervisionBreakdown.secondary.toFixed(0)}%
            </p>
          )}
        </div>
        
        {/* CPD */}
        <div className="text-center p-2">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <BookOpen className="w-3 h-3 text-green-600" />
            <p className="text-xs text-neutral-light">CPD</p>
          </div>
          <p className="text-lg font-bold text-green-600">{totals.cpd.toFixed(1)}h</p>
          {targets.cpd > 0 && (
            <>
              <p className="text-xs text-neutral-light">{percentages.cpd.toFixed(0)}% of {targets.cpd.toFixed(1)}h</p>
              <ProgressBar percentage={percentages.cpd} color="bg-green-500" />
            </>
          )}
        </div>
        
        {/* Peer */}
        <div className="text-center p-2">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Users className="w-3 h-3 text-purple-600" />
            <p className="text-xs text-neutral-light">Peer</p>
          </div>
          <p className="text-lg font-bold text-purple-600">{totals.peer.toFixed(1)}h</p>
          {targets.peer > 0 && (
            <>
              <p className="text-xs text-neutral-light">{percentages.peer.toFixed(0)}% of {targets.peer.toFixed(1)}h</p>
              <ProgressBar percentage={percentages.peer} color="bg-purple-500" />
            </>
          )}
        </div>
      </div>

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
                                    <p className="text-xs text-neutral-dark mb-1 line-clamp-2">{item.description}</p>
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
                                    <p className="text-xs text-neutral-dark mb-1 line-clamp-2">{item.description}</p>
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
              <div className="space-y-2 p-4 max-h-96 overflow-y-auto">
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
                          <p className="text-xs text-neutral-dark mb-1 line-clamp-2">{item.description}</p>
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
  );
}
