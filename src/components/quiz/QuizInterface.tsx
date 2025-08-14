import { useAuth } from '@/hooks/useAuth';
import { useQuizState } from '@/hooks/useQuizState';
import { useQuizController } from '@/hooks/useQuizController';
import QuestionPanel from './QuestionPanel';
import LeaderboardPanel from './LeaderboardPanel';
import QuizTimer from './QuizTimer';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Crown, Settings, Home, Square, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const QuizInterface = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [resetting, setResetting] = useState(false);
  
  const { 
    session, 
    currentQuestion, 
    leaderboard, 
    timeLeft, 
    loading, 
    submitAnswer,
    refetch
  } = useQuizState();
  
  // Initialize quiz controller for admins
  useQuizController();

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (!error && data?.is_admin) {
      setIsAdmin(true);
    }
  };

  const stopQuiz = async () => {
    setStopping(true);
    try {
      const { error } = await supabase
        .from('quiz_sessions')
        .update({
          is_active: false,
          phase: 'finished',
          phase_end_time: null,
        })
        .eq('is_active', true);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quiz stopped successfully!",
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to stop quiz",
        variant: "destructive",
      });
    } finally {
      setStopping(false);
    }
  };

  const resetQuiz = async () => {
    setResetting(true);
    try {
      // Clear all user answers
      await supabase.from('user_answers').delete().gt('id', 0);

      // Reset session
      const { error } = await supabase
        .from('quiz_sessions')
        .update({
          is_active: false,
          registration_open: true,
          phase: 'pre-quiz',
          current_question_id: null,
          current_question_number: 0,
          total_questions: 0,
          phase_end_time: null,
        })
        .eq('is_active', true);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quiz reset successfully!",
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset quiz",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  const handleAnswerSubmit = async (answer: string) => {
    if (!user || !session || !currentQuestion) return;

    try {
      await submitAnswer(currentQuestion.id, answer, session.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit answer",
        variant: "destructive",
      });
    }
  };

  // Check if user has answered current question
  const userAnswer = leaderboard.find(entry => entry.user_id === user?.id);
  const hasAnswered = !!userAnswer?.latest_answer;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="text-lg">Loading quiz...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="text-center">
          <p className="text-lg">No active quiz session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="container mx-auto p-6 h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Live Expo Quiz
            {isAdmin && <span className="ml-2 text-xs bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-2 py-1 rounded-full">ADMIN</span>}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Welcome, {user?.email}
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button onClick={() => navigate('/dashboard')} variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button onClick={() => navigate('/admin')} variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Settings
                </Button>
                {session?.is_active && (
                  <Button 
                    onClick={stopQuiz} 
                    disabled={stopping}
                    variant="secondary" 
                    size="sm"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    {stopping ? 'Stopping...' : 'Stop Quiz'}
                  </Button>
                )}
                <Button 
                  onClick={resetQuiz} 
                  disabled={resetting}
                  variant="destructive" 
                  size="sm"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {resetting ? 'Resetting...' : 'Reset'}
                </Button>
              </div>
            )}
            <Button onClick={signOut} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
          {/* Question Panel */}
          <div className="space-y-4">
            <QuestionPanel
              question={currentQuestion}
              questionNumber={session.current_question_number}
              totalQuestions={session.total_questions}
              timeLeft={timeLeft}
              phase={session.phase === 'question' ? 'question' : 'results'}
              onAnswerSubmit={handleAnswerSubmit}
              hasAnswered={hasAnswered}
              correctAnswer={session.phase === 'results' ? currentQuestion?.correct_answer : undefined}
            />
          </div>

          {/* Leaderboard Panel */}
          <div className="space-y-4">
            <LeaderboardPanel
              leaderboard={leaderboard}
              phase={session.phase}
              showAnswers={session.phase === 'results'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizInterface;