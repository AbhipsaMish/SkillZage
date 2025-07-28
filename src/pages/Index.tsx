import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookOpen, Users, Trophy, ArrowRight, Sparkles, Rocket, Zap, Star } from 'lucide-react';
import AuthModal from '@/components/AuthModal';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect based on user role
      if (profile.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary">
        <div className="text-center animate-fade-in">
          <GraduationCap className="h-16 w-16 mx-auto text-primary mb-4" />
          <p className="text-muted-foreground text-lg">Preparing your learning journey...</p>
        </div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen">
      {/* Clean Header */}
      <header className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">SKILLZAGE</h1>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setIsAuthModalOpen(true)}
            >
              Sign In
            </Button>
            <Button 
              onClick={() => setIsAuthModalOpen(true)}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background pt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="h-4 w-4 mr-2" />
                Welcome to the Future of Learning
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground">
              Learn Without 
              <span className="gradient-text"> Limits</span>
            </h1>
            
            <p className="text-xl mb-8 text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Access university courses and public learning materials. Unlock your potential with 
              video-based learning, quizzes, and progress tracking.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => setIsAuthModalOpen(true)}
              >
                <Rocket className="h-5 w-5 mr-2" />
                Start Learning Today
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6"
                onClick={() => navigate('/dashboard')}
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Explore Courses
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Why Choose SKILLZAGE?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience learning like never before with our comprehensive platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300 card-hover">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-3">
                  University Access
                </CardTitle>
                <CardDescription className="text-base">
                  Students with university codes get free access to assigned courses
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 card-hover">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-3">
                  Public Marketplace
                </CardTitle>
                <CardDescription className="text-base">
                  Browse and purchase courses from our extensive public library
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 card-hover">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-3">
                  Track Progress
                </CardTitle>
                <CardDescription className="text-base">
                  Monitor your learning journey with quizzes and completion tracking
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 bg-gradient-to-br from-primary/5 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <Card className="max-w-3xl mx-auto border-primary/20">
            <CardHeader className="pb-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Rocket className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Future?
              </CardTitle>
              <CardDescription className="text-lg leading-relaxed">
                Join thousands of students already learning on SKILLZAGE
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <Button 
                size="lg" 
                onClick={() => setIsAuthModalOpen(true)} 
                className="text-lg px-10 py-6"
              >
                <Star className="h-5 w-5 mr-2" />
                Create Your Account
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t">
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">SKILLZAGE</span>
          </div>
          <p className="text-muted-foreground">
            &copy; 2024 Skillzage. All rights reserved. Crafted with care for learners worldwide.
          </p>
        </div>
      </footer>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

export default Index;
