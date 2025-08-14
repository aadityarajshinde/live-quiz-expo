import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuizState } from '@/hooks/useQuizState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Users, LogOut, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserWaitingScreen = () => {
  const { user, signOut } = useAuth();
  const { session } = useQuizState();
  const navigate = useNavigate();

  // Auto-redirect to quiz when it starts
  useEffect(() => {
    if (session?.is_active && (session.phase === 'question' || session.phase === 'results')) {
      console.log('Quiz started, redirecting user to quiz interface');
      navigate('/');
    }
  }, [session?.is_active, session?.phase, navigate]);

  // Auto-refresh every second for immediate updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to ensure fresh data display
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">
              You're All Set!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="p-6 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/20">
              <p className="text-muted-foreground mb-4">
                {session?.registration_open ? (
                  "Registration is currently open! Please register to participate in the quiz. Once the admin starts the quiz session, you'll be automatically redirected to the live quiz interface."
                ) : session?.is_active ? (
                  "The quiz is currently active! You'll be automatically redirected to the quiz interface."
                ) : session?.phase === 'finished' ? (
                  "The quiz has ended. Thank you for your participation!"
                ) : (
                  "You're all set! Once the admin opens registration and starts the quiz session, you'll be automatically redirected to the live quiz interface."
                )}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  {session?.registration_open ? "Registration open - Please register" : 
                   session?.is_active ? "Quiz in progress..." : 
                   "Waiting for admin to start registration"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Registration:</span>
                <span className={`text-sm ${session?.registration_open ? 'text-green-600' : 'text-red-600'}`}>
                  {session?.registration_open ? "Open" : "Closed"}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Quiz Status:</span>
                <span className={`text-sm ${session?.is_active ? 'text-green-600' : 'text-gray-600'}`}>
                  {session?.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Quiz Phase:</span>
                <span className="text-sm text-muted-foreground capitalize">
                  {session?.phase || 'Pre-quiz'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                <Users className="w-4 h-4" />
                <span>Logged in as: {user?.email}</span>
              </div>
              
              <Button 
                onClick={signOut} 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserWaitingScreen;