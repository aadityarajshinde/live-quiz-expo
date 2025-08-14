import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuizState } from '@/hooks/useQuizState';
import { supabase } from '@/integrations/supabase/client';
import QuizInterface from '@/components/quiz/QuizInterface';
import RegistrationForm from '@/components/RegistrationForm';
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
      setIsAdmin(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    setIsAdmin(data?.is_admin || false);
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
          {session?.registration_open ? (
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
                  {isAdmin && (
                    <p className="text-sm text-primary mt-2">
                      Use the Admin Settings to reset the quiz for new registrations.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
