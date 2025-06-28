import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
          return;
        }

        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Unexpected error getting session:', error);
        setAuthState(prev => ({ ...prev, error: 'Failed to initialize auth', loading: false }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign up with email and password
  const signUp = async (email: string, password: string, metadata?: { name?: string }) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {}
        }
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
        return { success: false, error: error.message };
      }

      // Note: User will need to confirm email before they can sign in
      return { 
        success: true, 
        data,
        message: 'Please check your email to confirm your account'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
        return { success: false, error: error.message };
      }

      // Clear local storage on sign out for security
      localStorage.removeItem('workouts_cache');
      localStorage.removeItem('exercises_cache');
      localStorage.removeItem('workout_summary_cache');
      localStorage.removeItem('exercise_stats_cache');
      localStorage.removeItem('offline_operations_queue');

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
        return { success: false, error: error.message };
      }

      setAuthState(prev => ({ ...prev, loading: false }));
      return { 
        success: true, 
        message: 'Password reset email sent. Please check your inbox.' 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  // Update password (for authenticated users)
  const updatePassword = async (newPassword: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
        return { success: false, error: error.message };
      }

      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update password';
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  // Get current user ID (useful for database operations)
  const getCurrentUserId = (): string | null => {
    return authState.user?.id || null;
  };

  // Check if user is authenticated
  const isAuthenticated = (): boolean => {
    return !!authState.user && !!authState.session;
  };

  return {
    // State
    ...authState,
    isAuthenticated: isAuthenticated(),
    
    // Actions
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    getCurrentUserId
  };
}; 