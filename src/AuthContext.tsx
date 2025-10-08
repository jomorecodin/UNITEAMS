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
  signOut: () => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
  }) => Promise<{ error: Error | null }>;
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
  const [authLoading, setAuthLoading] = useState(false);

  console.log('🔄 AuthProvider State:', { loading, authLoading, user: user?.email });

  // Function to fetch user profile - NO BLOQUEANTE
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('📡 Fetching profile for:', userId);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Profile fetch error:', error);
        return null;
      }

      console.log('✅ Profile fetched successfully');
      return data as UserProfile;
    } catch (err) {
      console.error('❌ Profile fetch exception:', err);
      return null;
    }
  };

  useEffect(() => {
    console.log('🎯 AuthProvider useEffect running');
    let isMounted = true;

    // Get initial session
    const getSession = async () => {
      try {
        console.log('🔍 Getting session...');
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        
        console.log('🔍 Session result:', session ? `User: ${session.user?.email}` : 'No session');
        
        if (!isMounted) return;

        if (error) {
          console.error('❌ Session error:', error);
          setError(error.message);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user profile if user exists - NO BLOQUEANTE
        if (session?.user) {
          console.log('👤 User found, fetching profile...');
          // No esperar el fetch del profile para no bloquear
          fetchUserProfile(session.user.id)
            .then(userProfile => {
              if (isMounted && userProfile) {
                setProfile(userProfile);
              }
            })
            .catch(err => {
              console.error('Error in profile fetch:', err);
            });
        }
        
      } catch (err) {
        console.error('❌ Session exception:', err);
        if (isMounted) {
          setError('Failed to get session');
        }
      } finally {
        console.log('🏁 Session check complete, setting loading: false');
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔄 Auth state change:', _event, session ? `User: ${session.user?.email}` : 'No session');
      
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      
      // Fetch user profile if user exists, clear if not - NO BLOQUEANTE
      if (session?.user) {
        console.log('👤 Auth change - fetching profile...');
        fetchUserProfile(session.user.id)
          .then(userProfile => {
            if (isMounted) {
              setProfile(userProfile);
            }
          });
      } else {
        console.log('👤 Auth change - no user, clearing profile');
        setProfile(null);
      }
      
      setError(null);
      // NO llamar setLoading(false) aquí para evitar conflictos
    });

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

const signUp = async (
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
) => {
  console.log('🔐 SignUp started for:', email);
  setAuthLoading(true);
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
    
    console.log('🔐 SignUp result:', error ? `Error: ${error.message}` : 'Success');
    
    if (error) {
      setError(error.message);
    }
    
    return { error };
  } catch (err) {
    console.error('🔐 SignUp exception:', err);
    const errorMessage = 'An unexpected error occurred';
    setError(errorMessage);
    return { error: null };
  } finally {
    console.log('🔐 SignUp complete, setting authLoading: false');
    setAuthLoading(false);
  }
};

const signIn = async (email: string, password: string) => {
  console.log('🔐 SignIn started for:', email);
  setAuthLoading(true);
  setError(null);
  
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('🔐 SignIn result:', error ? `Error: ${error.message}` : 'Success');
    
    if (error) {
      setError(error.message);
    }
    
    return { error };
  } catch (err) {
    console.error('🔐 SignIn exception:', err);
    const errorMessage = 'An unexpected error occurred';
    setError(errorMessage);
    // En caso de excepción, retornar null o undefined en error
    return { error: null };
  } finally {
    console.log('🔐 SignIn complete, setting authLoading: false');
    setAuthLoading(false);
  }
};

const signOut = async () => {
  console.log('🔐 SignOut started');
  setAuthLoading(true);
  setError(null);
  
  try {
    const { error } = await supabase.auth.signOut();
    
    console.log('🔐 SignOut result:', error ? `Error: ${error.message}` : 'Success');
    
    if (error) {
      setError(error.message);
    }
    
    return { error };
  } catch (err) {
    console.error('🔐 SignOut exception:', err);
    const errorMessage = 'An unexpected error occurred';
    setError(errorMessage);
    return { error: null };
  } finally {
    console.log('🔐 SignOut complete, setting authLoading: false');
    setAuthLoading(false);
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
    loading: loading || authLoading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  console.log('🎯 AuthProvider value:', { 
    loading: value.loading, 
    user: value.user?.email,
    profile: value.profile ? 'exists' : 'null'
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};