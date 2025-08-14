import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';

interface RegistrationFormProps {
  isRegistrationOpen: boolean;
}

const RegistrationForm = ({ isRegistrationOpen }: RegistrationFormProps) => {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent registration if registration is closed
    if (!isRegistrationOpen) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      const result = await signUp(formData.email, formData.password, formData.name);
      if (!result.error) {
        setFormData({ name: '', email: '', password: '' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isRegistrationOpen) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* Registration Status Alert - Closed */}
        <Alert className="border-destructive/50 text-destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            Registration is currently closed
          </AlertDescription>
        </Alert>
        
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Registration Closed
            </CardTitle>
            <CardDescription>
              Registration is currently closed. Please wait for the admin to open registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="p-6 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                The admin will open registration when ready. Please wait for the registration to begin!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Registration Status Alert - Open */}
      <Alert className="border-green-500/50 text-green-700 bg-green-50">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription className="font-medium">
          Registration is open - Join now!
        </AlertDescription>
      </Alert>
      
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Join the Quiz
          </CardTitle>
          <CardDescription>
            Register to participate in the Live Expo Quiz
          </CardDescription>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Create a password"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !isRegistrationOpen}
          >
            {isSubmitting ? 'Registering...' : 'Register for Quiz'}
          </Button>
        </form>
      </CardContent>
    </Card>
    </div>
  );
};

export default RegistrationForm;