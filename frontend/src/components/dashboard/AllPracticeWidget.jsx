import React, { useState, useEffect } from 'react';
import { logbookAPI, cpdAPI, competenciesAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Clock, BookOpen, Users, FileText, Download, Brain, Target } from 'lucide-react';
import { groupByWeek, formatWeekRange, formatDateAU } from '../../lib/dateUtils';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('weekly');
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [reportDates, setReportDates] = useState({ start: '', end: '' });
  const [reportType, setReportType] = useState('practice'); // 'practice', 'cpd', 'competency'
  
  // Logbook data
  const [logbookYears, setLogbookYears] = useState([]);
  const [logbookEntries, setLogbookEntries] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(null);
  
  // CPD data
  const [cpdActivities, setCpdActivities] = useState([]);
  const [peerConsultations, setPeerConsultations] = useState([]);
  const [learningPlans, setLearningPlans] = useState([]);
  
  // Competency data
  const [competencyEntries, setCompetencyEntries] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logYearsResp, logEntriesResp, cpdResp, consultResp, plansResp, competencyResp] = await Promise.all([
          logbookAPI.getYears(),
          logbookAPI.getEntries(),
          cpdAPI.getActivities(),
          cpdAPI.getConsultations(),
          cpdAPI.getPlans(user?.id),
          competenciesAPI.getJournals(user?.id)
        ]);
        
        setLogbookYears(logYearsResp.data);
        setLogbookEntries(logEntriesResp.data);
        setCpdActivities(cpdResp.data || []);
        setPeerConsultations(consultResp.data || []);
        setLearningPlans(plansResp.data || []);
        setCompetencyEntries(competencyResp.data || []);
        
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
  }, [user?.id]);

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

  // Initialize report dates when dialog opens
  const handleOpenDownloadDialog = () => {
    if (selectedYear) {
      setReportDates({
        start: selectedYear.start_date,
        end: selectedYear.end_date
      });
    }
    setDownloadDialogOpen(true);
  };

  // Generate PDF Report
  const generatePDFReport = () => {
    const startDate = new Date(reportDates.start);
    const endDate = new Date(reportDates.end);
    
    // Filter data by date range
    const filteredLogbook = logbookEntries.filter(e => {
      const d = new Date(e.date);
      return d >= startDate && d <= endDate;
    });
    const filteredCpd = cpdActivities.filter(a => {
      const d = new Date(a.date);
      return d >= startDate && d <= endDate;
    });
    const filteredPeer = peerConsultations.filter(c => {
      const d = new Date(c.date);
      return d >= startDate && d <= endDate;
    });

    // Calculate totals for filtered data
    const reportTotals = {
      directClient: filteredLogbook.filter(e => e.activity_type === 'Direct Client Contact').reduce((s, e) => s + e.duration, 0),
      supervisionPrimary: filteredLogbook.filter(e => e.activity_type === 'Supervision - Individual (Primary)').reduce((s, e) => s + e.duration, 0),
      supervisionSecondary: filteredLogbook.filter(e => e.activity_type?.startsWith('Supervision - Individual (Secondary')).reduce((s, e) => s + e.duration, 0),
      supervisionGroup: filteredLogbook.filter(e => e.activity_type === 'Supervision - Group').reduce((s, e) => s + e.duration, 0),
      other: filteredLogbook.filter(e => e.activity_type === 'Other').reduce((s, e) => s + e.duration, 0),
      cpd: filteredCpd.reduce((s, a) => s + (a.hours || 0), 0),
      peer: filteredPeer.reduce((s, c) => s + ((c.minutes_spent || 0) / 60), 0)
    };
    reportTotals.supervisionTotal = reportTotals.supervisionPrimary + reportTotals.supervisionSecondary + reportTotals.supervisionGroup;
    reportTotals.total = reportTotals.directClient + reportTotals.supervisionTotal + reportTotals.other + reportTotals.cpd + reportTotals.peer;

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(51, 51, 51);
    doc.text('Practice Summary Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`${user?.name || 'Psychologist'}`, pageWidth / 2, 28, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Period: ${formatDateAU(startDate)} - ${formatDateAU(endDate)}`, pageWidth / 2, 35, { align: 'center' });
    doc.text(`Generated: ${formatDateAU(new Date())}`, pageWidth / 2, 41, { align: 'center' });

    // Summary Table
    doc.setFontSize(14);
    doc.setTextColor(51, 51, 51);
    doc.text('Hours Summary', 14, 55);

    autoTable(doc, {
      startY: 60,
      head: [['Category', 'Hours', '% of Total']],
      body: [
        ['Direct Client Contact', reportTotals.directClient.toFixed(1), reportTotals.total > 0 ? ((reportTotals.directClient / reportTotals.total) * 100).toFixed(1) + '%' : '0%'],
        ['Supervision - Individual (Primary)', reportTotals.supervisionPrimary.toFixed(1), reportTotals.total > 0 ? ((reportTotals.supervisionPrimary / reportTotals.total) * 100).toFixed(1) + '%' : '0%'],
        ['Supervision - Individual (Secondary)', reportTotals.supervisionSecondary.toFixed(1), reportTotals.total > 0 ? ((reportTotals.supervisionSecondary / reportTotals.total) * 100).toFixed(1) + '%' : '0%'],
        ['Supervision - Group', reportTotals.supervisionGroup.toFixed(1), reportTotals.total > 0 ? ((reportTotals.supervisionGroup / reportTotals.total) * 100).toFixed(1) + '%' : '0%'],
        ['Other Practice', reportTotals.other.toFixed(1), reportTotals.total > 0 ? ((reportTotals.other / reportTotals.total) * 100).toFixed(1) + '%' : '0%'],
        ['CPD Activities', reportTotals.cpd.toFixed(1), reportTotals.total > 0 ? ((reportTotals.cpd / reportTotals.total) * 100).toFixed(1) + '%' : '0%'],
        ['Peer Consultations', reportTotals.peer.toFixed(1), reportTotals.total > 0 ? ((reportTotals.peer / reportTotals.total) * 100).toFixed(1) + '%' : '0%'],
      ],
      foot: [['TOTAL', reportTotals.total.toFixed(1), '100%']],
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      footStyles: { fillColor: [240, 240, 240], textColor: [51, 51, 51], fontStyle: 'bold' },
      styles: { fontSize: 10 },
    });

    let lastY = doc.lastAutoTable.finalY + 10;

    // Supervision Breakdown if any supervision hours
    if (reportTotals.supervisionTotal > 0) {
      doc.setFontSize(14);
      doc.text('Supervision Breakdown', 14, lastY);

      const totalIndividual = reportTotals.supervisionPrimary + reportTotals.supervisionSecondary;
      autoTable(doc, {
        startY: lastY + 5,
        head: [['Type', 'Hours', '% of Individual Supervision']],
        body: [
          ['Primary Supervisor', reportTotals.supervisionPrimary.toFixed(1), totalIndividual > 0 ? ((reportTotals.supervisionPrimary / totalIndividual) * 100).toFixed(1) + '%' : 'N/A'],
          ['Secondary Supervisor(s)', reportTotals.supervisionSecondary.toFixed(1), totalIndividual > 0 ? ((reportTotals.supervisionSecondary / totalIndividual) * 100).toFixed(1) + '%' : 'N/A'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [20, 184, 166], textColor: 255 },
        styles: { fontSize: 10 },
      });
      lastY = doc.lastAutoTable.finalY + 10;
    }

    // Targets comparison if available
    if (selectedYear && targets.total > 0) {
      doc.setFontSize(14);
      doc.text('Progress Against Targets', 14, lastY);

      autoTable(doc, {
        startY: lastY + 5,
        head: [['Category', 'Current', 'Target', 'Progress']],
        body: [
          ['Total Hours', reportTotals.total.toFixed(1), targets.total.toFixed(1), ((reportTotals.total / targets.total) * 100).toFixed(1) + '%'],
          ['Direct Client Contact', reportTotals.directClient.toFixed(1), targets.practice.toFixed(1), targets.practice > 0 ? ((reportTotals.directClient / targets.practice) * 100).toFixed(1) + '%' : 'N/A'],
          ['Supervision (Total)', reportTotals.supervisionTotal.toFixed(1), targets.supervision.toFixed(1), targets.supervision > 0 ? ((reportTotals.supervisionTotal / targets.supervision) * 100).toFixed(1) + '%' : 'N/A'],
          ['CPD', reportTotals.cpd.toFixed(1), targets.cpd.toFixed(1), targets.cpd > 0 ? ((reportTotals.cpd / targets.cpd) * 100).toFixed(1) + '%' : 'N/A'],
          ['Peer Consultations', reportTotals.peer.toFixed(1), targets.peer.toFixed(1), targets.peer > 0 ? ((reportTotals.peer / targets.peer) * 100).toFixed(1) + '%' : 'N/A'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 10 },
      });
    }

    // Activity Log (ALL entries)
    if (filteredLogbook.length > 0 || filteredCpd.length > 0 || filteredPeer.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Activity Log', 14, 20);

      const activityData = [
        ...filteredLogbook.map(e => [
          formatDateAU(e.date),
          e.activity_type,
          e.duration.toFixed(1) + 'h',
          (e.notes || '').substring(0, 50) + (e.notes?.length > 50 ? '...' : '')
        ]),
        ...filteredCpd.map(a => [
          formatDateAU(a.date),
          'CPD: ' + a.activity_type,
          (a.hours || 0).toFixed(1) + 'h',
          (a.description || '').substring(0, 50) + (a.description?.length > 50 ? '...' : '')
        ]),
        ...filteredPeer.map(p => [
          formatDateAU(p.date),
          'Peer Consultation',
          ((p.minutes_spent || 0) / 60).toFixed(1) + 'h',
          (p.activity_description || '').substring(0, 50) + (p.activity_description?.length > 50 ? '...' : '')
        ])
      ].sort((a, b) => {
        // Parse DD/MM/YYYY format for sorting
        const [dayA, monthA, yearA] = a[0].split('/');
        const [dayB, monthB, yearB] = b[0].split('/');
        return new Date(yearB, monthB - 1, dayB) - new Date(yearA, monthA - 1, dayA);
      });

      autoTable(doc, {
        startY: 25,
        head: [['Date', 'Activity Type', 'Duration', 'Notes']],
        body: activityData, // Show ALL entries
        theme: 'striped',
        headStyles: { fillColor: [107, 114, 128], textColor: 255 },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 50 },
          2: { cellWidth: 20 },
          3: { cellWidth: 'auto' }
        }
      });

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Total entries: ${activityData.length}`, 14, doc.lastAutoTable.finalY + 5);
    }

    // Save PDF
    const fileName = `Practice_Summary_${reportDates.start}_to_${reportDates.end}.pdf`;
    doc.save(fileName);
    setDownloadDialogOpen(false);
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
          <div className="flex flex-col gap-3">
            {/* Title row */}
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-neutral-dark flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  All Practice Summary
                </CardTitle>
                <p className="text-xs text-neutral-light mt-1 hidden sm:block">Practice Logbook + CPD Activities + Peer Consultations</p>
              </div>
              
              {/* PDF Download button */}
              <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 min-w-[44px] text-xs"
                    onClick={handleOpenDownloadDialog}
                    data-testid="pdf-report-btn"
                  >
                    <Download className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">PDF Report</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Download Practice Summary Report</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <p className="text-sm text-neutral-light">
                      Generate a PDF report summarizing all practice hours for the selected date range.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date</Label>
                        <Input 
                          type="date" 
                          value={reportDates.start}
                          onChange={(e) => setReportDates({...reportDates, start: e.target.value})}
                          className="h-11"
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input 
                          type="date" 
                          value={reportDates.end}
                          onChange={(e) => setReportDates({...reportDates, end: e.target.value})}
                          className="h-11"
                        />
                      </div>
                    </div>
                    <div className="bg-primary-light border border-primary rounded-lg p-3">
                      <p className="text-xs text-neutral-dark">
                        <strong>Report includes:</strong> Hours summary, supervision breakdown, progress against targets, and activity log.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        className="btn-primary flex-1 h-11"
                        onClick={generatePDFReport}
                        disabled={!reportDates.start || !reportDates.end}
                        data-testid="download-pdf-btn"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                      <Button variant="outline" onClick={() => setDownloadDialogOpen(false)} className="h-11">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* View Mode - Mobile: Select, Desktop: Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Mobile: Select dropdown for view mode */}
              <div className="sm:hidden">
                <Select value={viewMode} onValueChange={setViewMode}>
                  <SelectTrigger className="h-10 w-full" data-testid="view-mode-mobile">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly View</SelectItem>
                    <SelectItem value="monthly">Monthly View</SelectItem>
                    <SelectItem value="all">All Entries</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Desktop: Tabs */}
              <div className="hidden sm:block">
                <Tabs value={viewMode} onValueChange={setViewMode}>
                  <TabsList className="h-9">
                    <TabsTrigger value="weekly" className="text-xs px-4 h-8" data-testid="view-weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly" className="text-xs px-4 h-8" data-testid="view-monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="all" className="text-xs px-4 h-8" data-testid="view-all">All</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {/* Period Selector */}
              {logbookYears.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-neutral-light hidden sm:inline">Period:</span>
                  <Select value={selectedYearId || ''} onValueChange={setSelectedYearId}>
                    <SelectTrigger className="h-10 sm:h-8 w-full sm:w-auto sm:min-w-[220px] text-xs" data-testid="period-selector">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      {logbookYears.map(year => (
                        <SelectItem key={year.id} value={year.id} className="text-xs">
                          {year.year_name || year.year} ({formatDateAU(year.start_date)} - {formatDateAU(year.end_date)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
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
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 p-3 sm:p-4 border-b border-neutral bg-neutral/30">
        {/* Total */}
        <div className="text-center p-2 col-span-3 sm:col-span-1 bg-white/50 rounded-lg">
          <p className="text-xs text-neutral-light mb-0.5">Total Hours</p>
          <p className="text-2xl sm:text-lg font-bold text-neutral-dark">{totals.all.toFixed(1)}h</p>
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
            <p className="text-xs text-neutral-light truncate">Direct Client</p>
          </div>
          <p className="text-base sm:text-lg font-bold text-blue-600">{totals.practice.toFixed(1)}h</p>
          {targets.practice > 0 && (
            <>
              <p className="text-xs text-neutral-light hidden sm:block">{percentages.practice.toFixed(0)}% of {targets.practice.toFixed(1)}h</p>
              <p className="text-xs text-neutral-light sm:hidden">{percentages.practice.toFixed(0)}%</p>
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
          <p className="text-base sm:text-lg font-bold text-teal-600">{totals.supervision.toFixed(1)}h</p>
          {targets.supervision > 0 && (
            <>
              <p className="text-xs text-neutral-light hidden sm:block">{percentages.supervision.toFixed(0)}% of {targets.supervision.toFixed(1)}h</p>
              <p className="text-xs text-neutral-light sm:hidden">{percentages.supervision.toFixed(0)}%</p>
              <ProgressBar percentage={percentages.supervision} color="bg-teal-500" />
            </>
          )}
          {totalIndividualSupervision > 0 && (
            <p className="text-xs text-neutral-light mt-1 hidden sm:block">
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
          <p className="text-base sm:text-lg font-bold text-green-600">{totals.cpd.toFixed(1)}h</p>
          {targets.cpd > 0 && (
            <>
              <p className="text-xs text-neutral-light hidden sm:block">{percentages.cpd.toFixed(0)}% of {targets.cpd.toFixed(1)}h</p>
              <p className="text-xs text-neutral-light sm:hidden">{percentages.cpd.toFixed(0)}%</p>
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
          <p className="text-base sm:text-lg font-bold text-purple-600">{totals.peer.toFixed(1)}h</p>
          {targets.peer > 0 && (
            <>
              <p className="text-xs text-neutral-light hidden sm:block">{percentages.peer.toFixed(0)}% of {targets.peer.toFixed(1)}h</p>
              <p className="text-xs text-neutral-light sm:hidden">{percentages.peer.toFixed(0)}%</p>
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
                        <div className="space-y-3 px-4 pb-3">
                          {weekItems.map(item => {
                            const Icon = item.icon;
                            return (
                              <div key={item.id} className={`rounded-xl p-4 border shadow-sm ${item.bgColor} ${item.borderColor}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Icon className="w-4 h-4 flex-shrink-0" />
                                      <span className={`text-xs font-semibold px-2 py-1 rounded-md ${item.badgeColor}`}>
                                        {item.category}
                                      </span>
                                    </div>
                                    {item.description && (
                                      <p className="text-sm text-neutral-dark mb-2 leading-relaxed line-clamp-2">{item.description}</p>
                                    )}
                                    <p className="text-xs text-neutral-light font-medium">{formatDateAU(item.date)}</p>
                                  </div>
                                  <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${item.badgeColor} min-w-[55px] text-center flex-shrink-0`}>
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
                        <div className="space-y-3 px-4 pb-3">
                          {monthItems.map(item => {
                            const Icon = item.icon;
                            return (
                              <div key={item.id} className={`rounded-xl p-4 border shadow-sm ${item.bgColor} ${item.borderColor}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Icon className="w-4 h-4 flex-shrink-0" />
                                      <span className={`text-xs font-semibold px-2 py-1 rounded-md ${item.badgeColor}`}>
                                        {item.category}
                                      </span>
                                    </div>
                                    {item.description && (
                                      <p className="text-sm text-neutral-dark mb-2 leading-relaxed line-clamp-2">{item.description}</p>
                                    )}
                                    <p className="text-xs text-neutral-light font-medium">{formatDateAU(item.date)}</p>
                                  </div>
                                  <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${item.badgeColor} min-w-[55px] text-center flex-shrink-0`}>
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
              <div className="space-y-3 p-4 max-h-96 overflow-y-auto">
                {allPracticeItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className={`rounded-xl p-4 border shadow-sm ${item.bgColor} ${item.borderColor}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className={`text-xs font-semibold px-2 py-1 rounded-md ${item.badgeColor}`}>
                              {item.category}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-neutral-dark mb-2 leading-relaxed line-clamp-2">{item.description}</p>
                          )}
                          <p className="text-xs text-neutral-light font-medium">{formatDateAU(item.date)}</p>
                        </div>
                        <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${item.badgeColor} min-w-[55px] text-center flex-shrink-0`}>
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
