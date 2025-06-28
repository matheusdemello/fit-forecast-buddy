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
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 border-t-2 border-emerald-600 shadow-2xl backdrop-blur-lg">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto relative">
        {/* Decorative Indian motifs */}
        <div className="absolute top-1 left-4 text-emerald-400 text-xs opacity-60">◆</div>
        <div className="absolute top-1 right-4 text-emerald-400 text-xs opacity-60">◆</div>
        
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 btn-aggressive relative",
                isActive 
                  ? "text-emerald-300 bg-emerald-800/40 glow-green scale-110 border border-emerald-500" 
                  : "text-emerald-500 hover:text-emerald-300 hover:bg-emerald-900/30 hover:scale-105"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 mb-1 transition-all duration-300", 
                isActive && "text-emerald-300 drop-shadow-lg filter"
              )} />
              <span className={cn(
                "text-xs font-medium tracking-wide",
                isActive ? "text-emerald-200 font-semibold" : "text-emerald-400"
              )}>{tab.label}</span>
              
              {isActive && (
                <div className="absolute -bottom-1 w-8 h-1 bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 rounded-full shadow-lg"></div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Bottom decorative border */}
      <div className="h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
    </div>
  );
};

export default BottomNavigation;
