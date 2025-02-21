'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';
import AuthLayout from '@/components/auth/AuthLayout';
import { AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/');
    }
  }, [router]);

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('token', token);
    router.push('/');
  };

  return (
    <AnimatePresence mode="wait">
      <AuthLayout>
        <h1 className="text-center text-3xl font-bold text-white mb-8">Login</h1>
        <LoginForm onSuccess={handleLoginSuccess} />
        <div className="mt-4 text-center">
          <p className="text-gray-200">
            Don't have an account?{' '}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </AuthLayout>
    </AnimatePresence>
  );
} 