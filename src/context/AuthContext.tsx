import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

// Helper: timeout de respaldo
const withTimeout = <T,>(p: Promise<T>, ms = 20000): Promise<T> =>
  Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)) as Promise<T>,
  ]);

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
  initialLoading: boolean;
  error: string | null;
  signUp: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
  }) => Promise<{ error: Error | null }>;
  clearError: () => void;
  forceSignOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const clearError = () => setError(null);

  const forceSignOut = async () => {
    try {
      await withTimeout(supabase.auth.signOut(), 6000);
    } catch (err) {
      console.error('Error during force sign out:', err);
    }
  };

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        setInitialLoading(true);
        const { data: { session }, error } = await withTimeout(supabase.auth.getSession(), 8000);
        if (!active) return;

        if (error) {
          console.error('Session error:', error);
          setError(error.message);
          setSession(null);
          setUser(null);
          setProfile(null);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const p = await fetchUserProfile(session.user.id);
          if (active) setProfile(p);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Failed to get session:', err);
        if (active) {
          setError('Failed to get session');
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (active) setInitialLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      try {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const p = await fetchUserProfile(session.user.id);
          if (active) setProfile(p);
        } else {
          setProfile(null);
        }
        setError(null);
      } finally {
        if (active) setInitialLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    setLoading(true);
    setError(null);
    try {
      if (session) await withTimeout(supabase.auth.signOut(), 6000);

      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName || '',
              last_name: lastName || '',
              full_name: `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
            },
          },
        }),
        8000
      );

      if (error) {
        setError(error.message);
        return { error };
      }

      if (data.user) {
        const p = await fetchUserProfile(data.user.id);
        setProfile(p);
      }
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during sign up';
      setError(message);
      return { error: { message } as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      if (session && user?.email !== email) {
        await withTimeout(supabase.auth.signOut(), 6000);
      }

      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        8000
      );

      if (error) {
        setError(error.message);
        return { error };
      }

      if (data.user) {
        const p = await fetchUserProfile(data.user.id);
        setProfile(p);
      }

      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      setError(msg);
      return { error: { message: msg } as AuthError };
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      (supabase as any).removeAllChannels?.();
      await withTimeout(supabase.auth.signOut(), 20000);
    } catch (err) {
      console.error('signOut error', err);
    } finally {
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const updateProfile = async (updates: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
  }) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { error } = await supabase.rpc('update_current_user_profile', {
        new_first_name: updates.firstName || null,
        new_last_name: updates.lastName || null,
        new_bio: updates.bio || null,
        new_avatar_url: updates.avatarUrl || null,
      });

      if (error) return { error: new Error(error.message) };

      const p = await fetchUserProfile(user.id);
      setProfile(p);
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      return { error: new Error(msg) };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        initialLoading,
        error,
        signUp,
        signIn,
        signOut,
        updateProfile,
        clearError,
        forceSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};