'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import EventList from '@/components/events/EventList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUser } from '@/lib/api';
import Link from 'next/link';
import { Opulento } from "uvcanvas";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [shouldRefresh, setShouldRefresh] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      checkUserRole(storedToken);
    }
  }, []);

  const checkUserRole = async (token: string) => {
    try {
      const user = await getCurrentUser(token);
      setIsAdmin(user.role === 'admin');
    } catch (error) {
      console.error('Failed to get user role:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAdmin(false);
    toast({
      title: 'Success',
      description: 'Logged out successfully!',
    });
  };

  const handleEventCreated = () => {
    setShouldRefresh(prev => prev + 1);
  };

  if (!token) {
    return (
      <main className="min-h-screen w-full relative flex items-center justify-center p-4">
        <div className="fixed inset-0 -z-10">
          <Opulento />
        </div>

        <div className="max-w-6xl w-full mx-auto border border-white/30 rounded-2xl p-12 bg-black/40 backdrop-blur-md">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">EventHub</span>
            </h1>
            <p className="text-gray-200 text-lg drop-shadow-md">
              Join us to discover and participate in amazing events!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* User Access Card */}
            <div className="backdrop-blur-md bg-black/50 p-8 rounded-2xl shadow-xl border border-white/20 hover:border-white/40 transition-all hover:bg-black/60">
              <h2 className="text-2xl font-semibold mb-4 text-white">
                User Access
              </h2>
              <p className="text-gray-300 mb-6">
                Register or login to:
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-200">
                  <span className="mr-2 text-violet-400">•</span>
                  View upcoming events
                </li>
                <li className="flex items-center text-gray-200">
                  <span className="mr-2 text-violet-400">•</span>
                  Register for events
                </li>
                <li className="flex items-center text-gray-200">
                  <span className="mr-2 text-violet-400">•</span>
                  Track your registrations
                </li>
              </ul>
              <div className="flex gap-4">
                <Link href="/login">
                  <button className="px-6 py-2.5 bg-white/90 hover:bg-white text-gray-900 rounded-lg transition-all font-medium hover:shadow-lg hover:shadow-white/20">
                    Login
                  </button>
                </Link>
                <Link href="/register">
                  <button className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all font-medium hover:shadow-lg hover:shadow-violet-500/30">
                    Register
                  </button>
                </Link>
              </div>
            </div>

            {/* Admin Access Card */}
            <div className="backdrop-blur-md bg-black/50 p-8 rounded-2xl shadow-xl border border-white/20 hover:border-white/40 transition-all hover:bg-black/60">
              <h2 className="text-2xl font-semibold mb-4 text-white">
                Admin Access
              </h2>
              <p className="text-gray-300 mb-6">
                Admin portal for:
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-200">
                  <span className="mr-2 text-fuchsia-400">•</span>
                  Event management
                </li>
                <li className="flex items-center text-gray-200">
                  <span className="mr-2 text-fuchsia-400">•</span>
                  User management
                </li>
                <li className="flex items-center text-gray-200">
                  <span className="mr-2 text-fuchsia-400">•</span>
                  Registration tracking
                </li>
              </ul>
              <Link href="/admin/login">
                <button className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-lg transition-all font-medium hover:shadow-lg hover:shadow-fuchsia-500/30">
                  Admin Login
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <Layout token={token} onLogout={handleLogout} isAdmin={isAdmin} onEventCreated={handleEventCreated}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Events</h1>
          {isAdmin && (
            <button
              onClick={() => router.push('/admin')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Go to Admin Dashboard
            </button>
          )}
        </div>
        <EventList token={token} isAdmin={isAdmin} key={shouldRefresh} />
      </div>
    </Layout>
  );
}
