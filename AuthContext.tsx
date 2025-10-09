import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

/* eslint-disable react-refresh/only-export-components */

interface UserProfile {
  id_usuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  role?: string;
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
  ) => Promise<{ error: AuthError | Error | null }>;
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
  supabase: any; // Agrega esta línea
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

  // Function to fetch user profile
const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    console.log('📡 Fetching profile for:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('🔍 RAW PROFILE RESPONSE:', { data, error });
    
    if (error) {
      console.error('❌ Profile fetch error:', error);
      return null;
    }

    // Si data es null, la consulta no encontró nada
    if (!data) {
      console.error('❌ No profile data found for user:', userId);
      return null;
    }

    console.log('✅ Profile fetched successfully:', data);
    
    // Mapear los datos de profiles a UserProfile
    const userProfile: UserProfile = {
      id_usuario: data.id,
      nombre: data.first_name || '',
      apellido: data.last_name || '',
      correo: data.email || '',
      full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      avatar_url: data.avatar_url || null,
      bio: data.bio || null,
      role: data.role || 'user',
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    return userProfile;
  } catch (err) {
    console.error('❌ Profile fetch exception:', err);
    return null;
  }
};

useEffect(() => {
  console.log('🎯 AuthProvider useEffect running');
  let isMounted = true;

  const getSession = async () => {
    try {
      console.log('🔍 Getting session...');
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      
      console.log('🔍 Session result:', session ? `User: ${session.user?.email}, Confirmed: ${session.user?.email_confirmed_at}` : 'No session');
      
      if (!isMounted) return;

      if (error) {
        console.error('❌ Session error:', error);
        setError(error.message);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('👤 User found, fetching profile...');
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

  // Manejar la verificación de email desde el enlace mágico
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('🔄 Auth state change:', event, session ? `User: ${session.user?.email}, Verified: ${session.user?.email_confirmed_at}` : 'No session');
  
  if (!isMounted) return;

  // Manejar eventos específicos
  if (event === 'SIGNED_IN') {
    console.log('🔐 User signed in, email confirmed:', session?.user?.email_confirmed_at);
    
    if (session?.user?.email_confirmed_at) {
      console.log('🎉 Email verified, user can access app');
    } else {
      console.log('⚠️ User signed in but email not verified');
    }
  }

  if (event === 'USER_UPDATED') {
    console.log('📧 User updated, checking email confirmation...');
    // Forzar recarga del usuario
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  setSession(session);
  setUser(session?.user ?? null);
  
  if (session?.user) {
    fetchUserProfile(session.user.id)
      .then(userProfile => {
        if (isMounted) {
          setProfile(userProfile);
        }
      });
  } else {
    setProfile(null);
  }
  
  setError(null);
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
    // 1. Crear usuario en auth
    console.log('📧 Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });
    
    console.log('🔐 Auth response:', { 
      user: authData?.user,
      session: authData?.session,
      error: authError 
    });
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      setError(authError.message);
      return { error: authError };
    }

    if (!authData.user) {
      console.error('❌ No user data returned');
      setError('No se pudo crear el usuario');
      return { error: new Error('No user data returned') };
    }

    console.log('✅ Auth user created:', authData.user.id);
    
    // 2. ESPERAR importante - dar tiempo a que se procese el usuario
    console.log('⏳ Waiting 3 seconds before profile creation...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 3. Crear perfil - método SIMPLE y DIRECTO
    console.log('💾 Creating profile...');
    
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        first_name: firstName || '',
        last_name: lastName || '',
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    console.log('💾 Profile creation result - Error:', profileError);

    if (profileError) {
      console.error('❌ Profile creation FAILED:', profileError);
      console.log('🔄 Attempting profile creation with RPC...');
      
      // Intentar con función RPC
      await createProfileWithRPC(authData.user.id, firstName, lastName, email);
    } else {
      console.log('✅ Profile created successfully!');
    }

    // 4. Verificar que el perfil se creó
    console.log('🔍 Verifying profile was created...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('id', authData.user.id)
      .single();

    console.log('🔍 Profile verification:', { 
      profileExists: !!verifyData, 
      verifyError,
      profileData: verifyData 
    });
    
    return { error: null };
  } catch (err) {
    console.error('🔐 SignUp exception:', err);
    const errorMessage = 'An unexpected error occurred';
    setError(errorMessage);
    return { error: new Error(errorMessage) };
  } finally {
    console.log('🔐 SignUp complete, setting authLoading: false');
    setAuthLoading(false);
  }
};

// Función auxiliar para crear perfil via RPC
const createProfileWithRPC = async (userId: string, firstName?: string, lastName?: string, email?: string) => {
  try {
    console.log('🔄 Creating profile via RPC...');
    
    const { error } = await supabase.rpc('create_user_profile', {
      user_id: userId,
      user_first_name: firstName || '',
      user_last_name: lastName || '',
      user_email: email || ''
    });

    if (error) {
      console.error('❌ RPC profile creation failed:', error);
      throw error;
    }
    
    console.log('✅ Profile created via RPC');
  } catch (err) {
    console.error('❌ All profile creation methods failed:', err);
    throw err;
  }
};

// Función alternativa para crear perfil
const createProfileAlternative = async (userId: string, firstName?: string, lastName?: string, email?: string) => {
  try {
    console.log('🔄 Using alternative profile creation...');
    
    // Método 1: Usar RPC si existe
    const { error: rpcError } = await supabase.rpc('create_profile', {
      user_id: userId,
      first_name: firstName || '',
      last_name: lastName || '',
      user_email: email || ''
    });

    if (!rpcError) {
      console.log('✅ Profile created via RPC');
      return;
    }

    // Método 2: Insertar sin select
    const { error: simpleError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        first_name: firstName || '',
        last_name: lastName || '',
        email: email || ''
      });

    if (!simpleError) {
      console.log('✅ Profile created via simple insert');
      return;
    }

    // Método 3: Usar upsert en caso de conflicto
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        first_name: firstName || '',
        last_name: lastName || '',
        email: email || '',
        updated_at: new Date().toISOString()
      });

    if (!upsertError) {
      console.log('✅ Profile created via upsert');
      return;
    }

    console.error('❌ All profile creation methods failed');
    
  } catch (error) {
    console.error('❌ Alternative profile creation error:', error);
  }
};

// Función auxiliar para manejar creación de perfil con RLS
const handleRLSProfileCreation = async (userId: string, firstName?: string, lastName?: string, email?: string) => {
  try {
    // Método 1: Usar RPC
    const { error: rpcError } = await supabase.rpc('create_profile', {
      user_id: userId,
      first_name: firstName || '',
      last_name: lastName || '',
      user_email: email || ''
    });

    if (!rpcError) {
      console.log('✅ Profile created via RPC');
      return;
    }

    // Método 2: Esperar más tiempo y reintentar
    console.log('⏳ Waiting for session to establish...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { error: retryError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        first_name: firstName || '',
        last_name: lastName || '',
        email: email || ''
      });

    if (retryError) {
      throw retryError;
    }
    
    console.log('✅ Profile created on retry');
  } catch (error) {
    console.error('❌ All profile creation methods failed:', error);
    throw error;
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
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          bio: updates.bio,
          avatar_url: updates.avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

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
  supabase,
};

  console.log('🎯 AuthProvider value:', { 
    loading: value.loading, 
    user: value.user?.email,
    profile: value.profile ? 'exists' : 'null'
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};