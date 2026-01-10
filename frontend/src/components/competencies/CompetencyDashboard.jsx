import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PortalNav from '../dashboard/PortalNav';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '../ui/breadcrumb';
import { competenciesAPI } from '../../services/api';
import { toast } from 'sonner';
import { Award, Plus, MessageSquare, Edit, Trash2, Info, BookOpen, Home } from 'lucide-react';
import { COMPETENCIES } from '../../lib/constants';
import { COMPETENCY_INTRO, COMPETENCY_DETAILS } from '../../lib/competencyDescriptions';

export default function CompetencyDashboard() {
  const navigate = useNavigate();
  const [journals, setJournals] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCompetency, setSelectedCompetency] = useState(null);
  const [editingJournal, setEditingJournal] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const [formData, setFormData] = useState({
    competency_id: '',
    entry: '',
    date: new Date().toISOString().split('T')[0]
  });

  const loadJournals = async () => {
    try {
      const response = await competenciesAPI.getJournals();
      setJournals(response.data);
    } catch (error) {
      toast.error('Failed to load journals');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await competenciesAPI.getJournals();
        setJournals(response.data);
      } catch (error) {
        toast.error('Failed to load journals');
      }
    };
    fetchData();
  }, []);

  const handleOpenAddDialog = () => {
    setEditingJournal(null);
    setFormData({
      competency_id: '0',
      entry: '',
      date: new Date().toISOString().split('T')[0]
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (journal) => {
    setEditingJournal(journal);
    setFormData({
      competency_id: journal.competency_id,
      entry: journal.entry,
      date: journal.date
    });
    setDialogOpen(true);
  };

  const handleSaveJournal = async () => {
    if (!formData.entry) {
      toast.error('Please add entry text');
      return;
    }
    try {
      if (editingJournal) {
        await competenciesAPI.updateJournal(editingJournal.id, formData);
        toast.success('Journal entry updated');
      } else {
        await competenciesAPI.createJournal(formData);
        toast.success('Journal entry added');
      }
      setDialogOpen(false);
      setEditingJournal(null);
      loadJournals();
    } catch (error) {
      toast.error(editingJournal ? 'Failed to update journal' : 'Failed to add journal');
    }
  };

  const handleDeleteJournal = async (journalId) => {
    if (!confirm("Delete this journal entry?")) return;
    try {
      await competenciesAPI.deleteJournal(journalId);
      toast.success("Journal entry deleted");
      loadJournals();
    } catch (error) {
      toast.error("Failed to delete journal");
    }
  };

  const getCompetencyCount = (compId) => journals.filter(j => j.competency_id === compId).length;

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
              <BreadcrumbPage>Competency Journal</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-dark mb-1">Competency Journals</h1>
            <p className="text-xs sm:text-sm text-neutral-light">Reflect on your professional growth</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleOpenAddDialog} className="h-9 px-4 text-sm btn-primary">
                <Plus className="w-4 h-4 mr-1.5" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingJournal ? "Edit Competency Journal" : "Add Competency Journal"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Competency</Label>
                  <Select value={formData.competency_id} onValueChange={v => setFormData({...formData, competency_id: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPETENCIES.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <Label>Journal Entry</Label>
                  <Textarea value={formData.entry} onChange={e => setFormData({...formData, entry: e.target.value})} rows={6} placeholder="Reflect on your development in this competency area..." />
                </div>
                <Button onClick={handleSaveJournal} className="w-full btn-primary">{editingJournal ? "Update Entry" : "Add Entry"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Introduction Card */}
        {showIntro && (
          <Card className="border-primary/50 bg-gradient-primary mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="icon-md text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-dark">Clinical Psychology Competencies</h2>
                    <p className="text-sm text-neutral">8 Core Competence Areas for Endorsement</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowIntro(false)}
                  className="text-neutral-light hover:text-neutral-dark hover:bg-neutral/50 rounded-full w-8 h-8 p-0 flex items-center justify-center text-lg font-light"
                  aria-label="Dismiss"
                >
                  ×
                </Button>
              </div>
              <div className="text-sm text-neutral-dark leading-relaxed space-y-3">
                {COMPETENCY_INTRO.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Competency Cards - Clickable */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {COMPETENCIES.map(comp => (
            <Card 
              key={comp.id} 
              className="card hover:shadow-lg transition-all cursor-pointer"
              onClick={() => {
                setSelectedCompetency(comp);
                setDetailDialogOpen(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br from-${comp.color}-100 to-${comp.color}-200 rounded-xl flex items-center justify-center`}>
                    <Award className="icon-md" style={{ color: comp.progressColor }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-dark mb-1 leading-tight">{comp.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-light">{getCompetencyCount(comp.id)} entries</span>
                      <Info className="icon-sm text-neutral-light" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Competency Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedCompetency && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-14 h-14 bg-gradient-to-br from-${selectedCompetency.color}-100 to-${selectedCompetency.color}-200 rounded-xl flex items-center justify-center`}>
                      <Award className="w-7 h-7" style={{ color: selectedCompetency.progressColor }} />
                    </div>
                    <div>
                      <DialogTitle className="text-xl">{selectedCompetency.name}</DialogTitle>
                      <p className="text-sm text-neutral">{getCompetencyCount(selectedCompetency.id)} journal entries</p>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {/* Competency Requirements */}
                  <div className="bg-neutral rounded-lg p-4">
                    <h4 className="font-semibold text-neutral-dark mb-3">Competency Requirements:</h4>
                    <ul className="space-y-2">
                      {COMPETENCY_DETAILS[selectedCompetency.id]?.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-neutral">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Journal Entries for this Competency */}
                  {journals.filter(j => j.competency_id === selectedCompetency.id).length > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                      <h4 className="font-semibold text-neutral-dark mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" style={{ color: selectedCompetency.progressColor }} />
                        Your Journal Entries ({getCompetencyCount(selectedCompetency.id)})
                      </h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {journals
                          .filter(j => j.competency_id === selectedCompetency.id)
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map(journal => (
                            <div key={journal.id} className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-neutral-light mb-1">{journal.date}</p>
                                  <p className="text-sm text-neutral-dark whitespace-pre-wrap leading-relaxed">
                                    {journal.entry.length > 200 ? journal.entry.substring(0, 200) + '...' : journal.entry}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => {
                                      setDetailDialogOpen(false);
                                      handleOpenEditDialog(journal);
                                    }} 
                                    className="h-7 w-7 p-0 hover:bg-blue-100 text-neutral"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handleDeleteJournal(journal.id)} 
                                    className="h-7 w-7 p-0 hover:bg-red-100 text-neutral hover:text-red-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => {
                      setDetailDialogOpen(false);
                      setFormData({...formData, competency_id: selectedCompetency.id});
                      setDialogOpen(true);
                    }}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                  >
                    <Plus className="icon-md mr-2" />
                    New Entry for {selectedCompetency.name}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {journals.length > 0 && (
          <Card className="card shadow-sm">
            <CardHeader className="p-4 border-b border-neutral">
              <CardTitle className="text-sm font-semibold text-neutral-dark">Recent Journal Entries</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-neutral">
                {journals.sort((a, b) => new Date(b.date) - new Date(a.date)).map(journal => {
                  const comp = COMPETENCIES.find(c => c.id === journal.competency_id);
                  return (
                    <div key={journal.id} className="p-4 hover:bg-neutral/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-gradient-to-br from-${comp.color}-100 to-${comp.color}-200`} style={{ color: comp.progressColor }}>
                              {comp.name}
                            </span>
                            <span className="text-xs text-neutral-light">{journal.date}</span>
                          </div>
                          <p className="text-xs text-neutral whitespace-pre-wrap">{journal.entry}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <Button size="sm" variant="ghost" onClick={() => handleOpenEditDialog(journal)} className="h-7 w-7 p-0 hover:bg-neutral text-neutral">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteJournal(journal.id)} className="h-7 w-7 p-0 hover:bg-error text-neutral hover:text-error">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      {journal.supervisor_comment && (
                        <div className="mt-2 p-2 bg-success/50 border border-success/50 rounded">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-success mb-0.5">Supervisor Feedback</p>
                              <p className="text-xs text-neutral">{journal.supervisor_comment}</p>
                              {journal.supervisor_comment_date && (
                                <p className="text-xs text-neutral-light mt-0.5">
                                  {new Date(journal.supervisor_comment_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
