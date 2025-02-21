import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { login, guestLogin } from '@/lib/api';
import { useToast } from '../ui/use-toast';

interface LoginFormProps {
  onSuccess: (token: string) => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await login({ email, password });
      onSuccess(data.token);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      const data = await guestLogin();
      onSuccess(data.token);
      toast({
        title: 'Success',
        description: 'Logged in as guest!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to login as guest',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
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
          <div className="space-y-2">
            <Button 
              type="submit" 
              className="w-full bg-white hover:bg-gray-100 text-gray-900 h-12 font-medium transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Login'}
            </Button>
            <Button
              type="button"
              className="w-full bg-white hover:bg-gray-100 text-gray-900 h-12 font-medium transition-colors"
              onClick={handleGuestLogin}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Continue as Guest'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}