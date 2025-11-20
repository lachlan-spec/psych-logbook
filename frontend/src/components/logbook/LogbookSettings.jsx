import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Settings, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

export default function LogbookSettings() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [formData, setFormData] = useState({
    year: '',
    start_date: '',
    end_date: '',
    target_direct_client: 0,
    target_supervision: 0,
    target_other: 0,
    target_cpd: 0
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
      target_direct_client: period.target_direct_client || 0,
      target_supervision: period.target_supervision || 0,
      target_other: period.target_other || 0,
      target_cpd: period.target_cpd || 0
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
    setFormData({ 
      year: '', 
      start_date: '', 
      end_date: '',
      target_direct_client: 0,
      target_supervision: 0,
      target_other: 0,
      target_cpd: 0
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2 flex items-center gap-3">
              <Settings className="w-8 h-8" />
              Logbook Settings
            </h1>
            <p className="text-gray-600">Manage your logbook periods</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary" onClick={() => handleDialogClose()}>
                <Plus className="w-4 h-4 mr-2" />
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

        <Card className="glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Logbook Periods</CardTitle>
          </CardHeader>
          <CardContent>
            {periods.length === 0 ? (
              <div className="empty-state py-8">
                <p className="text-gray-500 mb-2">No logbook periods yet</p>
                <p className="text-xs text-gray-400 mb-4">Create your first logbook period to start tracking</p>
              </div>
            ) : (
              <div className="space-y-3">
                {periods.map((period) => (
                  <div key={period.id} className="list-item-card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{period.year}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(period)}
                        className="hover:bg-blue-50 hover:border-blue-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(period.id)}
                        className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
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
