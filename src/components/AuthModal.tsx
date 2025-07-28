import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, GraduationCap } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [hasUniversity, setHasUniversity] = useState(false);
  const [universityCode, setUniversityCode] = useState('');
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const resetForm = () => {
    setSignInEmail('');
    setSignInPassword('');
    setSignUpEmail('');
    setSignUpPassword('');
    setSignUpName('');
    setUniversityCode('');
    setHasUniversity(false);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signInEmail.trim() || !signInPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const { error } = await signIn(signInEmail, signInPassword);
      
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message || "Invalid email or password",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        handleClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signUpEmail.trim() || !signUpPassword || !signUpName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    if (hasUniversity && !universityCode.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your university code",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const { error } = await signUp(
        signUpEmail, 
        signUpPassword, 
        signUpName, 
        hasUniversity ? universityCode : undefined
      );
      
      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message || "Failed to create account",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        handleClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-md border-0 shadow-2xl bg-white"
      >
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div>
              <h2 
                className="text-2xl font-bold" 
                style={{ color: '#11283F' }}
              >
                Skillzage
              </h2>
              <p 
                className="text-sm" 
                style={{ color: '#486584' }}
              >
                Access your courses and continue learning
              </p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList 
              className="grid w-full grid-cols-2 border-0 bg-gray-200"
            >
              <TabsTrigger 
                value="signin"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-800 text-gray-600 font-medium"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-800 text-gray-600 font-medium"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label 
                    htmlFor="modal-signin-email"
                    style={{ color: '#11283F' }}
                    className="font-medium"
                  >
                    Email
                  </Label>
                  <Input
                    id="modal-signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    className="border-2 focus:ring-2"
                    style={{ 
                      borderColor: '#9FB8D4',
                      backgroundColor: 'white',
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label 
                    htmlFor="modal-signin-password"
                    style={{ color: '#11283F' }}
                    className="font-medium"
                  >
                    Password
                  </Label>
                  <Input
                    id="modal-signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    className="border-2 focus:ring-2"
                    style={{ 
                      borderColor: '#9FB8D4',
                      backgroundColor: 'white',
                    }}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full font-semibold text-white hover:opacity-90 transition-opacity" 
                  disabled={isLoading}
                  style={{ backgroundColor: '#FA8231' }}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label 
                    htmlFor="modal-signup-name"
                    style={{ color: '#11283F' }}
                    className="font-medium"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="modal-signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    required
                    className="border-2 focus:ring-2"
                    style={{ 
                      borderColor: '#9FB8D4',
                      backgroundColor: 'white',
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label 
                    htmlFor="modal-signup-email"
                    style={{ color: '#11283F' }}
                    className="font-medium"
                  >
                    Email
                  </Label>
                  <Input
                    id="modal-signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    className="border-2 focus:ring-2"
                    style={{ 
                      borderColor: '#9FB8D4',
                      backgroundColor: 'white',
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label 
                    htmlFor="modal-signup-password"
                    style={{ color: '#11283F' }}
                    className="font-medium"
                  >
                    Password
                  </Label>
                  <Input
                    id="modal-signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    className="border-2 focus:ring-2"
                    style={{ 
                      borderColor: '#9FB8D4',
                      backgroundColor: 'white',
                    }}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="modal-has-university"
                    checked={hasUniversity}
                    onCheckedChange={(checked) => setHasUniversity(checked as boolean)}
                    className="border-2 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    style={{ borderColor: '#9FB8D4' }}
                  />
                  <Label 
                    htmlFor="modal-has-university" 
                    className="text-sm font-medium"
                    style={{ color: '#11283F' }}
                  >
                    Do you belong to a university?
                  </Label>
                </div>
                
                {hasUniversity && (
                  <div className="space-y-2">
                    <Label 
                      htmlFor="modal-university-code"
                      style={{ color: '#11283F' }}
                      className="font-medium"
                    >
                      University Code
                    </Label>
                    <Input
                      id="modal-university-code"
                      type="text"
                      placeholder="Enter your university code"
                      value={universityCode}
                      onChange={(e) => setUniversityCode(e.target.value)}
                      required
                      className="border-2 focus:ring-2"
                      style={{ 
                        borderColor: '#9FB8D4',
                        backgroundColor: 'white',
                      }}
                    />
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full font-semibold text-white hover:opacity-90 transition-opacity" 
                  disabled={isLoading}
                  style={{ backgroundColor: '#FA8231' }}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;