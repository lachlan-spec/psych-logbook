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

  useEffect(() => {
    loadJournals();
  }, []);

  const loadJournals = async () => {
    try {
      const response = await competenciesAPI.getJournals();
      setJournals(response.data);
    } catch (error) {
      toast.error('Failed to load journals');
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <PortalNav />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard" className="flex items-center gap-1">
                  <Home className="w-4 h-4" />
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
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-1">Competency Journals</h1>
            <p className="text-xs sm:text-sm text-slate-500">Reflect on your professional growth</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleOpenAddDialog} className="h-8 px-3 text-xs bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 hover:from-purple-200 hover:to-violet-200 border border-purple-200">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
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
          <Card className="border-blue-200/50 bg-gradient-to-br from-blue-50 to-indigo-50 mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Clinical Psychology Competencies</h2>
                    <p className="text-sm text-slate-600">8 Core Competence Areas for Endorsement</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowIntro(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ✕
                </Button>
              </div>
              <div className="text-sm text-slate-700 leading-relaxed space-y-3">
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
              className="border-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer"
              onClick={() => {
                setSelectedCompetency(comp);
                setDetailDialogOpen(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br from-${comp.color}-100 to-${comp.color}-200 rounded-xl flex items-center justify-center`}>
                    <Award className="w-6 h-6" style={{ color: comp.progressColor }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-1 leading-tight">{comp.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{getCompetencyCount(comp.id)} entries</span>
                      <Info className="w-4 h-4 text-slate-400" />
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
                      <p className="text-sm text-slate-600">{getCompetencyCount(selectedCompetency.id)} journal entries</p>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-900 mb-3">Competency Requirements:</h4>
                    <ul className="space-y-2">
                      {COMPETENCY_DETAILS[selectedCompetency.id]?.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button 
                    onClick={() => {
                      setDetailDialogOpen(false);
                      setFormData({...formData, competency_id: selectedCompetency.id});
                      setDialogOpen(true);
                    }}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    New Entry for {selectedCompetency.name}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {journals.length > 0 && (
          <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-800">Recent Journal Entries</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {journals.sort((a, b) => new Date(b.date) - new Date(a.date)).map(journal => {
                  const comp = COMPETENCIES.find(c => c.id === journal.competency_id);
                  return (
                    <div key={journal.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-gradient-to-br from-${comp.color}-100 to-${comp.color}-200`} style={{ color: comp.progressColor }}>
                              {comp.name}
                            </span>
                            <span className="text-xs text-slate-400">{journal.date}</span>
                          </div>
                          <p className="text-xs text-slate-600 whitespace-pre-wrap">{journal.entry}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <Button size="sm" variant="ghost" onClick={() => handleOpenEditDialog(journal)} className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteJournal(journal.id)} className="h-7 w-7 p-0 hover:bg-red-50 text-slate-600 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      {journal.supervisor_comment && (
                        <div className="mt-2 p-2 bg-green-50/50 border border-green-200/50 rounded">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-green-900 mb-0.5">Supervisor Feedback</p>
                              <p className="text-xs text-slate-700">{journal.supervisor_comment}</p>
                              {journal.supervisor_comment_date && (
                                <p className="text-xs text-slate-400 mt-0.5">
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
