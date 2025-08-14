import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown, Medal, User, CheckCircle, XCircle } from 'lucide-react';
import { LeaderboardEntry } from '@/hooks/useQuizState';

interface LeaderboardPanelProps {
  leaderboard: LeaderboardEntry[];
  phase: 'pre-quiz' | 'question' | 'results' | 'finished';
  showAnswers?: boolean;
}

const LeaderboardPanel = ({ leaderboard, phase, showAnswers = false }: LeaderboardPanelProps) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <User className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30';
      default:
        return 'bg-card border-border';
    }
  };

  if (phase === 'pre-quiz') {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Participants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p>Waiting for quiz to begin...</p>
            <p className="text-sm mt-2">{leaderboard.length} participants registered</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Leaderboard
          </div>
          {phase === 'finished' && (
            <Badge variant="default" className="bg-gradient-to-r from-primary to-accent">
              Final Results
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {leaderboard.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No participants yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              
              return (
                <div
                  key={entry.user_id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${getRankStyle(rank)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getRankIcon(rank)}
                        <span className="font-bold text-sm">#{rank}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{entry.name}</p>
                        {(phase === 'results' || phase === 'finished') && entry.latest_answer && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Answer: {entry.latest_answer}
                            </span>
                            {entry.is_correct !== undefined && (
                              <>
                                {entry.is_correct ? (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-red-500" />
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge 
                        variant={rank <= 3 ? 'default' : 'secondary'}
                        className={rank === 1 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : ''}
                      >
                        {entry.score} pts
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {phase === 'finished' && leaderboard.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg text-center">
            <p className="font-bold text-lg">
              🎉 Congratulations {leaderboard[0]?.name}! 🎉
            </p>
            <p className="text-sm text-muted-foreground">
              Final Winner with {leaderboard[0]?.score} points!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaderboardPanel;