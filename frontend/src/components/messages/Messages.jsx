import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PortalNav from '../dashboard/PortalNav';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { connectionsAPI } from '../../services/api';
import api from '../../services/api';
import { toast } from 'sonner';
import { Send, MessageSquare, ArrowLeft, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRecipient) {
      loadMessages(selectedRecipient.id);
    }
  }, [selectedRecipient]);

  const loadData = async () => {
    try {
      const connResponse = await connectionsAPI.getAll();
      const accepted = connResponse.data.filter(c => c.status === 'accepted');
      setConnections(accepted);

      const convResponse = await api.get('/messages/conversations');
      setConversations(convResponse.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherUserId) => {
    try {
      const response = await api.get('/messages', {
        params: { other_user_id: otherUserId }
      });
      setMessages(response.data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRecipient) {
      toast.error('Please select a recipient and enter a message');
      return;
    }

    try {
      await api.post('/messages', {
        to_user_id: selectedRecipient.id,
        content: newMessage
      });

      toast.success('Message sent!');
      setNewMessage('');
      loadMessages(selectedRecipient.id);
      loadData();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRecipientFromConnection = (conn) => {
    return {
      id: user.role === 'supervisor' ? conn.psychologist_id : conn.supervisor_id,
      name: conn.other_user?.name || 'Unknown',
      email: conn.other_user?.email || '',
      role: user.role === 'supervisor' ? 'psychologist' : 'supervisor'
    };
  };

  const recipientOptions = connections.map(getRecipientFromConnection);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <PortalNav />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-3 -ml-2 hover:bg-slate-100 text-xs text-slate-600 h-7"
        >
          <ArrowLeft className="w-3 h-3 mr-1.5" />
          Back
        </Button>

        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-1">Messages</h1>
          <p className="text-xs sm:text-sm text-slate-500">Communicate with your {user.role === 'supervisor' ? 'psychologists' : 'supervisors'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="md:col-span-1">
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg font-semibold">Select Recipient</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Select 
                    value={selectedRecipient?.id || ''} 
                    onValueChange={(value) => {
                      const recipient = recipientOptions.find(r => r.id === value);
                      setSelectedRecipient(recipient);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose someone to message" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipientOptions.map((recipient) => (
                        <SelectItem key={recipient.id} value={recipient.id}>
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            <span className="text-sm">{recipient.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {recipientOptions.length === 0 && (
                    <div className="empty-state py-6">
                      <p className="text-xs sm:text-sm text-gray-500 text-center">
                        No connections yet. Connect with a {user.role === 'supervisor' ? 'psychologist' : 'supervisor'} to start messaging.
                      </p>
                    </div>
                  )}

                  {conversations.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Recent Conversations</h3>
                      <div className="space-y-2">
                        {conversations.slice(0, 5).map((conv) => (
                          <button
                            key={conv.other_user.id}
                            onClick={() => setSelectedRecipient({
                              id: conv.other_user.id,
                              name: conv.other_user.name,
                              email: conv.other_user.email,
                              role: conv.other_user.role
                            })}
                            className={`w-full text-left p-2 sm:p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                              selectedRecipient?.id === conv.other_user.id ? 'bg-blue-50 border border-blue-200' : 'border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs sm:text-sm font-semibold text-blue-700">
                                  {conv.other_user.name?.charAt(0)}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{conv.other_user.name}</p>
                                <p className="text-[10px] sm:text-xs text-gray-500 truncate">{conv.last_message}</p>
                              </div>
                              {conv.unread_count > 0 && (
                                <span className="bg-blue-600 text-white text-[10px] sm:text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                  {conv.unread_count}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  {selectedRecipient ? (
                    <span>Conversation with {selectedRecipient.name}</span>
                  ) : (
                    <span>Select a recipient to start messaging</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRecipient ? (
                  <div className="space-y-4">
                    <div className="h-64 sm:h-96 overflow-y-auto border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50 space-y-3">
                      {messages.length === 0 ? (
                        <div className="empty-state h-full flex items-center justify-center">
                          <p className="text-xs sm:text-sm text-gray-500">No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((msg, idx) => {
                          const isSender = msg.sender_id === user.id;
                          return (
                            <div
                              key={idx}
                              className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[75%] sm:max-w-[70%] p-2 sm:p-3 rounded-lg ${
                                  isSender
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border border-gray-200'
                                }`}
                              >
                                <p className="text-xs sm:text-sm break-words">{msg.message}</p>
                                <p className={`text-[10px] sm:text-xs mt-1 ${isSender ? 'text-blue-100' : 'text-gray-400'}`}>
                                  {new Date(msg.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        rows={2}
                        className="flex-1 text-sm"
                      />
                      <Button
                        onClick={handleSendMessage}
                        className="btn-primary self-end sm:self-auto"
                        disabled={!newMessage.trim()}
                      >
                        <Send className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Send</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state py-12">
                    <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm sm:text-base text-gray-500 text-center">
                      Select a recipient from the list to start a conversation
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
