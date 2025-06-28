
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';

interface RestTimerProps {
  suggestedRestTime: number;
  onComplete?: () => void;
}

const RestTimer = ({ suggestedRestTime, onComplete }: RestTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(suggestedRestTime);
  const [isRunning, setIsRunning] = useState(false);
  const [initialTime] = useState(suggestedRestTime);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setTimeLeft(initialTime);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((initialTime - timeLeft) / initialTime) * 100;

  return (
    <Card className="p-3 bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4" />
          <span className="text-sm font-medium">Rest Timer</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`text-lg font-mono ${timeLeft <= 10 ? 'text-destructive' : ''}`}>
            {formatTime(timeLeft)}
          </span>
          
          <Button variant="ghost" size="sm" onClick={toggleTimer}>
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <Button variant="ghost" size="sm" onClick={resetTimer}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {timeLeft !== initialTime && (
        <div className="mt-2 w-full bg-muted rounded-full h-1">
          <div 
            className="bg-primary h-1 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </Card>
  );
};

export default RestTimer;
