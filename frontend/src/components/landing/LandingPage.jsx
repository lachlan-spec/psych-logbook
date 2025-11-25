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
      description: "Track logbook hours and supervision to meet your program requirements",
      features: ["Automated hour calculations", "Customizable supervision tracking", "Weekly sign-offs"],
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
      title: "CPD Hub with Learning Plans & Peer Consultations",
      description: "Comprehensive CPD management including structured Learning Plans with goal tracking and dedicated Peer Consultation logging with automatic hour calculations",
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
    "100% aligned with Psychology Board of Australia Code of Conduct (Effective Dec 1, 2025)",
    "Tracks all 8 Core Competencies for Clinical Endorsement",
    "Flexible supervision ratio tracking tailored to your program requirements",
    "Distinguishes mandatory 10h Peer Consultation from general CPD",
    "Learning Plans built for Reflexive Practice & Deliberate Learning",
    "Export-ready, audit-proof reports for Psychology Board of Australia and AHPRA"
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

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200/50 rounded-xl p-4 mt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-900 mb-1">
                    ✨ 100% Ready for Dec 1, 2025 Standards
                  </p>
                  <p className="text-xs text-green-800">
                    Built to meet the new Psychology Board of Australia Code of Conduct requirements, 
                    including Reflexive Practice and Deliberate Learning frameworks
                  </p>
                </div>
              </div>
            </div>
            
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

      {/* Who It's For Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Supporting Your Entire Career Journey
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            From provisional internship to ongoing practice, ClinMinds adapts to your professional stage
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {careerStages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <Card 
                key={index}
                className="border-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardContent className="p-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${stage.gradient} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-8 h-8 ${stage.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {stage.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                    {stage.description}
                  </p>
                  <div className="space-y-2">
                    {stage.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 2025 Regulatory Standards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white shadow-2xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-bold">Effective December 1, 2025</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Built for the New Psychology Board of Australia Standards
            </h2>
            <p className="text-lg text-blue-100 max-w-3xl mx-auto">
              ClinMinds is specifically designed to meet every requirement of the Psychology Board of Australia 
              Code of Conduct 2025 framework
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      8 Core Competencies Tracker
                    </h3>
                    <p className="text-sm text-slate-600">
                      For Clinical Endorsement Registrars
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    Assessment & Formulation
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    Intervention & Management
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    Ethics, Legal & Professional
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    + 5 additional competency domains
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      Supervision Ratio Tracking
                    </h3>
                    <p className="text-sm text-slate-600">
                      Automated 1:17.5 Monitoring
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-700 mb-3">
                  Automatically monitors your strict supervision-to-practice ratio (1 hour supervision 
                  per 17.5 hours practice) required for registrar programs.
                </p>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-900">Real-time alerts when approaching ratio limits</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      Smart CPD Tracking & Tagging
                    </h3>
                    <p className="text-sm text-slate-600">
                      Track hours and competency areas
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-700 mb-3">
                  Separates general CPD from mandatory 10h Peer Consultation. Tag activities 
                  for "Cultural Competence," "Trauma-Informed Care," and other PBA Code areas.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <div className="bg-green-50 rounded px-2 py-1 text-xs font-medium text-green-800">
                    General CPD
                  </div>
                  <div className="bg-emerald-50 rounded px-2 py-1 text-xs font-medium text-emerald-800">
                    10h Peer
                  </div>
                  <div className="bg-teal-50 rounded px-2 py-1 text-xs font-medium text-teal-800">
                    Cultural
                  </div>
                  <div className="bg-purple-50 rounded px-2 py-1 text-xs font-medium text-purple-800">
                    Trauma
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      Reflexive Practice Framework
                    </h3>
                    <p className="text-sm text-slate-600">
                      New 2025 Learning Plan Requirements
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-700 mb-3">
                  Built-in Learning Plan feature specifically designed for "Reflexive Practice" and 
                  "Deliberate Learning" - the new 2025 regulatory requirements.
                </p>
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-orange-900">100% audit-ready for PBA inspections</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button 
              size="lg"
              onClick={() => navigate('/signup')}
              className="h-14 px-8 text-base bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
            >
              Start Meeting 2025 Standards Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Powerful Features to Simplify Compliance
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to track your professional development and meet regulatory requirements
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className="border-slate-200/50 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all fade-in"
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
        </div>
      </section>

      {/* Trust & Compliance Section */}
      <section className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/80 rounded-full mb-4">
              <Shield className="w-5 h-5 text-blue-700" />
              <span className="text-sm font-semibold text-blue-700">Trusted & Compliant</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Aligned with Professional Standards
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Built to meet Australian regulatory requirements with your professional integrity at the forefront
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-4">
              {compliancePoints.map((point, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/50">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-slate-700 font-medium">{point}</p>
                </div>
              ))}
            </div>
            
            <div className="space-y-6">
              <Card className="border-2 border-blue-200/50 bg-white shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <FileCheck className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        PBA Code of Conduct 2025
                      </h3>
                      <p className="text-sm text-green-600 font-semibold">✓ 100% Audit-Ready</p>
                    </div>
                  </div>
                  <p className="text-slate-600 mb-4">
                    Built specifically to meet the December 1, 2025 Psychology Board of Australia 
                    standards, including new requirements for Reflexive Practice and Deliberate Learning.
                  </p>
                  <div className="space-y-3 mb-4">
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-3 rounded-lg">
                      <p className="text-xs text-purple-900 font-medium">8 Core Competencies Tracked</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-900 font-medium">1:17.5 Supervision Ratio Monitored</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg">
                      <p className="text-xs text-green-900 font-medium">10h Peer Consultation Distinguished</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                    <p className="text-sm text-slate-700 font-medium mb-1">National Coverage</p>
                    <p className="text-xs text-slate-600">
                      All Australian states & territories • All registration pathways
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    Ready to Get Started?
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Join Australian psychologists who are simplifying their compliance and 
                    professional development tracking.
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
