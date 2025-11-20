import React from 'react';
import Navbar from '../dashboard/Navbar';
import { Card, CardContent } from '../ui/card';

export default function PeerConsultations() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold gradient-text mb-8">Peer Consultations</h1>
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Peer Consultations feature coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
