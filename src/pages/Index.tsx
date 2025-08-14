import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuizState } from '@/hooks/useQuizState';
import { supabase } from '@/integrations/supabase/client';
import QuizInterface from '@/components/quiz/QuizInterface';
import UserWaitingScreen from '@/components/UserWaitingScreen';
import RegistrationForm from '@/components/RegistrationForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Play, Users, LogOut, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { session, refetch } = useQuizState();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      console.log('No user found');
      setIsAdmin(false);
      return;
    }

    console.log('Checking admin status for user:', user.id, user.email);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    console.log('Admin check result:', { data, error });
    
    if (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      return;
    }

    const adminStatus = data?.is_admin || false;
    console.log('Setting admin status to:', adminStatus);
    setIsAdmin(adminStatus);
  };

  // Auto-redirect users to waiting screen and admins to dashboard
  useEffect(() => {
    if (user && !loading) {
      if (isAdmin) {
        // Admin stays on index but sees admin interface
        return;
      } else if (session && !session.is_active) {
        // Regular users go to waiting screen when quiz is not active
        return;
      }
    }
  }, [user, isAdmin, session, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Live Expo Quiz
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Join the interactive quiz experience!
            </p>
          </div>
          
          <Button
            onClick={() => navigate('/auth')}
            size="lg"
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  // Show quiz interface if quiz is active
  if (session?.is_active && (session.phase === 'question' || session.phase === 'results')) {
    return <QuizInterface />;
  }

  // Show finished quiz state
  if (session?.phase === 'finished') {
    return <QuizInterface />;
  }

  // Show waiting screen for regular users when quiz is not active
  if (!isAdmin && session && !session.is_active) {
    console.log('Regular user detected, showing waiting screen');
    return <UserWaitingScreen />;
  }

  // For regular users when registration is closed but no quiz active
  if (!isAdmin && session && !session.registration_open && !session.is_active) {
    console.log('Regular user detected, registration closed, showing waiting screen');
    return <UserWaitingScreen />;
  }

  // For regular users when no session exists or registration not opened yet
  if (!isAdmin && (!session || (!session.registration_open && !session.is_active))) {
    console.log('Regular user detected, no registration available, showing waiting screen');
    return <UserWaitingScreen />;
  }

  // Pre-quiz state for admins or when users can register
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {isAdmin ? 'Live Expo Quiz - Admin Panel' : 'Live Expo Quiz'}
          </h1>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button 
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  size="sm"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button 
                  onClick={() => navigate('/admin')}
                  variant="outline"
                  size="sm"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </>
            )}
            <Button 
              onClick={signOut}
              variant="outline"
              size="sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          {isAdmin ? (
            // Admin quick actions
            <Card className="w-full max-w-2xl shadow-lg bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                  <Settings className="w-6 h-6" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Button 
                    onClick={() => {
                      console.log('Navigating to dashboard...');
                      navigate('/dashboard');
                    }}
                    size="lg"
                    className="h-20 text-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  >
                    <BarChart3 className="w-6 h-6 mr-3" />
                    <div>
                      <div>View Dashboard</div>
                      <div className="text-xs opacity-80">Monitor quiz & users</div>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => navigate('/admin')}
                    variant="outline"
                    size="lg"
                    className="h-20 text-lg"
                  >
                    <Settings className="w-6 h-6 mr-3" />
                    <div>
                      <div>Admin Settings</div>
                      <div className="text-xs opacity-80">Manage questions & config</div>
                    </div>
                  </Button>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Registration:</strong> {session?.registration_open ? 'Open' : 'Closed'} • 
                    <strong> Quiz:</strong> {session?.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Regular user registration form (only shown when registration is open)
            session?.registration_open && (
              <div className="w-full max-w-md">
                <Card className="shadow-lg">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                      <Users className="w-6 h-6" />
                      Join the Quiz
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RegistrationForm isRegistrationOpen={session?.registration_open || false} />
                  </CardContent>
                </Card>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
