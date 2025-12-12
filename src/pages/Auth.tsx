import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, MapPin, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255, 'Email too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password too long'),
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long').optional(),
  city: z.string().trim().min(1, 'City is required').max(100, 'City too long').optional(),
});
export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate inputs with zod
      const validationData = isLogin 
        ? { email, password } 
        : { email, password, name, city };
      
      const result = authSchema.safeParse(validationData);
      if (!result.success) {
        const firstError = result.error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (isLogin) {
        const { error } = await login(email, password);
        if (error) {
          toast({
            title: "Login Failed",
            description: error.message || "Invalid email or password.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
      } else {
        const { error } = await register(email, password, name, city);
        if (error) {
          toast({
            title: "Registration Failed",
            description: error.message || "Could not create account.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        toast({
          title: "Account created!",
          description: "Welcome to CIMS.",
        });
      }
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabSwitch = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setShowForgotPassword(false);
    setResetEmailSent(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    const emailResult = z.string().email().safeParse(email);
    if (!emailResult.success) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      setResetEmailSent(true);
      toast({
        title: "Reset Email Sent",
        description: "Check your email for a password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="gradient-hero px-6 pt-12 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">C</span>
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">
            CIMS
          </h1>
          <p className="text-primary-foreground/80 text-sm">
            Civic Issue Management System
          </p>
        </motion.div>
      </div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="px-6 -mt-10"
      >
        <div className="bg-card rounded-2xl shadow-lg p-6 max-w-md mx-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg">
            <button
              onClick={() => handleTabSwitch(true)}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin 
                  ? 'bg-card shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => handleTabSwitch(false)}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin 
                  ? 'bg-card shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        className="pl-10"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="city"
                        type="text"
                        placeholder="Enter your city"
                        className="pl-10"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isLogin && !showForgotPassword && (
                <button 
                  type="button" 
                  className="text-sm text-primary hover:underline"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot password?
                </button>
              )}

              {showForgotPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 p-4 bg-muted rounded-lg"
                >
                  {resetEmailSent ? (
                    <div className="text-center space-y-2">
                      <CheckCircle className="h-8 w-8 text-success mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Password reset email sent! Check your inbox.
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setResetEmailSent(false);
                        }}
                      >
                        Back to login
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Enter your email above and click the button below to receive a password reset link.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleForgotPassword}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowForgotPassword(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </motion.form>
          </AnimatePresence>

          <p className="text-center text-sm text-muted-foreground mt-6">
            By continuing, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      </motion.div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-8 pb-6">
        © 2024 Civic Issue Management System
      </p>
    </div>
  );
}
