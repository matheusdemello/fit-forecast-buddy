import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthForm } from './AuthForm';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { loading, isAuthenticated } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading FitBuddy...</p>
        </div>
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!isAuthenticated) {
    return <AuthForm />;
  }

  // Show protected content if authenticated
  return <>{children}</>;
};

export default AuthGuard; 