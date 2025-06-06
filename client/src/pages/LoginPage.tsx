import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['student', 'faculty']),
  phone: z.string().optional(),
  department: z.string().optional(),
  cgpa: z.string().optional(),
});

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const { login } = useAuthStore();
  const { toast } = useToast();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'student',
      phone: '',
      department: '',
      cgpa: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      return response.json();
    },
    onSuccess: (data) => {
      login(data.token, data.user);
      toast({ title: 'Success', description: 'Login successful!' });

      if (data.user.role === 'student') {
        setLocation('/');
      } else {
        setLocation('/faculty');
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Login failed',
        variant: 'destructive',
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof registerSchema>) => {
      const response = await apiRequest('POST', '/api/auth/register', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Account created successfully! Please login.' });
      setIsLogin(true);
      registerForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Registration failed',
        variant: 'destructive',
      });
    },
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(data);
  };

  const loginAsDemo = (role: 'student' | 'faculty') => {
    const email = role === 'student' ? 'john.smith@college.edu' : 'rajesh.kumar@college.edu';
    loginMutation.mutate({ email, password: 'password123' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="text-white text-2xl" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">ACEPlacementHub</h1>
          <p className="text-neutral-500">Campus Job Portal</p>
        </div>

        {isLogin ? (
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="student@college.edu"
                {...loginForm.register('email')}
                className="w-full"
              />
              {loginForm.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...loginForm.register('password')}
                className="w-full"
              />
              {loginForm.formState.errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <Checkbox className="mr-2" />
                <span className="text-sm text-neutral-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary hover:text-primary/80">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="text-center">
              <span className="text-neutral-500 text-sm">Don't have an account? </span>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Sign up
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-2">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...registerForm.register('firstName')}
                />
                {registerForm.formState.errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">
                    {registerForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 mb-2">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  placeholder="Smith"
                  {...registerForm.register('lastName')}
                />
                {registerForm.formState.errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">
                    {registerForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@college.edu"
                {...registerForm.register('email')}
              />
              {registerForm.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...registerForm.register('password')}
              />
              {registerForm.formState.errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="role" className="block text-sm font-medium text-neutral-700 mb-2">
                Role
              </Label>
              <select
                id="role"
                {...registerForm.register('role')}
                className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center">
              <span className="text-neutral-500 text-sm">Already have an account? </span>
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-neutral-200">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 text-sm"
              onClick={() => loginAsDemo('student')}
              disabled={loginMutation.isPending}
            >
              <GraduationCap size={16} className="mr-2" />
              Demo Student
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-sm"
              onClick={() => loginAsDemo('faculty')}
              disabled={loginMutation.isPending}
            >
              <GraduationCap size={16} className="mr-2" />
              Demo Faculty
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}