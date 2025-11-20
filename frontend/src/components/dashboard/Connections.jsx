import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { connectionsAPI, usersAPI } from '../../services/api';
import { toast } from 'sonner';
import { Search, UserPlus, Check, X } from 'lucide-react';

export default function Connections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const response = await connectionsAPI.getAll();
      setConnections(response.data);
    } catch (error) {
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    try {
      const response = await usersAPI.search(searchQuery);
      const targetRole = user.role === 'psychologist' ? 'supervisor' : 'psychologist';
      setSearchResults(response.data.filter(u => u.role === targetRole && u.id !== user.id));
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const sendRequest = async (supervisorId) => {
    try {
      await connectionsAPI.create({ supervisor_id: supervisorId });
      toast.success('Connection request sent');
      setSearchResults([]);
      setSearchQuery('');
      loadConnections();
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  const respondToRequest = async (connectionId, status) => {
    try {
      await connectionsAPI.update(connectionId, status);
      toast.success(`Request ${status}`);
      loadConnections();
    } catch (error) {
      toast.error('Failed to update connection');
    }
  };

  const pending = connections.filter(c => c.status === 'pending');
  const accepted = connections.filter(c => c.status === 'accepted');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Connections</h1>
          <p className="text-gray-600">Manage your professional relationships</p>
        </div>

        {user?.role === 'psychologist' && (
          <Card className="glass-card mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Search className="w-5 h-5" />
                Find a Supervisor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                />
                <Button onClick={searchUsers} className="btn-primary">Search</Button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-3">
                  {searchResults.map(result => (
                    <div key={result.id} className="list-item-card flex items-center justify-between p-4">
                      <div>
                        <p className="font-semibold text-gray-900">{result.name}</p>
                        <p className="text-sm text-gray-600">{result.email}</p>
                      </div>
                      <Button size="sm" onClick={() => sendRequest(result.id)} className="btn-primary">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {pending.length > 0 && (
          <Card className="glass-card mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pending.map(conn => (
                  <div key={conn.id} className="list-item-card flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold text-gray-900">{conn.other_user?.name}</p>
                      <p className="text-sm text-gray-600">{conn.other_user?.email}</p>
                    </div>
                    {user.role === 'supervisor' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => respondToRequest(conn.id, 'accepted')} className="bg-green-600 hover:bg-green-700">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => respondToRequest(conn.id, 'rejected')} className="hover:bg-red-50 hover:text-red-600 hover:border-red-300">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Active Connections</CardTitle>
          </CardHeader>
          <CardContent>
            {accepted.length === 0 ? (
              <div className="empty-state py-8">
                <p>No active connections yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {accepted.map(conn => (
                  <div key={conn.id} className="flex items-center justify-between p-4 rounded-lg border border-purple-700/30" style={{ background: 'rgba(124, 58, 237, 0.1)' }}>
                    <div>
                      <p className="font-medium text-white">{conn.other_user?.name}</p>
                      <p className="text-sm text-gray-400">{conn.other_user?.email}</p>
                      <span className="badge badge-green mt-2">Connected</span>
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
