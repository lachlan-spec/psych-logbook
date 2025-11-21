import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../dashboard/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import api from '../../services/api';
import { Settings, Plus, Edit2, Trash2, ArrowLeft, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../ui/alert';

export default function CPDSettings() {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [formData, setFormData] = useState({
    year: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      const response = await api.getCPDYears();
      const data = response.data || response;
      setPeriods(data.sort((a, b) => new Date(b.start_date) - new Date(a.start_date)));
    } catch (error) {
      toast.error('Failed to load CPD periods');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.year || !formData.start_date || !formData.end_date) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      if (editingPeriod) {
        await api.patch(`/cpd/years/${editingPeriod.id}`, formData);
        toast.success('CPD period updated');
      } else {
        await api.createCPDYear(formData);
        toast.success('CPD period created');
      }
      
      handleDialogClose();
      loadPeriods();
    } catch (error) {
      toast.error('Failed to save CPD period');
    }
  };

  const handleEdit = (period) => {
    setEditingPeriod(period);
    setFormData({
      year: period.year,
      start_date: period.start_date,
      end_date: period.end_date
    });
    setDialogOpen(true);
  };

  const handleDelete = async (periodId) => {
    if (!confirm('Are you sure you want to delete this CPD period? All associated activities will remain but will need to be reassigned.')) {
      return;
    }

    try {
      await api.delete(`/cpd/years/${periodId}`);
      toast.success('CPD period deleted');
      loadPeriods();
    } catch (error) {
      toast.error('Failed to delete CPD period');
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingPeriod(null);
    setFormData({ year: '', start_date: '', end_date: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/cpd/activities')}
          className="mb-4 -ml-2 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to CPD Activities
        </Button>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2 flex items-center gap-3">
              <Settings className="w-8 h-8" />
              CPD Settings
            </h1>
            <p className="text-gray-600">Manage your CPD registration periods</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingPeriod(null)} className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                New Period
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPeriod ? 'Edit' : 'Create'} CPD Period</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Period Name</Label>
                  <Input
                    placeholder="e.g., 2026, 2025-2026"
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

        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-gray-700">
            <strong>Note:</strong> CPD registration years run from 1st December to 30th November. 
            For example, the year beginning 1st December 2025 is the "2026" CPD year.
          </AlertDescription>
        </Alert>

        <Card className="glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">CPD Periods</CardTitle>
          </CardHeader>
          <CardContent>
            {periods.length === 0 ? (
              <div className="empty-state py-8">
                <p className="text-gray-500 mb-2">No CPD periods yet</p>
                <p className="text-xs text-gray-400">Create your first CPD period to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {periods.map(period => (
                  <div key={period.id} className="list-item-card p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{period.year}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(period)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(period.id)}
                        className="hover:bg-red-50 hover:text-red-600"
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
