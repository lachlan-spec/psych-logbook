import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { CheckCircle, BookOpen, Target, Users, Clock, Award, ArrowRight, Shield, FileCheck, BarChart3, CheckSquare, Calendar, Zap, FileText } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const careerStages = [
    {
      icon: Clock,
      title: "Provisional Psychologists",
      description: "Track logbook hours, supervision, and structured learning plans for professional development",
      features: ["Automated hour calculations", "Customizable supervision tracking", "Learning plan goals", "Peer consultation logging"],
      gradient: "icon-container-primary",
      iconColor: "text-white"
    },
    {
      icon: Award,
      title: "Clinical Registrars",
      description: "Monitor progress with competency tracking, learning plans, and peer consultation records",
      features: ["8 core competencies tracker", "Annual learning plans with goal setting", "Peer consultation hours (mandatory 10h)", "Progress dashboards"],
      gradient: "icon-container-secondary",
      iconColor: "text-white"
    },
    {
      icon: Target,
      title: "Practicing Psychologists",
      description: "Manage CPD with learning plans, peer consultations, and compliance tracking",
      features: ["CPD activity logging", "Learning plans & goal tracking", "Peer consultation records (10h requirement)", "Annual compliance reports"],
      gradient: "icon-container-success",
      iconColor: "text-white"
    }
  ];

  const features = [
    {
      icon: CheckSquare,
      title: "Registrar Competency Checker",
      description: "Visual tracker to tick off clinical registrar core competencies as you progress",
      gradient: "icon-container-secondary",
      iconColor: "text-white"
    },
    {
      icon: BookOpen,
      title: "CPD Hub with Learning Plans & Peer Consultations",
      description: "Comprehensive CPD management including structured Learning Plans with goal tracking and dedicated Peer Consultation logging with automatic hour calculations",
      gradient: "icon-container-success",
      iconColor: "text-white"
    },
    {
      icon: Zap,
      title: "Smart Logging",
      description: "Automated calculation of hours and ratios to save time and reduce errors",
      gradient: "icon-container-primary",
      iconColor: "text-white"
    },
    {
      icon: Users,
      title: "Supervisor Connection",
      description: "Seamless communication and feedback with your clinical supervisors",
      gradient: "icon-container-primary",
      iconColor: "text-white"
    },
    {
      icon: BarChart3,
      title: "Progress Dashboards",
      description: "Real-time visual tracking of your professional development journey",
      gradient: "icon-container-warning",
      iconColor: "text-white"
    },
    {
      icon: FileCheck,
      title: "Export Reports",
      description: "Generate compliant reports for AHPRA and registration requirements",
      gradient: "icon-container-primary",
      iconColor: "text-white"
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
    <div className="min-h-screen bg-gradient-primary">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-neutral/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="icon-md text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ClinMinds
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')}
                className="text-neutral hover:text-neutral-dark hover:bg-neutral"
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
              <span className="px-4 py-1.5 bg-primary-light/80 text-primary text-sm font-medium rounded-full">
                For Australian Psychologists
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-dark leading-tight">
              Your Smart, Digital
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Logbook, CPD
              </span>
              and Learning Plan Tracker
            </h1>
            
            <p className="text-lg text-neutral leading-relaxed">
              One platform that supports you from provisional internship through registrar 
              training to ongoing professional practice. Track hours, competencies, and CPD 
              requirements with confidence.
            </p>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-success/50 rounded-xl p-4 mt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="icon-md text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-success mb-1">
                    ✨ Ready for Dec 1, 2025 Standards
                  </p>
                  <p className="text-xs text-success">
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
                <ArrowRight className="icon-md ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/login')}
                className="h-14 px-8 text-base border-2 hover:bg-neutral"
              >
                Login
              </Button>
            </div>
            
            <p className="text-sm text-neutral-light">
              ✓ 7-day free trial  •  ✓ No credit card required  •  ✓ Cancel anytime
            </p>
          </div>

          {/* Right Column - Visual Card */}
          <div className="relative fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-3xl blur-3xl"></div>
            <Card className="relative card shadow-2xl">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gradient-primary rounded-xl">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="icon-md text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-dark">Smart Practice Logbook</p>
                      <p className="text-xs text-neutral">Auto-track hours & supervision ratios</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Target className="icon-md text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-dark">CPD Activity Tracking</p>
                      <p className="text-xs text-neutral">Smart tagging & compliance reports</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="icon-md text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-dark">Competency Journal</p>
                      <p className="text-xs text-neutral">Track all 8 core competencies</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="icon-md text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-dark">Peer Consultation Hub</p>
                      <p className="text-xs text-neutral">Meet mandatory 10-hour requirement</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="icon-md text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-dark">Learning Plans & Goals</p>
                      <p className="text-xs text-neutral">Set & track annual goals</p>
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
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-dark mb-4">
            Supporting Your Entire Career Journey
          </h2>
          <p className="text-lg text-neutral max-w-3xl mx-auto">
            From provisional internship to ongoing practice, ClinMinds adapts to your professional stage
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {careerStages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <Card 
                key={index}
                className="card hover:shadow-xl transition-all fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardContent className="p-6">
                  <div className={`w-16 h-16 ${stage.gradient} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-8 h-8 ${stage.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-dark mb-3">
                    {stage.title}
                  </h3>
                  <p className="text-sm text-neutral mb-4 leading-relaxed">
                    {stage.description}
                  </p>
                  <div className="space-y-2">
                    {stage.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="icon-sm bg-gradient-to-br bg-success rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="icon-sm text-white" />
                        </div>
                        <span className="text-xs text-neutral">{feature}</span>
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
        <div className="bg-gradient-soft-blue rounded-3xl p-8 md:p-12 text-white shadow-xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <Calendar className="icon-md" />
              <span className="text-sm font-bold">Effective December 1, 2025</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Built for the New Psychology Board of Australia Standards
            </h2>
            <p className="text-lg text-white/95 max-w-3xl mx-auto">
              ClinMinds is specifically designed to meet every requirement of the Psychology Board of Australia 
              Code of Conduct 2025 framework
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckSquare className="icon-md text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-dark mb-1">
                      8 Core Competencies Tracker
                    </h3>
                    <p className="text-sm text-neutral">
                      For Clinical Endorsement Registrars
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-neutral">
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
                    <Users className="icon-md text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-dark mb-1">
                      Flexible Supervision Tracking
                    </h3>
                    <p className="text-sm text-neutral">
                      Customizable to Your Requirements
                    </p>
                  </div>
                </div>
                <p className="text-sm text-neutral mb-3">
                  Configure supervision ratios according to your specific program requirements. 
                  Track individual and group supervision sessions with automated calculations.
                </p>
                <div className="bg-primary-light rounded-lg p-3">
                  <p className="text-xs font-medium text-primary">Real-time alerts when approaching your set limits</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="icon-md text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-dark mb-1">
                      Smart CPD Tracking & Tagging
                    </h3>
                    <p className="text-sm text-neutral">
                      Track hours and competency areas
                    </p>
                  </div>
                </div>
                <p className="text-sm text-neutral mb-3">
                  Separates general CPD from mandatory 10h Peer Consultation. Tag activities 
                  for "Cultural Competence," "Trauma-Informed Care," and other Psychology Board of Australia Code areas.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <div className="bg-success rounded px-2 py-1 text-xs font-medium text-success">
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
                    <Award className="icon-md text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-dark mb-1">
                      Reflexive Practice Framework
                    </h3>
                    <p className="text-sm text-neutral">
                      New 2025 Learning Plan Requirements
                    </p>
                  </div>
                </div>
                <p className="text-sm text-neutral mb-3">
                  Built-in Learning Plan feature specifically designed for "Reflexive Practice" and 
                  "Deliberate Learning" - the new 2025 regulatory requirements.
                </p>
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-orange-900">100% audit-ready for Psychology Board of Australia inspections</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button 
              size="lg"
              onClick={() => navigate('/signup')}
              className="h-14 px-8 text-base bg-white text-primary hover:bg-primary-light shadow-lg"
            >
              Start Meeting 2025 Standards Today
              <ArrowRight className="icon-md ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-neutral py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-dark mb-4">
              Powerful Features to Simplify Compliance
            </h2>
            <p className="text-lg text-neutral max-w-2xl mx-auto">
              Everything you need to track your professional development and meet regulatory requirements
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className="border-neutral/50 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 ${feature.gradient} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className={`w-7 h-7 ${feature.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-dark mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-neutral leading-relaxed">
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-light/80 rounded-full mb-4">
              <Shield className="icon-md text-primary" />
              <span className="text-sm font-semibold text-primary">Trusted & Compliant</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-dark mb-4">
              Aligned with Professional Standards
            </h2>
            <p className="text-lg text-neutral max-w-3xl mx-auto">
              Built to meet Australian regulatory requirements with your professional integrity at the forefront
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-4">
              {compliancePoints.map((point, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-neutral/50">
                  <div className="icon-md bg-gradient-to-br bg-success rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="icon-sm text-white" />
                  </div>
                  <p className="text-neutral font-medium">{point}</p>
                </div>
              ))}
            </div>
            
            <div className="space-y-6">
              <Card className="border-2 border-primary/50 bg-white shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <FileCheck className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-dark">
                        Psychology Board of Australia Code of Conduct 2025
                      </h3>
                      <p className="text-sm text-success font-semibold">✓ 100% Audit-Ready</p>
                    </div>
                  </div>
                  <p className="text-neutral mb-4">
                    Built specifically to meet the December 1, 2025 Psychology Board of Australia 
                    standards, including new requirements for Reflexive Practice and Deliberate Learning.
                  </p>
                  <div className="space-y-3 mb-4">
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-3 rounded-lg">
                      <p className="text-xs text-purple-900 font-medium">8 Core Competencies Tracked</p>
                    </div>
                    <div className="bg-gradient-primary p-3 rounded-lg">
                      <p className="text-xs text-primary font-medium">Flexible Supervision Tracking to Your Requirements</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg">
                      <p className="text-xs text-success font-medium">10h Peer Consultation & Learning Plans Tracked</p>
                    </div>
                  </div>
                  <div className="bg-neutral border border-neutral p-4 rounded-lg">
                    <p className="text-sm text-neutral font-medium mb-1">National Coverage</p>
                    <p className="text-xs text-neutral">
                      All Australian states & territories • All registration pathways
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="card shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-neutral-dark mb-4">
                    Ready to Get Started?
                  </h3>
                  <p className="text-neutral mb-6">
                    Join Australian psychologists who are simplifying their compliance and 
                    professional development tracking.
                  </p>
                  <Button 
                    size="lg"
                    onClick={() => navigate('/signup')}
                    className="w-full h-14 text-base bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                  >
                    Start Your Free Trial
                    <ArrowRight className="icon-md ml-2" />
                  </Button>
                  <p className="text-xs text-center text-neutral-light mt-4">
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
                  <BookOpen className="icon-md text-white" />
                </div>
                <span className="text-xl font-bold">ClinMinds</span>
              </div>
              <p className="text-neutral-light text-sm">
                Supporting Australian psychology registrars on their journey to full registration.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <button onClick={() => navigate('/signup')} className="block text-neutral-light hover:text-white transition-colors">
                  Sign Up
                </button>
                <button onClick={() => navigate('/login')} className="block text-neutral-light hover:text-white transition-colors">
                  Login
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-neutral-light text-sm">
                For support and inquiries, please contact us through your account dashboard.
              </p>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-neutral-light">
            <p>© 2025 ClinMinds Psychology Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
