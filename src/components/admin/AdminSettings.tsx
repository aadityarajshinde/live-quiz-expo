import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Play, RotateCcw, Upload, LogOut, Square, Home, Users } from 'lucide-react';

interface Profile {
  is_admin: boolean;
}

const AdminSettings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questionsText, setQuestionsText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      fetchSession();
    }
  }, [user]);

  const fetchSession = async () => {
    const { data } = await supabase
      .from('quiz_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setSession(data);
    }
  };

  const checkAdminStatus = async () => {
    if (!user) {
      console.log('No user found, redirecting to auth');
      navigate('/auth');
      return;
    }

    console.log('Checking admin status for user in AdminSettings:', user.id);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single() as { data: Profile | null; error: any };

      console.log('Admin check response:', { data, error });

      if (error) {
        console.error('Error checking admin status in AdminSettings:', error);
        toast({
          title: "Error",
          description: "Failed to verify admin status",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      if (!data?.is_admin) {
        console.log('User is not admin, redirecting to home');
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      console.log('Admin verified in AdminSettings, setting state');
      setIsAdmin(true);
    } catch (error) {
      console.error('Exception in checkAdminStatus:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const uploadQuestions = async () => {
    if (!questionsText.trim()) {
      toast({
        title: "Error",
        description: "Please enter questions data",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const questions = JSON.parse(questionsText);
      
      if (!Array.isArray(questions)) {
        throw new Error('Questions must be an array');
      }

      // Clear existing questions
      const { error: clearError } = await supabase
        .from('quiz_questions')
        .delete()
        .not('id', 'is', null); // Delete all rows where id is not null (all rows)
      
      if (clearError) {
        throw clearError;
      }

      // Insert new questions
      const formattedQuestions = questions.map((q: any, index: number) => ({
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer.toUpperCase(),
        question_order: index + 1,
      }));

      const { error } = await supabase
        .from('quiz_questions')
        .insert(formattedQuestions);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${formattedQuestions.length} questions uploaded successfully`,
      });
      setQuestionsText('');
      fetchSession(); // Refresh session data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload questions",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const startRegistration = async () => {
    try {
      console.log('Starting registration...');
      const { error } = await supabase
        .from('quiz_sessions')
        .update({
          registration_open: true,
          phase: 'pre-quiz',
          is_active: false,
        })
        .not('id', 'is', null); // Update all sessions

      if (error) throw error;

      toast({
        title: "Registration Started!",
        description: "Users can now register for the quiz.",
      });
      fetchSession(); // Refresh session data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start registration",
        variant: "destructive",
      });
    }
  };

  const startQuiz = async () => {
    setStarting(true);
    try {
      console.log('Starting quiz...');
      
      // Get questions to start quiz
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
        return;
      }

      const firstQuestion = questions[0];
      const phaseEndTime = new Date(Date.now() + 40000); // 40 seconds for question

      const { error } = await supabase
        .from('quiz_sessions')
        .update({
          is_active: true,
          registration_open: false, // Close registration when quiz starts
          phase: 'question',
          current_question_id: firstQuestion.id,
          current_question_number: 1,
          total_questions: questions.length,
          phase_end_time: phaseEndTime.toISOString(),
        })
        .not('id', 'is', null); // Update all sessions

      if (error) throw error;

      toast({
        title: "Quiz Started!",
        description: "The Live Expo Quiz has begun. Registration is now closed.",
      });
      
      fetchSession(); // Refresh session data
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start quiz",
        variant: "destructive",
      });
    } finally {
      setStarting(false);
    }
  };

  const stopQuiz = async () => {
    setResetting(true);
    try {
      // Stop the quiz and set to finished state
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to stop quiz",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  const resetQuiz = async () => {
    setResetting(true);
    try {
      console.log('Starting complete quiz reset...');
      
      // 1. Clear all user answers (delete all rows)
      console.log('Clearing user answers...');
      const { error: answersError } = await supabase
        .from('user_answers')
        .delete()
        .not('id', 'is', null); // Delete all rows where id is not null (all rows)

      if (answersError) {
        console.error('Error clearing user answers:', answersError);
        throw answersError;
      }

      // 2. Delete all non-admin user profiles (registered users)
      console.log('Clearing registered users...');
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('is_admin', false);

      if (profileError) {
        console.error('Error clearing profiles:', profileError);
        throw profileError;
      }

      // 3. Reset all quiz sessions (update all rows)
      console.log('Resetting quiz sessions...');
      const { error: sessionError } = await supabase
        .from('quiz_sessions')
        .update({
          registration_open: false, // Close registration when reset
          is_active: false,
          phase: 'pre-quiz',
          current_question_id: null,
          current_question_number: 0,
          total_questions: 0,
          phase_end_time: null,
        })
        .not('id', 'is', null); // Update all rows where id is not null (all rows)

      if (sessionError) {
        console.error('Error resetting sessions:', sessionError);
        throw sessionError;
      }

      console.log('Quiz reset completed successfully');
      toast({
        title: "Complete Reset Successful!",
        description: "All quiz data, user registrations, and answers have been cleared. You can now start registration again.",
      });
      fetchSession(); // Refresh session data
    } catch (error: any) {
      console.error('Reset failed:', error);
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset quiz data",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const exampleFormat = `[
  {
    "question": "What is the capital of France?",
    "option_a": "London",
    "option_b": "Berlin", 
    "option_c": "Paris",
    "option_d": "Madrid",
    "correct_answer": "C"
  },
  {
    "question": "Which planet is known as the Red Planet?",
    "option_a": "Venus",
    "option_b": "Mars",
    "option_c": "Jupiter", 
    "option_d": "Saturn",
    "correct_answer": "B"
  }
]`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Admin Settings
          </h1>
          <div className="flex gap-2">
            <Button onClick={() => {
              console.log('Navigating to dashboard from AdminSettings...');
              navigate('/dashboard');
            }} variant="outline" size="sm">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" size="sm">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Question Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="questions">Questions (JSON Format)</Label>
                <Textarea
                  id="questions"
                  value={questionsText}
                  onChange={(e) => setQuestionsText(e.target.value)}
                  placeholder={exampleFormat}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <Button 
                onClick={uploadQuestions} 
                disabled={uploading}
                className="w-full"
              >
                {uploading ? 'Uploading...' : 'Upload Questions'}
              </Button>
            </CardContent>
          </Card>

          {/* Quiz Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Registration Control */}
              {!session?.registration_open && !session?.is_active && (
                <Button 
                  onClick={startRegistration}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  size="lg"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Start Registration
                </Button>
              )}
              
              {/* Quiz Start Control */}
              {session?.registration_open && !session?.is_active && (
                <Button 
                  onClick={startQuiz} 
                  disabled={starting}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {starting ? 'Starting Quiz...' : 'Start Quiz Contest'}
                </Button>
              )}
              
              {/* Stop Quiz Control */}
              {session?.is_active && (
                <Button 
                  onClick={stopQuiz} 
                  disabled={resetting}
                  variant="secondary"
                  className="w-full"
                  size="lg"
                >
                  <Square className="w-5 h-5 mr-2" />
                  {resetting ? 'Stopping...' : 'Stop Quiz'}
                </Button>
              )}
              
              {/* Reset Control */}
              <Button 
                onClick={resetQuiz} 
                disabled={resetting}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                {resetting ? 'Resetting All Data...' : 'Complete Reset (Clear Everything)'}
              </Button>

              {/* Status Display */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Registration:</span>
                    <span className={session?.registration_open ? "text-green-600" : "text-red-600"}>
                      {session?.registration_open ? "Open" : "Closed"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Quiz Status:</span>
                    <span className={session?.is_active ? "text-green-600" : "text-gray-600"}>
                      {session?.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Phase:</span>
                    <span className="capitalize">{session?.phase || 'Pre-quiz'}</span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Start Registration:</strong> Opens registration for new users</p>
                <p><strong>Start Quiz:</strong> Begins the contest and closes registration</p>
                <p><strong>Stop Quiz:</strong> Ends the current quiz and shows final results</p>
                <p><strong>Complete Reset:</strong> ⚠️ Clears ALL data - users, answers, and sessions</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;