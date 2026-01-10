import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { ArrowLeft, Plus, Trash2, Users, Eye, EyeOff, Settings, BookOpen, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../services/api';

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    competency_journal_enabled: true,
    practice_logbook_enabled: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Admin access required');
        navigate('/dashboard');
      } else {
        toast.error('Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error('Username and password are required');
      return;
    }

    if (formData.password.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }

    try {
      await api.post('/admin/users', {
        username: formData.username,
        password: formData.password,
        name: formData.name || formData.username,
        competency_journal_enabled: formData.competency_journal_enabled,
        practice_logbook_enabled: formData.practice_logbook_enabled
      });
      toast.success(`User "${formData.username}" created successfully`);
      setDialogOpen(false);
      setFormData({ 
        username: '', 
        password: '', 
        name: '',
        competency_journal_enabled: true,
        practice_logbook_enabled: true
      });
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}" and ALL their data? This cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success(`User "${username}" deleted`);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleOpenSettings = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowNewPassword(false);
    setSettingsDialogOpen(true);
  };

  const handleUpdateUserSettings = async (field, value) => {
    if (!selectedUser) return;
    
    try {
      await api.patch(`/admin/users/${selectedUser.id}`, {
        [field]: value
      });
      
      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, [field]: value } : u
      ));
      setSelectedUser({ ...selectedUser, [field]: value });
      
      toast.success('Settings updated');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update settings');
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) return;
    
    if (newPassword.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }
    
    try {
      await api.patch(`/admin/users/${selectedUser.id}`, {
        password: newPassword
      });
      
      setNewPassword('');
      setShowNewPassword(false);
      toast.success('Password updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update password');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
            <p className="text-sm text-slate-500">Create and manage user accounts</p>
          </div>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-user-btn">
              <Plus className="w-4 h-4 mr-2" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
              <div>
                <Label>Display Name</Label>
                <Input
                  placeholder="Enter display name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-11"
                />
                <p className="text-xs text-slate-500 mt-1">Optional - defaults to username</p>
              </div>
              <div>
                <Label>Username *</Label>
                <Input
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="h-11"
                  data-testid="username-input"
                />
                <p className="text-xs text-slate-500 mt-1">Used for login</p>
              </div>
              <div>
                <Label>Password *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={4}
                    className="h-11 pr-10"
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Minimum 4 characters</p>
              </div>

              {/* Feature Toggles */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-slate-700 mb-3">Feature Access</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-slate-700">Practice Logbook</span>
                    </div>
                    <Switch
                      checked={formData.practice_logbook_enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, practice_logbook_enabled: checked })}
                      data-testid="logbook-toggle"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-slate-700">Competency Journal</span>
                    </div>
                    <Switch
                      checked={formData.competency_journal_enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, competency_journal_enabled: checked })}
                      data-testid="competency-toggle"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 h-11" data-testid="create-user-btn">
                  Create User
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="h-11">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Registered Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white hover:shadow-sm transition-shadow"
                  data-testid={`user-row-${user.email}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{user.name}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-slate-500">
                          Username: <span className="font-mono">{user.email}</span>
                        </p>
                        {user.email === 'admin' && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            Admin
                          </span>
                        )}
                      </div>
                      {/* Feature badges */}
                      {user.email !== 'admin' && (
                        <div className="flex items-center gap-1 mt-1">
                          {user.practice_logbook_enabled !== false && (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded flex items-center gap-1">
                              <FileText className="w-3 h-3" /> Logbook
                            </span>
                          )}
                          {user.competency_journal_enabled !== false && (
                            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-xs rounded flex items-center gap-1">
                              <BookOpen className="w-3 h-3" /> Competency
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {user.email !== 'admin' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => handleOpenSettings(user)}
                          data-testid={`settings-btn-${user.email}`}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          data-testid={`delete-btn-${user.email}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Settings - {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-slate-600">
                Configure feature access for this user. Changes take effect immediately.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">Practice Logbook</p>
                      <p className="text-xs text-slate-500">Track supervised practice hours</p>
                    </div>
                  </div>
                  <Switch
                    checked={selectedUser.practice_logbook_enabled !== false}
                    onCheckedChange={(checked) => handleUpdateUserSettings('practice_logbook_enabled', checked)}
                    data-testid="edit-logbook-toggle"
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">Competency Journal</p>
                      <p className="text-xs text-slate-500">Track competency development</p>
                    </div>
                  </div>
                  <Switch
                    checked={selectedUser.competency_journal_enabled !== false}
                    onCheckedChange={(checked) => handleUpdateUserSettings('competency_journal_enabled', checked)}
                    data-testid="edit-competency-toggle"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSettingsDialogOpen(false)} 
                  className="w-full h-11"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-blue-800 mb-2">How it works</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Each user has completely separate data (logbooks, CPD, journals, etc.)</li>
            <li>• Users log in with the username and password you set</li>
            <li>• Toggle features on/off per user using the settings button</li>
            <li>• Deleting a user removes ALL their data permanently</li>
            <li>• The admin account cannot be deleted</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
