import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Settings, Plus, Edit2, Trash2, ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../services/api';
import { formatDateAU } from '../../lib/dateUtils';

export default function LogbookSettings() {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [newSecondarySupervisor, setNewSecondarySupervisor] = useState('');
  const [formData, setFormData] = useState({
    year: '',
    start_date: '',
    end_date: '',
    target_hours: 1500,
    target_direct_client: 0,
    target_supervision_individual: 0,
    target_supervision_group: 0,
    target_peer_consultation: 0,
    target_cpd: 0,
    target_other: 0,
    primary_supervisor: '',
    secondary_supervisors: []
  });

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      const response = await api.getLogbookYears();
      const data = response.data || response; // Handle both response.data and direct data
      setPeriods(data.sort((a, b) => new Date(b.start_date) - new Date(a.start_date)));
    } catch (error) {
      toast.error('Failed to load logbook periods');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPeriod) {
        await api.updateLogbookYear(editingPeriod.id, formData);
        toast.success('Logbook period updated');
      } else {
        await api.createLogbookYear(formData);
        toast.success('Logbook period created');
      }
      
      setDialogOpen(false);
      setEditingPeriod(null);
      setFormData({ year: '', start_date: '', end_date: '' });
      loadPeriods();
    } catch (error) {
      toast.error(editingPeriod ? 'Failed to update period' : 'Failed to create period');
    }
  };

  const handleEdit = (period) => {
    setEditingPeriod(period);
    setFormData({
      year: period.year,
      start_date: period.start_date,
      end_date: period.end_date,
      target_hours: period.target_hours || 1500,
      target_direct_client: period.target_direct_client || 0,
      target_supervision_individual: period.target_supervision_individual || 0,
      target_supervision_group: period.target_supervision_group || 0,
      target_peer_consultation: period.target_peer_consultation || 0,
      target_cpd: period.target_cpd || 0,
      target_other: period.target_other || 0,
      primary_supervisor: period.primary_supervisor || '',
      secondary_supervisors: period.secondary_supervisors || []
    });
    setDialogOpen(true);
  };

  const handleDelete = async (periodId) => {
    if (!window.confirm('Are you sure? This will delete all entries in this period.')) {
      return;
    }

    try {
      await api.deleteLogbookYear(periodId);
      toast.success('Logbook period deleted');
      loadPeriods();
    } catch (error) {
      toast.error('Failed to delete period');
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingPeriod(null);
    setNewSecondarySupervisor('');
    setFormData({ 
      year: '', 
      start_date: '', 
      end_date: '',
      target_hours: 1500,
      target_direct_client: 0,
      target_supervision_individual: 0,
      target_supervision_group: 0,
      target_peer_consultation: 0,
      target_cpd: 0,
      target_other: 0,
      primary_supervisor: '',
      secondary_supervisors: []
    });
  };

  const handleAddSecondarySupervisor = () => {
    if (newSecondarySupervisor.trim()) {
      setFormData({
        ...formData,
        secondary_supervisors: [...(formData.secondary_supervisors || []), newSecondarySupervisor.trim()]
      });
      setNewSecondarySupervisor('');
    }
  };

  const handleRemoveSecondarySupervisor = (index) => {
    setFormData({
      ...formData,
      secondary_supervisors: (formData.secondary_supervisors || []).filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/logbook')}
          className="mb-4 -ml-2 hover:bg-neutral"
        >
          <ArrowLeft className="icon-sm mr-2" />
          Back to Logbook
        </Button>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2 flex items-center gap-3">
              <Settings className="w-8 h-8" />
              Logbook Settings
            </h1>
            <p className="text-neutral">Manage your logbook periods</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary" onClick={() => handleDialogClose()}>
                <Plus className="icon-sm mr-2" />
                New Period
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPeriod ? 'Edit' : 'Create'} Logbook Period</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Period Name</Label>
                  <Input
                    placeholder="e.g., 2025, Q1 2025, or Jan-Jun 2025"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-neutral-dark mb-3">Total Target Hours</h3>
                  <div>
                    <Label className="text-xs">Overall Target (used for progress calculation)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.target_hours}
                      onChange={(e) => setFormData({ ...formData, target_hours: parseInt(e.target.value) || 0 })}
                      placeholder="1500"
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-neutral-dark mb-3">Target Hours by Category</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Direct Client Contact</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.target_direct_client}
                        onChange={(e) => setFormData({ ...formData, target_direct_client: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Supervision - Individual</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.target_supervision_individual}
                        onChange={(e) => setFormData({ ...formData, target_supervision_individual: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Supervision - Group</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.target_supervision_group}
                        onChange={(e) => setFormData({ ...formData, target_supervision_group: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Other</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.target_other}
                        onChange={(e) => setFormData({ ...formData, target_other: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-neutral-dark mb-3">Supervisors</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs">Primary Supervisor</Label>
                      <Input
                        placeholder="Enter primary supervisor name"
                        value={formData.primary_supervisor}
                        onChange={(e) => setFormData({ ...formData, primary_supervisor: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Secondary Supervisors</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Add secondary supervisor"
                          value={newSecondarySupervisor}
                          onChange={(e) => setNewSecondarySupervisor(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSecondarySupervisor())}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={handleAddSecondarySupervisor}>
                          <Plus className="icon-sm" />
                        </Button>
                      </div>
                      {formData.secondary_supervisors?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.secondary_supervisors.map((name, index) => (
                            <div key={index} className="flex items-center gap-1 bg-neutral/50 px-2 py-1 rounded text-sm">
                              <span>{name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSecondarySupervisor(index)}
                                className="text-neutral-light hover:text-error"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="btn-primary flex-1">
                    {editingPeriod ? 'Update' : 'Create'} Period
                  </Button>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Logbook Periods</CardTitle>
          </CardHeader>
          <CardContent>
            {periods.length === 0 ? (
              <div className="empty-state py-8">
                <p className="text-neutral-light mb-2">No logbook periods yet</p>
                <p className="text-xs text-neutral-light mb-4">Create your first logbook period to start tracking</p>
              </div>
            ) : (
              <div className="space-y-3">
                {periods.map((period) => (
                  <div key={period.id} className="list-item-card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-neutral-dark">{period.year}</p>
                      <p className="text-sm text-neutral mt-1">
                        {formatDateAU(period.start_date)} - {formatDateAU(period.end_date)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(period)}
                        className="hover:bg-primary-light hover:border-primary"
                      >
                        <Edit2 className="icon-sm" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(period.id)}
                        className="hover:bg-error hover:border-error hover:text-error"
                      >
                        <Trash2 className="icon-sm" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
