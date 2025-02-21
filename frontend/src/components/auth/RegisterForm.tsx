import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { register } from '@/lib/api';
import { useToast } from '../ui/use-toast';

interface RegisterFormProps {
  onSuccess: (token: string) => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await register({ name, email, password });
      onSuccess(data.token);
      toast({
        title: 'Success',
        description: 'Registered successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to register',
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
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 h-12 px-4"
            />
          </div>
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
          <Button 
            type="submit" 
            className="w-full bg-white hover:bg-gray-100 text-gray-900 h-12 font-medium transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Register'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
