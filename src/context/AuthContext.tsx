import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

/* eslint-disable react-refresh/only-export-components */

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signUp: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
  }) => Promise<{ error: Error | null }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  };

  // Clear error function
  const clearError = () => setError(null);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        setLoading(true);
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setError(error.message);
          setSession(null);
          setUser(null);
          setProfile(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Fetch user profile if user exists
          if (session?.user) {
            const userProfile = await fetchUserProfile(session.user.id);
            setProfile(userProfile);
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('Failed to get session:', err);
        setError('Failed to get session');
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const userProfile = await fetchUserProfile(session.user.id);
          setProfile(userProfile);
        } catch (err) {
          console.error('Error fetching profile on auth change:', err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
      setError(null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName || '',
            last_name: lastName || '',
            full_name: `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
          },
        },
      });
      
      if (error) {
        setError(error.message);
        return { error };
      }
      
      // If signup successful and we have a user, fetch profile
      if (data.user) {
        const userProfile = await fetchUserProfile(data.user.id);
        setProfile(userProfile);
      }
      
      return { error: null };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during sign up';
      setError(errorMessage);
      return { error: { message: errorMessage } as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setError(error.message);
        return { error };
      }
      
      // If signin successful, fetch profile
      if (data.user) {
        const userProfile = await fetchUserProfile(data.user.id);
        setProfile(userProfile);
      }
      
      return { error: null };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during sign in';
      setError(errorMessage);
      return { error: { message: errorMessage } as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        setError(error.message);
        throw error;
      }
      
      console.log('Sign out successful');
      // Los estados se limpiarán automáticamente por el listener onAuthStateChange
      
    } catch (err) {
      console.error('Error during sign out:', err);
      const errorMessage = 'An unexpected error occurred during sign out';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
  }) => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { error } = await supabase.rpc('update_current_user_profile', {
        new_first_name: updates.firstName || null,
        new_last_name: updates.lastName || null,
        new_bio: updates.bio || null,
        new_avatar_url: updates.avatarUrl || null,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      // Refresh profile data
      const updatedProfile = await fetchUserProfile(user.id);
      setProfile(updatedProfile);

      return { error: null };
    } catch (err) {
      return { error: new Error('Failed to update profile') };
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};