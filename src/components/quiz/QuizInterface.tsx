import { useAuth } from '@/hooks/useAuth';
import { useQuizState } from '@/hooks/useQuizState';
import QuestionPanel from './QuestionPanel';
import LeaderboardPanel from './LeaderboardPanel';
import QuizTimer from './QuizTimer';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Crown } from 'lucide-react';

const QuizInterface = () => {
  const { user } = useAuth();
  const { 
    session, 
    currentQuestion, 
    leaderboard, 
    timeLeft, 
    loading, 
    submitAnswer 
  } = useQuizState();

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
          </h1>
          <div className="text-sm text-muted-foreground">
            Welcome, {user?.email}
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