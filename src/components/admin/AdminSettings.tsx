import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Play, RotateCcw, Upload, LogOut } from 'lucide-react';

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

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single() as { data: Profile | null; error: any };

    if (error || !data?.is_admin) {
      navigate('/');
      return;
    }

    setIsAdmin(true);
    setLoading(false);
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
      await supabase.from('quiz_questions').delete().gt('id', 0);

      // Insert new questions
      const formattedQuestions = questions.map((q: any, index: number) => ({
        question: q.question,
        option_a: q.options[0] || q.option_a,
        option_b: q.options[1] || q.option_b,
        option_c: q.options[2] || q.option_c,
        option_d: q.options[3] || q.option_d,
        correct_answer: q.correct_answer || q.answer,
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

  const startQuiz = async () => {
    setStarting(true);
    try {
      // Get all questions count
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('id')
        .order('question_order');

      if (questionsError) throw questionsError;

      if (!questions || questions.length === 0) {
        toast({
          title: "Error",
          description: "No questions available. Please upload questions first.",
          variant: "destructive",
        });
        return;
      }

      // Get the first question
      const firstQuestion = questions[0];

      // Update session to start quiz
      const phaseEndTime = new Date(Date.now() + 40000); // 40 seconds for question phase

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
        .eq('is_active', false);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quiz started successfully!",
      });
      
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
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correct_answer": "C"
  },
  {
    "question": "Which planet is known as the Red Planet?",
    "options": ["Venus", "Mars", "Jupiter", "Saturn"],
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
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
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
              <Button 
                onClick={startQuiz} 
                disabled={starting}
                className="w-full"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                {starting ? 'Starting...' : 'Start Quiz Contest'}
              </Button>
              
              <Button 
                onClick={resetQuiz} 
                disabled={resetting}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                {resetting ? 'Resetting...' : 'Reset Quiz'}
              </Button>

              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Start Quiz:</strong> Begins the contest and disables new registrations</p>
                <p><strong>Reset Quiz:</strong> Clears all data and enables new registrations</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;