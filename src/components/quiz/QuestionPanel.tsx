import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import QuizTimer from './QuizTimer';
import { QuizQuestion } from '@/hooks/useQuizState';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuestionPanelProps {
  question: QuizQuestion | null;
  questionNumber: number;
  totalQuestions: number;
  timeLeft: number;
  phase: 'question' | 'results';
  onAnswerSubmit: (answer: string) => void;
  hasAnswered: boolean;
  correctAnswer?: string;
}

const QuestionPanel = ({
  question,
  questionNumber,
  totalQuestions,
  timeLeft,
  phase,
  onAnswerSubmit,
  hasAnswered,
  correctAnswer
}: QuestionPanelProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  useEffect(() => {
    // Reset selection when question changes
    setSelectedAnswer(null);
  }, [question?.id]);

  const handleAnswerSelect = (answer: string) => {
    if (phase === 'question' && !hasAnswered) {
      setSelectedAnswer(answer);
      onAnswerSubmit(answer);
    }
  };

  const options = question ? [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d },
  ] : [];

  if (!question) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <p className="text-lg">No question available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-sm">
            Question {questionNumber} of {totalQuestions}
          </Badge>
          {phase === 'results' && correctAnswer && (
            <Badge variant="outline" className="text-sm">
              Correct Answer: {correctAnswer}
            </Badge>
          )}
        </div>
        <QuizTimer 
          timeLeft={timeLeft} 
          totalTime={phase === 'question' ? 40 : 10} 
          phase={phase}
        />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <CardTitle className="text-xl leading-relaxed">
            {question.question}
          </CardTitle>
        </div>

        <div className="grid gap-3">
          {options.map((option) => {
            const isSelected = selectedAnswer === option.key;
            const isCorrect = phase === 'results' && option.key === correctAnswer;
            const isWrong = phase === 'results' && isSelected && option.key !== correctAnswer;
            
            return (
              <Button
                key={option.key}
                variant={
                  isCorrect ? 'default' : 
                  isWrong ? 'destructive' : 
                  isSelected ? 'secondary' : 
                  'outline'
                }
                size="lg"
                className={`justify-start text-left h-auto p-4 ${
                  phase === 'question' && !hasAnswered 
                    ? 'hover:bg-primary/10 cursor-pointer' 
                    : 'cursor-default'
                } ${
                  isCorrect ? 'bg-accent hover:bg-accent' :
                  isWrong ? 'bg-destructive hover:bg-destructive' : ''
                }`}
                onClick={() => handleAnswerSelect(option.key)}
                disabled={phase === 'results' || hasAnswered}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${
                    isCorrect ? 'border-accent-foreground bg-accent text-accent-foreground' :
                    isWrong ? 'border-destructive-foreground bg-destructive text-destructive-foreground' :
                    isSelected ? 'border-primary bg-primary text-primary-foreground' :
                    'border-muted-foreground'
                  }`}>
                    {option.key}
                  </div>
                  <span className="flex-1">{option.text}</span>
                  {phase === 'results' && (
                    <>
                      {isCorrect && <CheckCircle className="w-5 h-5 text-accent-foreground" />}
                      {isWrong && <XCircle className="w-5 h-5 text-destructive-foreground" />}
                    </>
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        {hasAnswered && phase === 'question' && (
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Answer submitted! Wait for results...
            </p>
          </div>
        )}

        {/* Show loading message during results phase */}
        {phase === 'results' && (
          <div className="mt-2 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <p className="text-sm font-medium text-primary">
                Next question loading... ({timeLeft}s)
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionPanel;