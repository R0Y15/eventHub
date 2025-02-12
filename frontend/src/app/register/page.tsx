'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import RegisterForm from '@/components/auth/RegisterForm';

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
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center">
        <RegisterForm onSuccess={handleRegisterSuccess} />
      </div>
    </Layout>
  );
} 