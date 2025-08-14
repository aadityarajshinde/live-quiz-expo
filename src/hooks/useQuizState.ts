import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QuizSession {
  id: string;
  is_active: boolean;
  current_question_id: string | null;
  current_question_number: number;
  total_questions: number;
  registration_open: boolean;
  phase: 'pre-quiz' | 'question' | 'results' | 'finished';
  phase_end_time: string | null;
}

export interface QuizQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  question_order: number;
}

export interface UserAnswer {
  id: string;
  user_id: string;
  session_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  answered_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  score: number;
  latest_answer?: string;
  is_correct?: boolean;
}

export const useQuizState = () => {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch current quiz session
  const fetchSession = async () => {
    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching session:', error);
      return;
    }

    setSession(data as QuizSession);
    return data as QuizSession;
  };

  // Fetch current question
  const fetchCurrentQuestion = async (questionId: string | null) => {
    if (!questionId) {
      setCurrentQuestion(null);
      return;
    }

    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error) {
      console.error('Error fetching question:', error);
      return;
    }

    setCurrentQuestion(data);
  };

  // Fetch leaderboard
  const fetchLeaderboard = async (sessionId: string) => {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name')
      .eq('is_admin', false);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }

    const { data: answers, error: answersError } = await supabase
      .from('user_answers')
      .select('user_id, is_correct, selected_answer, question_id, answered_at')
      .eq('session_id', sessionId)
      .order('answered_at', { ascending: false });

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      return;
    }

    // Calculate scores and latest answers
    const userScores: Record<string, { score: number; latestAnswer?: string; isCorrect?: boolean }> = {};
    
    profiles?.forEach(profile => {
      userScores[profile.user_id] = { score: 0 };
    });

    answers?.forEach(answer => {
      if (!userScores[answer.user_id]) {
        userScores[answer.user_id] = { score: 0 };
      }
      
      if (answer.is_correct) {
        userScores[answer.user_id].score += 1;
      }
      
      // Store the latest answer for the current question
      if (session?.current_question_id === answer.question_id && !userScores[answer.user_id].latestAnswer) {
        userScores[answer.user_id].latestAnswer = answer.selected_answer;
        userScores[answer.user_id].isCorrect = answer.is_correct;
      }
    });

    const leaderboardData: LeaderboardEntry[] = profiles?.map(profile => ({
      user_id: profile.user_id,
      name: profile.name,
      score: userScores[profile.user_id]?.score || 0,
      latest_answer: userScores[profile.user_id]?.latestAnswer,
      is_correct: userScores[profile.user_id]?.isCorrect,
    })).sort((a, b) => b.score - a.score) || [];

    setLeaderboard(leaderboardData);
  };

  // Submit answer
  const submitAnswer = async (questionId: string, selectedAnswer: string, sessionId: string) => {
    const { data: question } = await supabase
      .from('quiz_questions')
      .select('correct_answer')
      .eq('id', questionId)
      .single();

    if (!question) return;

    const isCorrect = question.correct_answer === selectedAnswer;

    const { error } = await supabase
      .from('user_answers')
      .upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
        session_id: sessionId,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
      });

    if (error) {
      console.error('Error submitting answer:', error);
    }
  };

  // Timer management
  useEffect(() => {
    if (session?.phase_end_time) {
      const endTime = new Date(session.phase_end_time).getTime();
      
      const timer = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeLeft(remaining);
        
        if (remaining === 0) {
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [session?.phase_end_time]);

  // Real-time subscriptions
  useEffect(() => {
    const sessionChannel = supabase
      .channel('quiz-sessions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'quiz_sessions'
      }, () => {
        fetchSession();
      })
      .subscribe();

    const answersChannel = supabase
      .channel('quiz-answers')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_answers'
      }, () => {
        if (session) {
          fetchLeaderboard(session.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(answersChannel);
    };
  }, [session?.id]);

  // Initial data fetch
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      const sessionData = await fetchSession();
      if (sessionData) {
        await fetchCurrentQuestion(sessionData.current_question_id);
        await fetchLeaderboard(sessionData.id);
      }
      setLoading(false);
    };

    initialize();
  }, []);

  // Update current question when session changes
  useEffect(() => {
    if (session?.current_question_id) {
      fetchCurrentQuestion(session.current_question_id);
    }
  }, [session?.current_question_id]);

  // Update leaderboard when session changes
  useEffect(() => {
    if (session?.id) {
      fetchLeaderboard(session.id);
    }
  }, [session?.id]);

  return {
    session,
    currentQuestion,
    leaderboard,
    timeLeft,
    loading,
    submitAnswer,
    refetch: fetchSession,
  };
};