
import React from 'react';
import { Dumbbell, History, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  activeTab: 'log' | 'history' | 'stats';
  onTabChange: (tab: 'log' | 'history' | 'stats') => void;
}

const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  const tabs = [
    { id: 'log' as const, label: 'Log', icon: Dumbbell },
    { id: 'history' as const, label: 'History', icon: History },
    { id: 'stats' as const, label: 'Stats', icon: BarChart3 },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5 mb-1", isActive && "text-primary")} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
