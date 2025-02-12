'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import LoginForm from '@/components/auth/LoginForm';

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
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    </Layout>
  );
} 