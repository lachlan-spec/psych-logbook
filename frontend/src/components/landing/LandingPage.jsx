import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { CheckCircle, BookOpen, Target, Users, Clock, Award, ArrowRight, Shield, FileCheck, BarChart3, CheckSquare, Calendar, Zap } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const careerStages = [
    {
      icon: Clock,
      title: "Provisional Psychologists",
      description: "Track logbook hours and supervision ratios for your internship program",
      features: ["Automated hour calculations", "Supervision ratio tracking", "Weekly sign-offs"],
      gradient: "from-blue-100 to-indigo-100",
      iconColor: "text-blue-600"
    },
    {
      icon: Award,
      title: "Clinical Registrars",
      description: "Monitor progress against specific core competencies for registrar training",
      features: ["Competency tracker", "Learning plan management", "Progress dashboards"],
      gradient: "from-purple-100 to-violet-100",
      iconColor: "text-purple-600"
    },
    {
      icon: Target,
      title: "Practicing Psychologists",
      description: "Manage annual CPD requirements and maintain ongoing compliance",
      features: ["CPD logging", "Peer consultation records", "Annual reports"],
      gradient: "from-green-100 to-emerald-100",
      iconColor: "text-green-600"
    }
  ];

  const features = [
    {
      icon: CheckSquare,
      title: "Registrar Competency Checker",
      description: "Visual tracker to tick off clinical registrar core competencies as you progress",
      gradient: "from-purple-100 to-violet-100",
      iconColor: "text-purple-600"
    },
    {
      icon: BookOpen,
      title: "CPD Hub",
      description: "Log CPD hours, create annual Learning Plans, and record Peer Consultation sessions",
      gradient: "from-green-100 to-emerald-100",
      iconColor: "text-green-600"
    },
    {
      icon: Zap,
      title: "Smart Logging",
      description: "Automated calculation of hours and ratios to save time and reduce errors",
      gradient: "from-blue-100 to-indigo-100",
      iconColor: "text-blue-600"
    },
    {
      icon: Users,
      title: "Supervisor Connection",
      description: "Seamless communication and feedback with your clinical supervisors",
      gradient: "from-pink-100 to-rose-100",
      iconColor: "text-pink-600"
    },
    {
      icon: BarChart3,
      title: "Progress Dashboards",
      description: "Real-time visual tracking of your professional development journey",
      gradient: "from-orange-100 to-amber-100",
      iconColor: "text-orange-600"
    },
    {
      icon: FileCheck,
      title: "Export Reports",
      description: "Generate compliant reports for AHPRA and registration requirements",
      gradient: "from-indigo-100 to-blue-100",
      iconColor: "text-indigo-600"
    }
  ];

  const compliancePoints = [
    "Aligned with Psychology Board of Australia Code of Conduct 2025",
    "Covers national Australian registration requirements",
    "Secure, encrypted data storage and transmission",
    "Regular updates to match regulatory changes",
    "Export-ready reports for AHPRA submissions",
    "Privacy-compliant client data handling"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ClinMinds
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                Login
              </Button>
              <Button 
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-6 fade-in">
            <div className="inline-block">
              <span className="px-4 py-1.5 bg-blue-100/80 text-blue-700 text-sm font-medium rounded-full">
                For Australian Psychologists
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
              Your All-in-One
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Digital Logbook
              </span>
              & Compliance Tracker
            </h1>
            
            <p className="text-lg text-slate-600 leading-relaxed">
              One platform that supports you from provisional internship through registrar 
              training to ongoing professional practice. Track hours, competencies, and CPD 
              requirements with confidence.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Button 
                size="lg"
                onClick={() => navigate('/signup')}
                className="h-14 px-8 text-base bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
              >
                Start Tracking Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/login')}
                className="h-14 px-8 text-base border-2 hover:bg-slate-50"
              >
                Login
              </Button>
            </div>
            
            <p className="text-sm text-slate-500">
              ✓ 7-day free trial  •  ✓ No credit card required  •  ✓ Cancel anytime
            </p>
          </div>

          {/* Right Column - Visual Card */}
          <div className="relative fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-3xl blur-3xl"></div>
            <Card className="relative border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-2xl">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Practice Hours Logged</p>
                      <p className="text-2xl font-bold text-slate-900">1,250 / 1,500</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">CPD Activities</p>
                      <p className="text-2xl font-bold text-slate-900">32 hours completed</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Competencies</p>
                      <p className="text-2xl font-bold text-slate-900">8 / 9 domains</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Everything You Need to Track Your Progress
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Designed specifically for Australian psychology registrar programs with all essential features in one place
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="border-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-7 h-7 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                Built for Australian Psychology Registrars
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Navigate your registrar program with confidence using a platform designed 
                specifically for PBA and higher registrar requirements.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-slate-700">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Ready to Get Started?
                </h3>
                <p className="text-slate-600 mb-6">
                  Join psychology registrars across Australia who are streamlining their 
                  journey to full registration.
                </p>
                <Button 
                  size="lg"
                  onClick={() => navigate('/signup')}
                  className="w-full h-14 text-base bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                >
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-xs text-center text-slate-500 mt-4">
                  No credit card required • 7-day free trial • Cancel anytime
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">ClinMinds</span>
              </div>
              <p className="text-slate-400 text-sm">
                Supporting Australian psychology registrars on their journey to full registration.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <button onClick={() => navigate('/signup')} className="block text-slate-400 hover:text-white transition-colors">
                  Sign Up
                </button>
                <button onClick={() => navigate('/login')} className="block text-slate-400 hover:text-white transition-colors">
                  Login
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-slate-400 text-sm">
                For support and inquiries, please contact us through your account dashboard.
              </p>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>© 2025 ClinMinds Psychology Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
