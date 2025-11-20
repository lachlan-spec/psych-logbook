import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../dashboard/Navbar';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { messagesAPI } from '../../services/api';
import { toast } from 'sonner';
import { Send, MessageSquare } from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await messagesAPI.getConversations();
      setConversations(response.data);
    } catch (error) {
      toast.error('Failed to load conversations');
    }
  };

  const loadMessages = async (otherUserId) => {
    try {
      const response = await messagesAPI.getMessages(otherUserId);
      setMessages(response.data);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    loadMessages(conv.other_user.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      await messagesAPI.send({
        to_user_id: selectedConversation.other_user.id,
        content: newMessage
      });
      setNewMessage('');
      loadMessages(selectedConversation.other_user.id);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold gradient-text mb-8">Messages</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          <Card className="glass-card md:col-span-1">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Conversations</h3>
              {conversations.length === 0 ? (
                <div className="empty-state py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map(conv => (
                    <button
                      key={conv.other_user.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full p-4 rounded-lg text-left transition-all ${ selectedConversation?.other_user.id === conv.other_user.id ? 'bg-blue-50 border-2 border-blue-200 shadow-sm' : 'list-item-card' }`}
                    >
                      <p className="font-semibold text-gray-900">{conv.other_user.name}</p>
                      <p className="text-sm text-gray-600 truncate mt-1">{conv.last_message?.content}</p>
                      {conv.unread_count > 0 && (
                        <span className="badge badge-blue mt-2">{conv.unread_count} new</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card md:col-span-2">
            <CardContent className="p-0 h-full flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">{selectedConversation.other_user.name}</h3>
                    <p className="text-xs text-gray-500">{selectedConversation.other_user.role}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.from_user_id === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.from_user_id === user.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'}`}>
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.from_user_id === user.id ? 'text-blue-100' : 'text-gray-500'}`}>
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage} className="btn-primary">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MessageSquare className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
