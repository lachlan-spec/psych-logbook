import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import PortalNav from '../dashboard/PortalNav';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { logbookAPI } from "../../services/api";
import { toast } from "sonner";
import { groupByWeek, formatWeekRange, getCurrentYearId } from "../../lib/dateUtils";
import { Download, Plus, CalendarDays, Edit, Trash2, Settings, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";

export default function LogbookSummary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [years, setYears] = useState([]);
  const [entries, setEntries] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [viewMode, setViewMode] = useState("weekly"); // "weekly", "monthly", "total"
  const [stats, setStats] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const sigCanvas = React.useRef();
  const [formData, setFormData] = useState({
    logbook_id: "",
    date: new Date().toISOString().split("T")[0],
    minutes: "",
    activity_type: "Direct Client Contact",
    notes: "",
    reflections: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (years.length > 0 && !selectedYearId) {
      const current = getCurrentYearId(years) || years[0].id;
      setSelectedYearId(current);
    }
  }, [years]);

  const loadData = async () => {
    try {
      const [yearsResp, entriesResp] = await Promise.all([
        logbookAPI.getYears(),
        logbookAPI.getEntries()
      ]);
      setYears(yearsResp.data);
      setEntries(entriesResp.data);
      if (yearsResp.data.length > 0) {
        const yearId = yearsResp.data[0].id;
        const sigsResp = await logbookAPI.getSignatures(yearId);
        setSignatures(sigsResp.data);
      }
    } catch (error) {
      toast.error("Failed to load logbook");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (yearId) => {
    if (!yearId) return;
    try {
      const response = await logbookAPI.getStats(yearId);
      setStats(response.data);
    } catch (error) {
      toast.error("Failed to load statistics");
    }
  };

  useEffect(() => {
    if (selectedYearId) {
      loadStats(selectedYearId);
    }
  }, [selectedYearId]);

  const handleCreateYear = async () => {
    const year = prompt("Enter year (e.g., 2025):");
    if (!year) return;
    try {
      await logbookAPI.createYear({
        year,
        start_date: `${year}-01-01`,
        end_date: `${year}-12-31`
      });
      loadData();
      toast.success("Year created");
    } catch (error) {
      toast.error("Failed to create year");
    }
  };

  const handleOpenAddDialog = () => {
    setEditingEntry(null);
    setFormData({
      logbook_id: "",
      date: new Date().toISOString().split("T")[0],
      minutes: "",
      activity_type: "Direct Client Contact",
      notes: "",
      reflections: ""
    });
    setEntryDialogOpen(true);
  };

  const handleOpenEditDialog = (entry) => {
    setEditingEntry(entry);
    setFormData({
      logbook_id: entry.logbook_id,
      date: entry.date,
      minutes: String(Math.round(entry.duration * 60)),
      activity_type: entry.activity_type,
      notes: entry.notes,
      reflections: entry.reflections || ""
    });
    setEntryDialogOpen(true);
  };

  const handleSaveEntry = async () => {
    if (!formData.minutes || !formData.notes) {
      toast.error("Please fill required fields");
      return;
    }
    try {
      const duration = parseFloat(formData.minutes) / 60;
      if (editingEntry) {
        await logbookAPI.updateEntry(editingEntry.id, { ...formData, duration });
        toast.success("Entry updated");
      } else {
        await logbookAPI.createEntry({ ...formData, duration, logbook_id: selectedYearId });
        toast.success("Entry added");
      }
      setEntryDialogOpen(false);
      setEditingEntry(null);
      loadData();
    } catch (error) {
      toast.error(editingEntry ? "Failed to update entry" : "Failed to add entry");
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await logbookAPI.deleteEntry(entryId);
      toast.success("Entry deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete entry");
    }
  };

  const handleSign = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      toast.error("Please provide signature");
      return;
    }
    try {
      const signatureData = sigCanvas.current.toDataURL();
      await logbookAPI.createSignature({
        logbook_id: selectedYearId,
        signature_data: signatureData,
        week_start: selectedWeek
      });
      toast.success("Week signed");
      setSignatureDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error("Failed to sign");
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await logbookAPI.exportPDF(selectedYearId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `logbook_${selectedYearId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF downloaded");
    } catch (error) {
      toast.error("Failed to export PDF");
    }
  };

  const yearEntries = entries.filter(e => e.logbook_id === selectedYearId);
  const weeklyData = groupByWeek(yearEntries);
  const totalHours = yearEntries.reduce((sum, e) => sum + e.duration, 0);

  // Group entries by month
  const groupByMonth = (entries) => {
    const grouped = {};
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(entry);
    });
    return grouped;
  };

  const monthlyData = groupByMonth(yearEntries);

  const formatMonthRange = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

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
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-1">Practice Logbook</h1>
            <p className="text-xs sm:text-sm text-slate-500">Track your supervised practice hours</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/logbook/settings')} variant="ghost" size="sm" className="h-8 px-3 text-xs text-slate-600 hover:bg-slate-100">
              <Settings className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={handleOpenAddDialog} className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm" data-testid="add-entry-button">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingEntry ? "Edit Logbook Entry" : "Add Logbook Entry"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div>
                    <Label>Activity Type</Label>
                    <Select value={formData.activity_type} onValueChange={v => setFormData({...formData, activity_type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Direct Client Contact">Direct Client Contact</SelectItem>
                        <SelectItem value="Supervision">Supervision</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                        <SelectItem value="CPD">CPD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input 
                      type="number" 
                      min="1"
                      step="1" 
                      value={formData.minutes} 
                      onChange={e => setFormData({...formData, minutes: e.target.value})} 
                      placeholder="e.g., 60 for 1 hour"
                    />
                    {formData.minutes && (
                      <p className="text-xs text-gray-500 mt-1">= {(parseFloat(formData.minutes) / 60).toFixed(2)} hours</p>
                    )}
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} />
                  </div>
                  <div>
                    <Label>Reflections (optional)</Label>
                    <Textarea value={formData.reflections} onChange={e => setFormData({...formData, reflections: e.target.value})} rows={2} />
                  </div>
                  <Button onClick={handleSaveEntry} className="w-full btn-primary">{editingEntry ? "Update Entry" : "Add Entry"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
                <Select value={selectedYearId || ""} onValueChange={setSelectedYearId}>
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

            {stats && (
              <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-sm mb-4">
                <CardHeader className="p-4 border-b border-slate-100">
                  <CardTitle className="text-sm font-semibold text-slate-800">Hours by Category</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {(() => {
                    const currentYear = years.find(y => y.id === selectedYearId);
                    const categories = [
                      { label: "Direct Client Contact", key: "Direct Client Contact", targetKey: "target_direct_client", color: "bg-blue-500" },
                      { label: "Supervision", key: "Supervision", targetKey: "target_supervision", color: "bg-green-500" },
                      { label: "Other", key: "Other", targetKey: "target_other", color: "bg-purple-500" },
                      { label: "CPD", key: "CPD", targetKey: "target_cpd", color: "bg-orange-500" }
                    ];
                    
                    return categories.map(({ label, key, targetKey, color }) => {
                      const current = stats[key] || 0;
                      const target = currentYear?.[targetKey] || 0;
                      const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
                      
                      return (
                        <div key={key}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-medium text-slate-600">{label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-800">{current}h</span>
                              {target > 0 && (
                                <>
                                  <span className="text-xs text-slate-400">/ {target}h</span>
                                  <span className="text-xs font-semibold text-blue-600">({percentage.toFixed(0)}%)</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div
                              className={`${color} h-1.5 rounded-full transition-all duration-500`}
                              style={{ width: `${target > 0 ? percentage : (stats.total > 0 ? (current / stats.total) * 100 : 0)}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </CardContent>
              </Card>
            )}

            <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-sm">
              <CardHeader className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-slate-800">Practice Log</CardTitle>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setViewMode("weekly")}
                      className={`h-7 px-2.5 text-xs ${viewMode === "weekly" ? 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 hover:from-blue-200 hover:to-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      Week
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setViewMode("monthly")}
                      className={`h-7 px-2.5 text-xs ${viewMode === "monthly" ? 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 hover:from-blue-200 hover:to-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      Month
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setViewMode("total")}
                      className={`h-7 px-2.5 text-xs ${viewMode === "total" ? 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 hover:from-blue-200 hover:to-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {yearEntries.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-slate-400">No entries yet</p>
                  </div>
                ) : (
                  <>
                    {viewMode === "weekly" && (
                      <Accordion type="single" collapsible>
                        {Object.keys(weeklyData).sort().reverse().map(weekStart => {
                          const weekEntries = weeklyData[weekStart];
                          const weekTotal = weekEntries.reduce((sum, e) => sum + e.duration, 0);
                          const isSigned = signatures.some(s => s.week_start === weekStart);
                          return (
                            <AccordionItem key={weekStart} value={weekStart} className="border-b border-slate-100 last:border-0">
                              <AccordionTrigger className="hover:bg-slate-50/50 px-4 py-3 transition-all">
                                <div className="flex items-center justify-between w-full pr-3">
                                  <span className="text-sm font-medium text-slate-700">{formatWeekRange(weekStart)}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">{weekTotal}h</span>
                                    {isSigned && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ Signed</span>}
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-2 px-4 pb-3">
                                  {weekEntries.map(entry => (
                                    <div key={entry.id} className="bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm text-slate-800 mb-1">{entry.activity_type}</p>
                                          <p className="text-xs text-slate-600 mb-1">{entry.notes}</p>
                                          <p className="text-xs text-slate-400">{entry.date}</p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-3">
                                          <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{entry.duration}h</span>
                                          <Button size="sm" variant="ghost" onClick={() => handleOpenEditDialog(entry)} className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600">
                                            <Edit className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button size="sm" variant="ghost" onClick={() => handleDeleteEntry(entry.id)} className="h-7 w-7 p-0 hover:bg-red-50 text-slate-600 hover:text-red-600">
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      {entry.supervisor_comment && (
                                        <div className="mt-2 p-2 bg-green-50/50 border border-green-200/50 rounded">
                                          <div className="flex items-start gap-2">
                                            <MessageSquare className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-medium text-green-900 mb-0.5">Supervisor Feedback</p>
                                              <p className="text-xs text-slate-700">{entry.supervisor_comment}</p>
                                              {entry.supervisor_comment_date && (
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                  {new Date(entry.supervisor_comment_date).toLocaleDateString()}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {!isSigned && (
                                    <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
                                      <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedWeek(weekStart)} className="h-7 px-2.5 text-xs text-slate-600 hover:bg-slate-100">Sign Week</Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Sign Week</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <p className="text-sm text-gray-600">Sign to confirm the accuracy of your logged hours for this week</p>
                                          <div className="border-2 border-dashed border-gray-300 rounded-lg">
                                            <SignatureCanvas ref={sigCanvas} canvasProps={{ width: 500, height: 200, className: "signature-canvas w-full" }} />
                                          </div>
                                          <div className="flex gap-2">
                                            <Button onClick={() => sigCanvas.current?.clear()} variant="outline">Clear</Button>
                                            <Button onClick={handleSign} className="flex-1 btn-primary">Sign Week</Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}

                    {viewMode === "monthly" && (
                      <Accordion type="single" collapsible>
                        {Object.keys(monthlyData).sort().reverse().map(monthKey => {
                          const monthEntries = monthlyData[monthKey];
                          const monthTotal = monthEntries.reduce((sum, e) => sum + e.duration, 0);
                          return (
                            <AccordionItem key={monthKey} value={monthKey} className="border-b border-slate-100 last:border-0">
                              <AccordionTrigger className="hover:bg-slate-50/50 px-4 py-3 transition-all">
                                <div className="flex items-center justify-between w-full pr-3">
                                  <span className="text-sm font-medium text-slate-700">{formatMonthRange(monthKey)}</span>
                                  <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">{monthTotal}h</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-2 px-4 pb-3">
                                  {monthEntries.map(entry => (
                                    <div key={entry.id} className="bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm text-slate-800 mb-1">{entry.activity_type}</p>
                                          <p className="text-xs text-slate-600 mb-1">{entry.notes}</p>
                                          <p className="text-xs text-slate-400">{entry.date}</p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-3">
                                          <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{entry.duration}h</span>
                                          <Button size="sm" variant="ghost" onClick={() => handleOpenEditDialog(entry)} className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600">
                                            <Edit className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button size="sm" variant="ghost" onClick={() => handleDeleteEntry(entry.id)} className="h-7 w-7 p-0 hover:bg-red-50 text-slate-600 hover:text-red-600">
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                      {entry.supervisor_comment && (
                                        <div className="mt-2 p-2 bg-green-50/50 border border-green-200/50 rounded">
                                          <div className="flex items-start gap-2">
                                            <MessageSquare className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-medium text-green-900 mb-0.5">Supervisor Feedback</p>
                                              <p className="text-xs text-slate-700">{entry.supervisor_comment}</p>
                                              {entry.supervisor_comment_date && (
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                  {new Date(entry.supervisor_comment_date).toLocaleDateString()}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}

                    {viewMode === "total" && (
                      <Accordion type="single" collapsible>
                        <AccordionItem value="total" className="border-b border-slate-100 last:border-0">
                          <AccordionTrigger className="hover:bg-slate-50/50 px-4 py-3 transition-all">
                            <div className="flex items-center justify-between w-full pr-3">
                              <span className="text-sm font-medium text-slate-700">All Entries</span>
                              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">{totalHours.toFixed(1)}h</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 px-4 pb-3">
                              {yearEntries.sort((a, b) => new Date(b.date) - new Date(a.date)).map(entry => (
                                <div key={entry.id} className="bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm text-slate-800 mb-1">{entry.activity_type}</p>
                                      <p className="text-xs text-slate-600 mb-1">{entry.notes}</p>
                                      <p className="text-xs text-slate-400">{entry.date}</p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-3">
                                      <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{entry.duration}h</span>
                                      <Button size="sm" variant="ghost" onClick={() => handleOpenEditDialog(entry)} className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600">
                                        <Edit className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => handleDeleteEntry(entry.id)} className="h-7 w-7 p-0 hover:bg-red-50 text-slate-600 hover:text-red-600">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                  {entry.supervisor_comment && (
                                    <div className="mt-2 p-2 bg-green-50/50 border border-green-200/50 rounded">
                                      <div className="flex items-start gap-2">
                                        <MessageSquare className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-green-900 mb-0.5">Supervisor Feedback</p>
                                          <p className="text-xs text-slate-700">{entry.supervisor_comment}</p>
                                          {entry.supervisor_comment_date && (
                                            <p className="text-xs text-slate-400 mt-0.5">
                                              {new Date(entry.supervisor_comment_date).toLocaleDateString()}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
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
          </>
        )}
      </div>
    </div>
  );
}
