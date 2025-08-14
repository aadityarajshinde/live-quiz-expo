import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check for active quiz session that needs phase advancement
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (sessionError) {
      throw sessionError
    }

    if (!session) {
      return new Response(
        JSON.stringify({ message: 'No active quiz session' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const now = new Date()
    const phaseEndTime = new Date(session.phase_end_time)
    const timeLeft = Math.max(0, Math.floor((phaseEndTime.getTime() - now.getTime()) / 1000))

    // If time is up, advance the phase
    if (timeLeft <= 0) {
      const { error: advanceError } = await supabase.rpc('advance_quiz_phase')
      
      if (advanceError) {
        throw advanceError
      }

      return new Response(
        JSON.stringify({ message: 'Quiz phase advanced', session_id: session.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        message: 'No phase advancement needed', 
        time_left: timeLeft,
        current_phase: session.phase 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in quiz automation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})