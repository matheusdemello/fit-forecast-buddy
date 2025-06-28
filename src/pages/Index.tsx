
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
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        {renderContent()}
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
