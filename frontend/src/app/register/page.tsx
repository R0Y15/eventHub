'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RegisterForm from '@/components/auth/RegisterForm';
import AuthLayout from '@/components/auth/AuthLayout';
import { AnimatePresence } from 'framer-motion';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/');
    }
  }, [router]);

  const handleRegisterSuccess = (token: string) => {
    localStorage.setItem('token', token);
    router.push('/');
  };

  return (
    <AnimatePresence mode="wait">
      <AuthLayout>
        <h1 className="text-center text-3xl font-bold text-white mb-8">Register</h1>
        <RegisterForm onSuccess={handleRegisterSuccess} />
        <div className="mt-4 text-center">
          <p className="text-gray-200">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
              Login here
            </Link>
          </p>
        </div>
      </AuthLayout>
    </AnimatePresence>
  );
} 