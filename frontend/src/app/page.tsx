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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to EventHub</h1>
            <p className="text-lg text-gray-600">Join us to discover and participate in amazing events!</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>User Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">Register or login to:</p>
                <ul className="list-disc list-inside text-gray-600 mb-4">
                  <li>View upcoming events</li>
                  <li>Register for events</li>
                  <li>Track your registrations</li>
                </ul>
                <div className="space-x-4">
                  <Link href="/login">
                    <Button variant="outline">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Register</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Admin Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">Admin portal for:</p>
                <ul className="list-disc list-inside text-gray-600 mb-4">
                  <li>Event management</li>
                  <li>User management</li>
                  <li>Registration tracking</li>
                </ul>
                <Link href="/admin/login">
                  <Button variant="outline">Admin Login</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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
