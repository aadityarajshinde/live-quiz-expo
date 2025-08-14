import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuizState } from '@/hooks/useQuizState';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Play, Users, Settings, LogOut, Home, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  question_order: number;
}

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { session, currentQuestion, leaderboard, refetch } = useQuizState();
  const navigate = useNavigate();
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegisteredUsers();
    fetchAllQuestions();
  }, []);

  const fetchRegisteredUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, created_at')
      .eq('is_admin', false)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRegisteredUsers(data);
    }
    setLoading(false);
  };

  const fetchAllQuestions = async () => {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .order('question_order');

    if (!error && data) {
      setAllQuestions(data);
    }
  };

  const handleStartQuiz = async () => {
    if (!session) return;

    if (allQuestions.length === 0) {
      toast({
        title: "No Questions Available",
        description: "Please upload questions first before starting the quiz.",
        variant: "destructive",
      });
      navigate('/admin');
      return;
    }

    const firstQuestion = allQuestions[0];
    const phaseEndTime = new Date(Date.now() + 40000); // 40 seconds for question

    const { error } = await supabase
      .from('quiz_sessions')
      .update({
        is_active: true,
        registration_open: false,
        phase: 'question',
        current_question_id: firstQuestion.id,
        current_question_number: 1,
        total_questions: allQuestions.length,
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

  const getCorrectAnswerText = (question: QuizQuestion) => {
    const options = {
      'A': question.option_a,
      'B': question.option_b,
      'C': question.option_c,
      'D': question.option_d,
    };
    return options[question.correct_answer as keyof typeof options] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/')} variant="outline" size="sm">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button onClick={() => navigate('/admin')} variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Admin Settings
            </Button>
            {session?.is_active && (
              <Button onClick={() => navigate('/')} variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View Live Quiz
              </Button>
            )}
            <Button onClick={signOut} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Quiz Control Panel */}
          <div className="space-y-6">
            {/* Quiz Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Quiz Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Status:</span>
                    <Badge variant={session?.is_active ? "default" : "secondary"}>
                      {session?.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Phase:</span>
                    <Badge variant="outline">{session?.phase || 'pre-quiz'}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Registration:</span>
                    <Badge variant={session?.registration_open ? "default" : "destructive"}>
                      {session?.registration_open ? "Open" : "Closed"}
                    </Badge>
                  </div>
                </div>

                {!session?.is_active && (
                  <Button
                    onClick={handleStartQuiz}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    size="lg"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Quiz Now
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Current Question */}
            {currentQuestion && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Question</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Question {session?.current_question_number} of {session?.total_questions}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium mb-3">{currentQuestion.question}</p>
                    <div className="space-y-2">
                      <div>A. {currentQuestion.option_a}</div>
                      <div>B. {currentQuestion.option_b}</div>
                      <div>C. {currentQuestion.option_c}</div>
                      <div>D. {currentQuestion.option_d}</div>
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="font-medium text-green-700 dark:text-green-300">
                      Correct Answer: {currentQuestion.correct_answer}. {getCorrectAnswerText(currentQuestion)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Registered Users */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Registered Users ({registeredUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {registeredUsers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No users registered yet
                    </p>
                  ) : (
                    registeredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                        {/* Show if user has answered current question */}
                        {session?.is_active && currentQuestion && (
                          <Badge variant={
                            leaderboard.find(entry => entry.user_id === user.id)?.latest_answer ? "default" : "secondary"
                          }>
                            {leaderboard.find(entry => entry.user_id === user.id)?.latest_answer ? "Answered" : "Pending"}
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Live Leaderboard during quiz */}
            {session?.is_active && leaderboard.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Live Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry.user_id}
                        className="flex items-center gap-3 p-2 bg-muted rounded-lg"
                      >
                        <Badge variant={index < 3 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                        <div className="flex-1">
                          <span className="font-medium">{entry.name}</span>
                        </div>
                        <Badge variant="outline">
                          {entry.score} pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;