import React from 'react';
import Navbar from '../dashboard/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export default function LearningPlans() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold gradient-text mb-8">Learning Plans</h1>
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Learning Plans feature coming soon</p>
            <p className="text-sm text-gray-500 mt-2">Set goals and track your professional development</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
