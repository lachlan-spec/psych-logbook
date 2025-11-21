import React from 'react';
import { useNavigate } from 'react-router-dom';
import PortalNav from './PortalNav';
import Connections from './Connections';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();

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

        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Settings</h1>
          <p className="text-gray-600">Manage your connections and preferences</p>
        </div>

        <Connections />
      </div>
    </div>
  );
}
