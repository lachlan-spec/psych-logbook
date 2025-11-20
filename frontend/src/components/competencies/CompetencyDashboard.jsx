import React, { useState, useEffect } from 'react';
import Navbar from '../dashboard/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { competenciesAPI } from '../../services/api';
import { toast } from 'sonner';
import { Award, Plus } from 'lucide-react';

const COMPETENCIES = [
  { id: '0', name: 'Ethical Practice', color: 'blue' },
  { id: '1', name: 'Assessment & Formulation', color: 'green' },
  { id: '2', name: 'Intervention', color: 'purple' },
  { id: '3', name: 'Communication', color: 'amber' },
  { id: '4', name: 'Professional Development', color: 'red' },
  { id: '5', name: 'Research & Evaluation', color: 'indigo' }
];

export default function CompetencyDashboard() {
  const [journals, setJournals] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1333 0%, #2d1b4e 50%, #1a1333 100%)' }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Core Competencies</h1>
            <p className="text-gray-300">Track development across 6 core areas</p>
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
              <Card key={comp.id} className="stat-card cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-${comp.color}-100 rounded-xl flex items-center justify-center`}>
                      <Award className={`w-6 h-6 text-${comp.color}-600`} />
                    </div>
                    <span className="text-lg">{comp.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-800 mb-2">{count}</p>
                  <p className="text-sm text-gray-300">Journal entries</p>
                  <div className="mt-4">
                    <div className="progress-bar">
                      <div className={`progress-fill bg-${comp.color}-600`} style={{ width: `${Math.min((count / 10) * 100, 100)}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {journals.length > 0 && (
          <Card className="glass-card mt-8">
            <CardHeader>
              <CardTitle>Recent Journal Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {journals.slice(0, 10).map(journal => {
                  const comp = COMPETENCIES.find(c => c.id === journal.competency_id);
                  return (
                    <div key={journal.id} className="p-4 bg-white rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`badge badge-${comp?.color}`}>{comp?.name}</span>
                        <span className="text-xs text-gray-500">{journal.date}</span>
                      </div>
                      <p className="text-gray-300">{journal.entry}</p>
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
