import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { journalAPI } from '../../services/api';
import PortalNav from '../dashboard/PortalNav';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, Calendar, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getLocalDateString } from '../../lib/dateUtils';

export default function Journal() {
  const navigate = useNavigate();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    entry: '',
    date: getLocalDateString()
  });

  useEffect(() => {
    loadJournals();
  }, []);

  const loadJournals = async () => {
    try {
      const response = await journalAPI.getAll();
      setJournals(response.data);
    } catch (error) {
      toast.error('Failed to load journals');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingJournal(null);
    setFormData({
      title: '',
      entry: '',
      date: getLocalDateString()
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (journal) => {
    setEditingJournal(journal);
    setFormData({
      title: journal.title || '',
      entry: journal.entry,
      date: journal.date
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.entry.trim()) {
      toast.error('Please write something in your journal');
      return;
    }

    try {
      if (editingJournal) {
        await journalAPI.update(editingJournal.id, formData);
        toast.success('Journal updated');
      } else {
        await journalAPI.create(formData);
        toast.success('Journal entry created');
      }
      setDialogOpen(false);
      loadJournals();
    } catch (error) {
      toast.error('Failed to save journal');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this journal entry?')) return;
    
    try {
      await journalAPI.delete(id);
      toast.success('Journal deleted');
      loadJournals();
    } catch (error) {
      toast.error('Failed to delete journal');
    }
  };

  // Group journals by month
  const groupByMonth = (journalList) => {
    const grouped = {};
    journalList.forEach(journal => {
      const date = new Date(journal.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(journal);
    });
    return grouped;
  };

  const formatMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Filter journals by search query
  const filteredJournals = journals.filter(journal => 
    journal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    journal.entry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedJournals = groupByMonth(filteredJournals);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary">
        <PortalNav />
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <PortalNav />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4 -ml-2 hover:bg-neutral"
        >
          <ArrowLeft className="icon-sm mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Personal Journal</h1>
            <p className="text-sm text-neutral-light mt-1">Your private space for reflections and notes</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAddDialog} className="btn-primary h-10 px-4">
                <Plus className="w-4 h-4 mr-2" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg mx-4">
              <DialogHeader>
                <DialogTitle className="text-lg">
                  {editingJournal ? 'Edit Journal Entry' : 'New Journal Entry'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Title (Optional)</Label>
                  <Input
                    className="mt-1"
                    placeholder="Give your entry a title..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Journal Entry *</Label>
                  <Textarea
                    className="mt-1 min-h-[200px]"
                    placeholder="Write your thoughts, reflections, or notes here..."
                    value={formData.entry}
                    onChange={(e) => setFormData({ ...formData, entry: e.target.value })}
                  />
                </div>
                <Button onClick={handleSave} className="w-full btn-primary">
                  {editingJournal ? 'Update Entry' : 'Save Entry'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-light" />
          <Input
            placeholder="Search your journals..."
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Journal Entries */}
        <Card className="card shadow-sm">
          <CardHeader className="p-4 border-b border-neutral">
            <CardTitle className="text-sm font-semibold text-neutral-dark flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Journal Entries
              {journals.length > 0 && (
                <span className="text-xs font-normal text-neutral-light">
                  ({journals.length} {journals.length === 1 ? 'entry' : 'entries'})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredJournals.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-neutral-light" />
                <p className="text-sm text-neutral-light mb-4">
                  {searchQuery ? 'No journals match your search' : 'No journal entries yet'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleOpenAddDialog} size="sm" className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Write Your First Entry
                  </Button>
                )}
              </div>
            ) : (
              <Accordion type="single" collapsible defaultValue={Object.keys(groupedJournals)[0]}>
                {Object.keys(groupedJournals).sort().reverse().map(monthKey => {
                  const monthJournals = groupedJournals[monthKey];
                  return (
                    <AccordionItem key={monthKey} value={monthKey} className="border-b border-neutral last:border-0">
                      <AccordionTrigger className="hover:bg-neutral/50 px-4 py-3 transition-all">
                        <div className="flex items-center justify-between w-full pr-3">
                          <span className="text-sm font-medium text-neutral-dark">{formatMonthLabel(monthKey)}</span>
                          <span className="text-xs text-neutral-light bg-neutral px-2 py-0.5 rounded-full">
                            {monthJournals.length} {monthJournals.length === 1 ? 'entry' : 'entries'}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 px-4 pb-4">
                          {monthJournals.sort((a, b) => new Date(b.date) - new Date(a.date)).map(journal => (
                            <div key={journal.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-3.5 h-3.5 text-neutral-light" />
                                    <span className="text-xs text-neutral-light">
                                      {new Date(journal.date).toLocaleDateString('en-US', { 
                                        weekday: 'short', 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                  {journal.title && (
                                    <h3 className="font-semibold text-neutral-dark text-sm mb-1">{journal.title}</h3>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handleOpenEditDialog(journal)}
                                    className="h-7 w-7 p-0 hover:bg-white text-neutral"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handleDelete(journal.id)}
                                    className="h-7 w-7 p-0 hover:bg-red-50 text-neutral hover:text-red-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-neutral-dark whitespace-pre-wrap leading-relaxed">
                                {journal.entry}
                              </p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
