'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { login, getCurrentUser } from '@/lib/api';
import AuthLayout from '@/components/auth/AuthLayout';
import { AnimatePresence } from 'framer-motion';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkUserRole(token);
    }
  }, []);

  const checkUserRole = async (token: string) => {
    try {
      const user = await getCurrentUser(token);
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        localStorage.removeItem('token');
        toast({
          title: 'Error',
          description: 'Access denied. Admin privileges required.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to get user role:', error);
      localStorage.removeItem('token');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await login({ email, password });
      if (data.user.role !== 'admin') {
        toast({
          title: 'Error',
          description: 'Access denied. Admin privileges required.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      localStorage.setItem('token', data.token);
      router.push('/admin');
      toast({
        title: 'Success',
        description: 'Logged in successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to login',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <AuthLayout>
        <h1 className="text-center text-3xl font-bold text-white mb-8">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 h-12 px-4"
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 h-12 px-4"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-white hover:bg-gray-100 text-gray-900 h-12 font-medium transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Login as Admin'}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link 
            href="/login" 
            className="text-gray-200 hover:text-white transition-colors text-sm"
          >
            Return to User Login
          </Link>
        </div>
      </AuthLayout>
    </AnimatePresence>
  );
} 