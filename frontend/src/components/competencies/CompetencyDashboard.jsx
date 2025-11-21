import React, { useState, useEffect } from 'react';
import PortalNav from '../dashboard/PortalNav';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { competenciesAPI } from '../../services/api';
import { toast } from 'sonner';
import { Award, Plus, ArrowLeft, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COMPETENCIES = [
  { id: '0', name: 'Ethical Practice', color: 'blue', iconClass: 'icon-blue', progressColor: '#2563EB' },
  { id: '1', name: 'Assessment & Formulation', color: 'green', iconClass: 'icon-green', progressColor: '#10B981' },
  { id: '2', name: 'Intervention', color: 'purple', iconClass: 'icon-purple', progressColor: '#A855F7' },
  { id: '3', name: 'Communication', color: 'amber', iconClass: 'icon-amber', progressColor: '#F59E0B' },
  { id: '4', name: 'Professional Development', color: 'red', iconClass: 'icon-red', progressColor: '#EF4444' },
  { id: '5', name: 'Research & Evaluation', color: 'indigo', iconClass: 'icon-indigo', progressColor: '#6366F1' }
];

export default function CompetencyDashboard() {
  const navigate = useNavigate();
  const [journals, setJournals] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState(null);
  const [formData, setFormData] = useState({
    competency_id: '0',
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

  const handleAddJournal = async () => {
    if (!formData.entry) {
      toast.error('Please add entry text');
      return;
    }
    try {
      await competenciesAPI.createJournal(formData);
      toast.success('Journal entry added');
      setDialogOpen(false);
      loadJournals();
      setFormData({ ...formData, entry: '' });
    } catch (error) {
      toast.error('Failed to add journal');
    }
  };

  const getCompetencyCount = (compId) => journals.filter(j => j.competency_id === compId).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4 -ml-2 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Core Competencies</h1>
            <p className="text-gray-600">Track development across 6 core areas</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Journal Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Competency Journal</DialogTitle>
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
                <Button onClick={handleAddJournal} className="w-full btn-primary">Add Entry</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COMPETENCIES.map(comp => {
            const count = getCompetencyCount(comp.id);
            return (
              <Card key={comp.id} className="stat-card cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-gray-500 mb-2">{comp.name}</p>
                      <p className="text-[36px] font-bold leading-none text-gray-900 mb-2">{count}</p>
                      <p className="text-xs text-gray-400 mt-2">Journal entries</p>
                    </div>
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${comp.iconClass}`}>
                      <Award className="w-7 h-7" style={{ color: comp.progressColor }} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="progress-bar">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((count / 10) * 100, 100)}%`, background: `linear-gradient(90deg, ${comp.progressColor} 0%, ${comp.progressColor}CC 100%)`, boxShadow: `0 1px 3px ${comp.progressColor}4D` }} />
                    </div>
                    <p className="text-xs font-medium text-gray-500 mt-2">{Math.min((count / 10) * 100, 100).toFixed(0)}% to goal</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {journals.length > 0 && (
          <Card className="glass-card mt-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Recent Journal Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {journals.slice(0, 10).map(journal => {
                  const comp = COMPETENCIES.find(c => c.id === journal.competency_id);
                  return (
                    <div key={journal.id} className="list-item-card p-4">
                      <div className="flex items-start justify-between mb-3">
                        <span className={`badge badge-${comp?.color}`}>{comp?.name}</span>
                        <span className="text-xs text-gray-400">{journal.date}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{journal.entry}</p>
                      
                      {/* Supervisor Comment */}
                      {journal.supervisor_comment && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-green-900 mb-1">Supervisor Feedback</p>
                              <p className="text-sm text-gray-700">{journal.supervisor_comment}</p>
                              {journal.supervisor_comment_date && (
                                <p className="text-xs text-gray-500 mt-1">
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
