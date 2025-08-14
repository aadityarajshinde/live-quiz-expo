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
    console.log('Starting quiz automation for admin');
    
    // Set up timer to check for phase transitions every 5 seconds
    const automationInterval = setInterval(async () => {
      try {
        // Call the database function directly
        const { data, error } = await supabase.rpc('advance_quiz_phase');
        
        if (error) {
          console.error('Error in quiz automation:', error);
        } else {
          console.log('Quiz automation check completed');
        }
      } catch (error) {
        console.error('Error in quiz automation:', error);
      }
    }, 5000); // Check every 5 seconds

    // Clean up on component unmount
    return () => {
      clearInterval(automationInterval);
    };
  };

  return {
    isAdmin,
    loading,
  };
};