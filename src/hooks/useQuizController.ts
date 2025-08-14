import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useQuizController = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.user.id)
        .single();

      if (!error && data?.is_admin) {
        setIsAdmin(true);
        startQuizAutomation();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuizAutomation = () => {
    // Listen for quiz sessions changes to handle phase transitions
    const channel = supabase
      .channel('quiz-automation')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'quiz_sessions'
      }, (payload) => {
        const session = payload.new as any;
        if (session.is_active) {
          handlePhaseTransition(session);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handlePhaseTransition = async (session: any) => {
    const now = new Date();
    const phaseEndTime = new Date(session.phase_end_time);
    const timeLeft = Math.max(0, Math.floor((phaseEndTime.getTime() - now.getTime()) / 1000));

    // If time is up, transition to next phase
    if (timeLeft <= 0) {
      if (session.phase === 'question') {
        // Move to results phase (20 seconds)
        await moveToResultsPhase(session);
      } else if (session.phase === 'results') {
        // Move to next question or finish quiz
        await moveToNextQuestion(session);
      }
    }
  };

  const moveToResultsPhase = async (session: any) => {
    const resultsEndTime = new Date(Date.now() + 20000); // 20 seconds for results

    const { error } = await supabase
      .from('quiz_sessions')
      .update({
        phase: 'results',
        phase_end_time: resultsEndTime.toISOString(),
      })
      .eq('id', session.id);

    if (error) {
      console.error('Error moving to results phase:', error);
    } else {
      console.log('Moved to results phase');
    }
  };

  const moveToNextQuestion = async (session: any) => {
    // Get next question
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('id')
      .order('question_order')
      .gt('question_order', session.current_question_number);

    if (questions && questions.length > 0) {
      // Move to next question
      const nextQuestion = questions[0];
      const questionEndTime = new Date(Date.now() + 40000); // 40 seconds for question

      const { error } = await supabase
        .from('quiz_sessions')
        .update({
          phase: 'question',
          current_question_id: nextQuestion.id,
          current_question_number: session.current_question_number + 1,
          phase_end_time: questionEndTime.toISOString(),
        })
        .eq('id', session.id);

      if (error) {
        console.error('Error moving to next question:', error);
      } else {
        console.log('Moved to next question');
        toast({
          title: "Next Question",
          description: `Question ${session.current_question_number + 1} is now active`,
        });
      }
    } else {
      // No more questions, finish quiz
      await finishQuiz(session);
    }
  };

  const finishQuiz = async (session: any) => {
    const { error } = await supabase
      .from('quiz_sessions')
      .update({
        phase: 'finished',
        is_active: false,
        phase_end_time: null,
      })
      .eq('id', session.id);

    if (error) {
      console.error('Error finishing quiz:', error);
    } else {
      console.log('Quiz finished');
      toast({
        title: "Quiz Completed!",
        description: "The quiz has ended. Check the final leaderboard!",
      });
    }
  };

  return {
    isAdmin,
    loading,
  };
};