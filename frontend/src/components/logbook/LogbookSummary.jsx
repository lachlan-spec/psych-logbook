import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../dashboard/Navbar";
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
import { Download, Plus, CalendarDays, Edit, Trash2 } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

export default function LogbookSummary() {
  const { user } = useAuth();
  const [years, setYears] = useState([]);
  const [entries, setEntries] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const sigCanvas = React.useRef();
  const [formData, setFormData] = useState({
    logbook_id: "",
    date: new Date().toISOString().split("T")[0],
    duration: "",
    activity_type: "Individual Therapy Session",
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

  const handleAddEntry = async () => {
    if (!formData.duration || !formData.notes) {
      toast.error("Please fill required fields");
      return;
    }
    try {
      await logbookAPI.createEntry({ ...formData, logbook_id: selectedYearId });
      toast.success("Entry added");
      setEntryDialogOpen(false);
      loadData();
      setFormData({ ...formData, duration: "", notes: "", reflections: "" });
    } catch (error) {
      toast.error("Failed to add entry");
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Practice Logbook</h1>
            <p className="text-gray-600">Track your supervised practice hours</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateYear} variant="outline">New Year</Button>
            <Button onClick={handleExportPDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary" data-testid="add-entry-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Logbook Entry</DialogTitle>
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
                        <SelectItem value="Individual Therapy Session">Individual Therapy Session</SelectItem>
                        <SelectItem value="Group Therapy">Group Therapy</SelectItem>
                        <SelectItem value="Assessment">Assessment</SelectItem>
                        <SelectItem value="Supervision">Supervision</SelectItem>
                        <SelectItem value="CPD">CPD</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duration (hours)</Label>
                    <Input type="number" step="0.5" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} />
                  </div>
                  <div>
                    <Label>Reflections (optional)</Label>
                    <Textarea value={formData.reflections} onChange={e => setFormData({...formData, reflections: e.target.value})} rows={2} />
                  </div>
                  <Button onClick={handleAddEntry} className="w-full btn-primary">Add Entry</Button>
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
              <div className="mb-6">
                <Select value={selectedYearId || ""} onValueChange={setSelectedYearId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y.id} value={y.id}>{y.year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Card className="stat-card mb-6">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-gray-500 mb-2">Total Hours Logged</p>
                    <p className="text-[36px] font-bold leading-none text-gray-900 mb-2">{totalHours}</p>
                    <p className="text-xs text-gray-400 mt-2">Across all activities</p>
                  </div>
                  <div className="w-14 h-14 icon-blue rounded-xl flex items-center justify-center shadow-sm">
                    <CalendarDays className="w-7 h-7 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Weekly Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(weeklyData).length === 0 ? (
                  <div className="empty-state py-8">
                    <p>No entries yet</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible>
                    {Object.keys(weeklyData).sort().reverse().map(weekStart => {
                      const weekEntries = weeklyData[weekStart];
                      const weekTotal = weekEntries.reduce((sum, e) => sum + e.duration, 0);
                      const isSigned = signatures.some(s => s.week_start === weekStart);
                      return (
                        <AccordionItem key={weekStart} value={weekStart}>
                          <AccordionTrigger>
                            <div className="flex items-center justify-between w-full pr-4">
                              <span>{formatWeekRange(weekStart)}</span>
                              <div className="flex items-center gap-4">
                                <span className="font-semibold text-blue-600">{weekTotal}h</span>
                                {isSigned && <span className="badge badge-green">Signed</span>}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pt-3">
                              {weekEntries.map(entry => (
                                <div key={entry.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <p className="font-medium">{entry.activity_type}</p>
                                    <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                                    <p className="text-xs text-gray-500 mt-1">{entry.date}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-blue-600">{entry.duration}h</span>
                                    <Button size="sm" variant="ghost" onClick={() => handleDeleteEntry(entry.id)}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {!isSigned && (
                                <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedWeek(weekStart)}>Sign Week</Button>
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
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
