import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'sonner';

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking, success, error
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      navigate('/subscribe');
      return;
    }

    pollPaymentStatus(sessionId);
  }, []);

  const pollPaymentStatus = async (sessionId) => {
    if (attempts >= maxAttempts) {
      setStatus('error');
      toast.error('Payment verification timed out. Please check your email.');
      return;
    }

    try {
      const response = await api.get(`/subscription/checkout-status/${sessionId}`);
      
      if (response.data.payment_status === 'paid') {
        setStatus('success');
        toast.success('Subscription activated!');
        setTimeout(() => navigate('/dashboard'), 3000);
      } else if (response.data.status === 'expired') {
        setStatus('error');
        toast.error('Payment session expired');
      } else {
        // Still pending, poll again
        setAttempts(prev => prev + 1);
        setTimeout(() => pollPaymentStatus(sessionId), 2000);
      }
    } catch (error) {
      setStatus('error');
      toast.error('Failed to verify payment');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-neutral/50 bg-white/90 backdrop-blur-sm shadow-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-semibold text-neutral-dark">
            {status === 'checking' && 'Processing Payment...'}
            {status === 'success' && 'Subscription Activated!'}
            {status === 'error' && 'Payment Verification Failed'}
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          {status === 'checking' && (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
              <p className="text-sm text-neutral">
                Please wait while we confirm your payment...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-success mx-auto" />
              <div className="space-y-2">
                <p className="text-sm text-neutral">
                  Your subscription is now active!
                </p>
                <p className="text-xs text-neutral-light">
                  Redirecting to your dashboard...
                </p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <p className="text-sm text-neutral">
                We couldn't verify your payment. Please check your email for confirmation or contact support.
              </p>
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Go to Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
