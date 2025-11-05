import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

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
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener el perfil del usuario
  const fetchUserProfile = useCallback(async (userId: string, currentUser?: User): Promise<UserProfile | null> => {
    try {
      // Intentar obtener el perfil de la base de datos
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Obtener nombres de user_metadata o identity_data como fallback
      const userMetadata = currentUser?.user_metadata || {};
      const identityData = currentUser?.identities?.[0]?.identity_data || {};
      const metadataFirstName = userMetadata.first_name || identityData.first_name;
      const metadataLastName = userMetadata.last_name || identityData.last_name;
      const metadataEmail = currentUser?.email || '';

      // Si hay error al obtener el perfil, crear uno temporal desde metadatos
      if (profileError) {
        if (metadataFirstName || metadataLastName || metadataEmail) {
          return {
            id: userId,
            email: metadataEmail,
            first_name: metadataFirstName || null,
            last_name: metadataLastName || null,
            full_name: metadataFirstName && metadataLastName 
              ? `${metadataFirstName} ${metadataLastName}`.trim()
              : metadataFirstName || metadataLastName || null,
            display_name: metadataFirstName && metadataLastName 
              ? `${metadataFirstName} ${metadataLastName}`.trim()
              : metadataFirstName || metadataLastName || null,
            avatar_url: null,
            bio: null,
            role: 'member',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as UserProfile;
        }
        return null;
      }

      // Si el perfil existe pero no tiene nombres, sincronizarlos desde metadatos
      if (data && (metadataFirstName || metadataLastName)) {
        const needsUpdate = (!data.first_name || !data.last_name) && (metadataFirstName || metadataLastName);
        
        if (needsUpdate) {
          const firstName = metadataFirstName || data.first_name || '';
          const lastName = metadataLastName || data.last_name || '';
          
          try {
            await supabase.rpc('update_current_user_profile', {
              new_first_name: firstName || null,
              new_last_name: lastName || null,
            });
            
            return {
              ...data,
              first_name: firstName || data.first_name,
              last_name: lastName || data.last_name,
            } as UserProfile;
          } catch (updateError) {
            console.error('Error updating profile:', updateError);
            // Devolver perfil con datos mezclados aunque falle la actualización
            return {
              ...data,
              first_name: metadataFirstName || data.first_name,
              last_name: metadataLastName || data.last_name,
            } as UserProfile;
          }
        }
      }

      return data as UserProfile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, []);

  // Función para actualizar el estado de autenticación
  const updateAuthState = useCallback(async (currentSession: Session | null) => {
    if (currentSession?.user) {
      setSession(currentSession);
      setUser(currentSession.user);
      
      // Obtener perfil
      const userProfile = await fetchUserProfile(currentSession.user.id, currentSession.user);
      setProfile(userProfile);
    } else {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  }, [fetchUserProfile]);

  // Inicialización y suscripción a cambios de autenticación
  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async () => {
      try {
        setInitialLoading(true);
        
        // Obtener sesión actual
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setError(sessionError.message);
          setSession(null);
          setUser(null);
          setProfile(null);
          setInitialLoading(false);
          return;
        }

        // Actualizar estado con la sesión actual
        await updateAuthState(currentSession);

        // Suscribirse a cambios de autenticación
        const authSubscription = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (!isMounted) return;

          console.log('Auth state changed:', event);

          // Actualizar estado cuando cambia la autenticación
          await updateAuthState(newSession);

          // Limpiar error cuando hay una sesión válida
          if (newSession) {
            setError(null);
          }
        });

        subscription = authSubscription.data.subscription;

        setInitialLoading(false);
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        if (isMounted) {
          setError('Failed to initialize authentication');
          setSession(null);
          setUser(null);
          setProfile(null);
          setInitialLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [updateAuthState]);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
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

      if (signUpError) {
        setError(signUpError.message);
        return { error: signUpError };
      }

      if (data.user) {
        // Esperar un momento para que se cree el perfil en la BD
        await new Promise(resolve => setTimeout(resolve, 1000));
        const userProfile = await fetchUserProfile(data.user.id, data.user);
        setProfile(userProfile);
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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return { error: signInError };
      }

      if (data.user) {
        // La sesión se actualizará automáticamente mediante onAuthStateChange
        // pero también podemos actualizar el perfil aquí
        const userProfile = await fetchUserProfile(data.user.id, data.user);
        setProfile(userProfile);
      }

      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      setError(message);
      return { error: { message } as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      // Limpiar estado local primero
      setSession(null);
      setUser(null);
      setProfile(null);
      
      // Cerrar sesión en Supabase
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('Error signing out:', signOutError);
        setError(signOutError.message);
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Unexpected error during sign out:', err);
      setError('Error signing out');
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

    setLoading(true);
    try {
      const { error: updateError } = await supabase.rpc('update_current_user_profile', {
        new_first_name: updates.firstName || null,
        new_last_name: updates.lastName || null,
        new_bio: updates.bio || null,
        new_avatar_url: updates.avatarUrl || null,
      });

      if (updateError) {
        setError('Error updating profile');
        return { error: updateError };
      }

      // Actualizar el estado local del perfil
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          first_name: updates.firstName !== undefined ? updates.firstName : prev.first_name,
          last_name: updates.lastName !== undefined ? updates.lastName : prev.last_name,
          bio: updates.bio !== undefined ? updates.bio : prev.bio,
          avatar_url: updates.avatarUrl !== undefined ? updates.avatarUrl : prev.avatar_url,
        };
      });

      return { error: null };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { error: new Error('Error updating profile') };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
