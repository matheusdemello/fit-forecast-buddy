import React, { useState } from 'react';
import WorkoutLogger from '../components/WorkoutLogger';
import WorkoutHistory from '../components/WorkoutHistory';
import WorkoutStats from '../components/WorkoutStats';
import BottomNavigation from '../components/BottomNavigation';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'stats'>('log');

  const renderContent = () => {
    switch (activeTab) {
      case 'log':
        return <WorkoutLogger />;
      case 'history':
        return <WorkoutHistory />;
      case 'stats':
        return <WorkoutStats />;
      default:
        return <WorkoutLogger />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 lotus-pattern relative">
      {/* Indian-inspired decorative header */}
      <div className="relative bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 p-4 shadow-2xl border-b-2 border-emerald-600">
        <div className="max-w-md mx-auto">
          <h1 className="text-center text-2xl font-bold text-indian-accent tracking-wider">
            🕉️ FitBuddy 🕉️
          </h1>
          <div className="text-center text-sm text-emerald-200 mt-1 font-light tracking-wide">
            Transform Your Body, Elevate Your Spirit
          </div>
        </div>
        <div className="absolute top-2 left-4 text-emerald-400 text-lg">◆</div>
        <div className="absolute top-2 right-4 text-emerald-400 text-lg">◆</div>
        <div className="absolute bottom-2 left-6 text-emerald-500 text-sm">◈</div>
        <div className="absolute bottom-2 right-6 text-emerald-500 text-sm">◈</div>
      </div>
      
      <div className="max-w-md mx-auto relative">
        {renderContent()}
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
