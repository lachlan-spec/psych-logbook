import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [discount, setDiscount] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if already subscribed
    checkSubscriptionStatus();
  }, [user, navigate]);

  const checkSubscriptionStatus = async () => {
    try {
      const response = await api.get('/subscription/status');
      if (response.data.is_active) {
        navigate('/dashboard');
      }
    } catch (error) {
      // Not subscribed, show subscription page
    }
  };

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/subscription/validate-promo', {
        promo_code: promoCode.toUpperCase()
      });
      
      setDiscount(response.data);
      toast.success(`Promo code applied! ${response.data.discount_percent}% off`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid promo code');
      setDiscount(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const originUrl = window.location.origin;
      const response = await api.post('/subscription/create-checkout', {
        plan: user.role,
        promo_code: promoCode.toUpperCase() || null,
        origin_url: originUrl
      });

      // If promo code gives 100% off, no payment needed
      if (response.data.free_subscription) {
        toast.success('Free subscription activated!');
        navigate('/dashboard');
      } else {
        // Redirect to Stripe checkout
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create subscription');
      setLoading(false);
    }
  };

  const planDetails = {
    psychologist: {
      name: 'Psychologist Plan',
      price: 25,
      features: [
        'Practice logbook tracking',
        'CPD activity logging',
        'Learning plans and goals',
        'Peer consultation tracking',
        'Competency journals',
        'Supervisor connections',
        'Messaging with supervisors'
      ]
    },
    supervisor: {
      name: 'Supervisor Plan',
      price: 50,
      features: [
        'View all connected psychologists',
        'Review logbooks and CPD activities',
        'Provide feedback on entries',
        'Monitor competency progress',
        'Messaging with psychologists',
        'Sign off weekly hours'
      ]
    }
  };

  const currentPlan = planDetails[user?.role] || planDetails.psychologist;
  const finalPrice = discount?.discount_percent === 100 ? 0 : 
                     discount ? currentPlan.price * (1 - discount.discount_percent / 100) : 
                     currentPlan.price;

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-neutral/50 bg-white/90 backdrop-blur-sm shadow-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-semibold text-neutral-dark">
            Subscribe to Psychology Portal
          </CardTitle>
          <CardDescription className="text-sm text-neutral-light">
            Choose your plan to start tracking your professional development
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Plan Card */}
          <Card className="border-2 border-primary bg-gradient-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-primary">{currentPlan.name}</CardTitle>
              <div className="flex items-baseline gap-1">
                {discount && discount.discount_percent === 100 ? (
                  <>
                    <span className="text-3xl font-bold text-success">FREE</span>
                    <span className="text-sm text-neutral-light line-through ml-2">AU${currentPlan.price}/month</span>
                  </>
                ) : discount ? (
                  <>
                    <span className="text-3xl font-bold text-primary">AU${finalPrice.toFixed(2)}</span>
                    <span className="text-sm text-neutral-light">/month</span>
                    <span className="text-sm text-success ml-2">({discount.discount_percent}% off!)</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-primary">AU${currentPlan.price}</span>
                    <span className="text-sm text-neutral-light">/month</span>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentPlan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-neutral">
                    <Check className="icon-sm text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Promo Code */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-neutral">Have a promo code?</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="text-sm border-neutral"
                disabled={loading}
              />
              <Button
                onClick={handleValidatePromo}
                variant="outline"
                size="sm"
                className="px-4 text-xs border-neutral hover:bg-neutral"
                disabled={loading}
              >
                {loading ? <Loader2 className="icon-sm animate-spin" /> : 'Apply'}
              </Button>
            </div>
            {discount && (
              <p className="text-xs text-success font-medium">
                ✓ {discount.description}
              </p>
            )}
          </div>

          {/* Subscribe Button */}
          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full h-11 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            {loading ? (
              <Loader2 className="icon-sm animate-spin" />
            ) : discount?.discount_percent === 100 ? (
              'Activate Free Subscription'
            ) : (
              `Subscribe for AU$${finalPrice.toFixed(2)}/month`
            )}
          </Button>

          <p className="text-xs text-center text-neutral-light">
            Cancel anytime. No hidden fees. Secure payment via Stripe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
