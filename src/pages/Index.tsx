import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuizState } from '@/hooks/useQuizState';
import { supabase } from '@/integrations/supabase/client';
import QuizInterface from '@/components/quiz/QuizInterface';
import RegistrationForm from '@/components/RegistrationForm';
import RegisteredUsersList from '@/components/admin/RegisteredUsersList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Play, Users, LogOut } from 'lucide-react';
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

  const handleStartQuiz = async () => {
    if (!isAdmin || !session) return;

    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('id')
      .order('question_order');

    if (!questions || questions.length === 0) {
      toast({
        title: "No Questions Available",
        description: "Please upload questions first before starting the quiz.",
        variant: "destructive",
      });
      navigate('/admin');
      return;
    }

    const firstQuestion = questions[0];
    const phaseEndTime = new Date(Date.now() + 40000); // 40 seconds for question

    const { error } = await supabase
      .from('quiz_sessions')
      .update({
        is_active: true,
        registration_open: false,
        phase: 'question',
        current_question_id: firstQuestion.id,
        current_question_number: 1,
        total_questions: questions.length,
        phase_end_time: phaseEndTime.toISOString(),
      })
      .eq('id', session.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to start quiz. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Quiz Started!",
        description: "The Live Expo Quiz has begun. Good luck to all participants!",
      });
      refetch();
    }
  };

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

  // Pre-quiz state
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Live Expo Quiz
          </h1>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button 
                  onClick={() => navigate('/admin')}
                  variant="outline"
                  size="sm"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Settings
                </Button>
                {session?.registration_open === false && !session.is_active && (
                  <Button 
                    onClick={handleStartQuiz}
                    size="sm"
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Quiz Contest
                  </Button>
                )}
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
          {/* Show admin controls prominently if user is admin */}
          {isAdmin ? (
            <div className="w-full max-w-4xl space-y-6">
              {/* Admin Dashboard Card */}
              <Card className="shadow-lg bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Settings className="w-6 h-6" />
                    Admin Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Button 
                      onClick={() => navigate('/admin')}
                      size="lg"
                      className="h-16 text-lg"
                    >
                      <Settings className="w-5 h-5 mr-2" />
                      Manage Settings
                    </Button>
                    
                    <Button 
                      onClick={handleStartQuiz}
                      size="lg"
                      className="h-16 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Start Quiz Now
                    </Button>

                    <Button 
                      onClick={() => navigate('/admin')}
                      variant="outline"
                      size="lg"
                      className="h-16 text-lg"
                    >
                      View Quiz & Leaderboard
                    </Button>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Quiz Status:</strong> {session?.registration_open ? 'Registration Open' : 'Registration Closed'}
                      {session?.is_active && ' • Quiz Active'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Show Registered Users for Admin */}
              <RegisteredUsersList />
            </div>
          ) : (
            /* Regular user view */
            session?.registration_open ? (
              <div className="w-full max-w-md">
                <Card className="shadow-lg">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                      <Users className="w-6 h-6" />
                      Join the Quiz
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RegistrationForm isRegistrationOpen={true} />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="w-full max-w-md mx-auto shadow-lg">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold">
                    Registration Closed
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="p-6 bg-muted rounded-lg">
                    <p className="text-muted-foreground">
                      Registration is currently closed. Please wait for the next quiz to begin.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
