import { useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Clock } from 'lucide-react';

interface QuizTimerProps {
  timeLeft: number;
  totalTime: number;
  phase: 'question' | 'results';
}

const QuizTimer = ({ timeLeft, totalTime, phase }: QuizTimerProps) => {
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const isWarning = timeLeft <= 10;
  const isCritical = timeLeft <= 5;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            {phase === 'question' ? 'Question Time' : 'Results'}
          </span>
        </div>
        <div className={`text-2xl font-bold ${
          isCritical ? 'text-destructive animate-pulse' : 
          isWarning ? 'text-orange-500' : 
          'text-foreground'
        }`}>
          {timeLeft}s
        </div>
      </div>
      
      <Progress 
        value={progress} 
        className={`h-3 ${
          isCritical ? 'bg-destructive/20' : 
          isWarning ? 'bg-orange-500/20' : 
          'bg-primary/20'
        }`}
      />
      
      {isCritical && (
        <div className="text-center text-sm font-medium text-destructive animate-pulse">
          Time's almost up!
        </div>
      )}
    </div>
  );
};

export default QuizTimer;