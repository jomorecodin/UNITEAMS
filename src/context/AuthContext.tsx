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
  isAdmin: boolean;          // <- agregado
  adminLoading: boolean;     // <- agregado
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
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminLoading, setAdminLoading] = useState<boolean>(true);

  const checkAdminStatus = useCallback(async () => {
    setAdminLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token || null;
      if (!token) {
        setIsAdmin(false);
        return;
      }
      const res = await fetch('http://localhost:8080/api/admin/status', {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        setIsAdmin(false);
        return;
      }
      const text = await res.text();
      let json: any = {};
      try { json = text ? JSON.parse(text) : {}; } catch {}
      const value = json?.isAdmin ?? json?.is_admin ?? json?.admin ?? false;
      setIsAdmin(!!value);
    } catch {
      setIsAdmin(false);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  // Función para obtener el perfil del usuario
  const fetchUserProfile = useCallback(async (userId: string, currentUser?: User): Promise<UserProfile | null> => {
    try {
      // Obtener nombres de user_metadata o identity_data PRIMERO (disponibles inmediatamente)
      const userMetadata = currentUser?.user_metadata || {};
      const identityData = currentUser?.identities?.[0]?.identity_data || {};
      const metadataFirstName = userMetadata.first_name || identityData.first_name;
      const metadataLastName = userMetadata.last_name || identityData.last_name;
      const metadataEmail = currentUser?.email || '';

      // Intentar obtener el perfil de la base de datos
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Si hay error al obtener el perfil, crear uno desde metadatos
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

      // Si el perfil existe pero no tiene nombres, usar metadatos
      if (data) {
        const firstName = data.first_name || metadataFirstName || null;
        const lastName = data.last_name || metadataLastName || null;
        
        // Si el perfil en BD no tiene nombres pero los metadatos sí, actualizar la BD
        if ((!data.first_name || !data.last_name) && (metadataFirstName || metadataLastName)) {
          try {
            await supabase.rpc('update_current_user_profile', {
              new_first_name: firstName || null,
              new_last_name: lastName || null,
            });
          } catch (updateError) {
            console.error('Error updating profile:', updateError);
          }
        }
        
        // Siempre devolver el perfil con nombres completos (de BD o metadatos)
        return {
          ...data,
          first_name: firstName,
          last_name: lastName,
        } as UserProfile;
      }

      return null;
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Si hay error pero tenemos metadatos, crear perfil temporal
      if (currentUser) {
        const userMetadata = currentUser.user_metadata || {};
        const identityData = currentUser.identities?.[0]?.identity_data || {};
        const metadataFirstName = userMetadata.first_name || identityData.first_name;
        const metadataLastName = userMetadata.last_name || identityData.last_name;
        const metadataEmail = currentUser.email || '';
        
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
      }
      return null;
    }
  }, []);

  // Función para crear un perfil temporal desde metadatos del usuario
  const createTemporaryProfile = useCallback((userId: string, currentUser: User): UserProfile | null => {
    const userMetadata = currentUser.user_metadata || {};
    const identityData = currentUser.identities?.[0]?.identity_data || {};
    const metadataFirstName = userMetadata.first_name || identityData.first_name;
    const metadataLastName = userMetadata.last_name || identityData.last_name;
    const metadataEmail = currentUser.email || '';

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
  }, []);

  // Función para actualizar el estado de autenticación
  const updateAuthState = useCallback(async (currentSession: Session | null) => {
    if (currentSession?.user) {
      setSession(currentSession);
      setUser(currentSession.user);
      
      // Establecer perfil temporal inmediatamente con metadatos (antes de consultar BD)
      const tempProfile = createTemporaryProfile(currentSession.user.id, currentSession.user);
      if (tempProfile) {
        setProfile(tempProfile);
      }
      
      // Luego obtener perfil completo de la BD y actualizar
      const userProfile = await fetchUserProfile(currentSession.user.id, currentSession.user);
      if (userProfile) {
        setProfile(userProfile);
      } else if (!tempProfile) {
        setProfile(null);
      }
    } else {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  }, [fetchUserProfile, createTemporaryProfile]);

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

        // NUEVO: verificar admin al iniciar
        await checkAdminStatus();

        // Suscribirse a cambios de autenticación
        const authSubscription = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (!isMounted) return;

          console.log('Auth state changed:', event);

          // Para USER_UPDATED, solo actualizar el user sin hacer fetch completo del perfil
          // porque ya lo estamos actualizando en updateProfile
          if (event === 'USER_UPDATED' && newSession?.user) {
            console.log('USER_UPDATED: Actualizando solo user sin recargar perfil');
            setUser(newSession.user);
            setSession(newSession);
            return;
          }

          // Para otros eventos, actualizar estado completo
          await updateAuthState(newSession);

          // NUEVO: actualizar admin cuando cambie la sesión
          await checkAdminStatus();

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
          setIsAdmin(false);
          setAdminLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [updateAuthState, checkAdminStatus]);

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
      setIsAdmin(false);
      setAdminLoading(false);
      
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
      // Log de los datos que se van a actualizar
      console.log('=== Actualizando perfil ===');
      console.log('Updates recibidos:', updates);
      console.log('User metadata actual:', user.user_metadata);
      console.log('User identities actual:', user.identities);
      
      const updateParams = {
        new_first_name: updates.firstName || null,
        new_last_name: updates.lastName || null,
        new_bio: updates.bio || null,
        new_avatar_url: updates.avatarUrl || null,
      };
      
      console.log('Parámetros enviados a RPC:', updateParams);

      // Paso 1: Actualizar perfil en la base de datos
      const { error: updateError, data } = await supabase.rpc('update_current_user_profile', updateParams);

      console.log('Respuesta RPC:', { error: updateError, data });

      if (updateError) {
        console.error('Error en RPC update_current_user_profile:', updateError);
        setError('Error updating profile');
        return { error: updateError };
      }

      // Paso 2: Actualizar user_metadata en Supabase Auth
      const currentMetadata = user.user_metadata || {};
      
      // Usar valores actualizados o mantener los existentes
      const updatedFirstName = updates.firstName !== undefined ? updates.firstName : profile?.first_name || currentMetadata.first_name || '';
      const updatedLastName = updates.lastName !== undefined ? updates.lastName : profile?.last_name || currentMetadata.last_name || '';
      const updatedFullName = (updatedFirstName && updatedLastName) 
        ? `${updatedFirstName} ${updatedLastName}`.trim()
        : '';
      
      const newMetadata = {
        ...currentMetadata,
        first_name: updatedFirstName,
        last_name: updatedLastName,
        full_name: updatedFullName || currentMetadata.full_name || '',
        display_name: updatedFullName || currentMetadata.display_name || currentMetadata.full_name || '',
      };

      console.log('Actualizando user_metadata:', newMetadata);
      console.log('Valores calculados - firstName:', updatedFirstName, 'lastName:', updatedLastName, 'display_name:', newMetadata.display_name);
      
      const { data: authUpdateData, error: authUpdateError } = await supabase.auth.updateUser({
        data: newMetadata
      });

      console.log('Respuesta updateUser:', { error: authUpdateError, data: authUpdateData });

      if (authUpdateError) {
        console.error('Error actualizando user_metadata:', authUpdateError);
        // No retornar error aquí, el perfil ya se actualizó en BD
      } else {
        console.log('User metadata actualizado correctamente');
        console.log('Nuevo user metadata:', authUpdateData.user?.user_metadata);
        
        // Actualizar el estado local del user
        if (authUpdateData.user) {
          setUser(authUpdateData.user);
        }
      }

      // Paso 3: Actualizar el estado local del perfil directamente
      const updatedUser = authUpdateData?.user || user;
      
      // Usar los valores actualizados para el perfil
      const finalFirstName = updates.firstName !== undefined ? updates.firstName : (profile?.first_name || updatedFirstName);
      const finalLastName = updates.lastName !== undefined ? updates.lastName : (profile?.last_name || updatedLastName);
      const finalBio = updates.bio !== undefined ? updates.bio : profile?.bio;
      const finalAvatarUrl = updates.avatarUrl !== undefined ? updates.avatarUrl : profile?.avatar_url;
      
      setProfile((prev) => {
        if (!prev) {
          // Si no hay perfil previo, crear uno desde los datos actualizados
          return {
            id: updatedUser.id,
            email: updatedUser.email || '',
            first_name: finalFirstName || null,
            last_name: finalLastName || null,
            full_name: (finalFirstName && finalLastName) ? `${finalFirstName} ${finalLastName}`.trim() : null,
            display_name: (finalFirstName && finalLastName) ? `${finalFirstName} ${finalLastName}`.trim() : null,
            avatar_url: finalAvatarUrl || null,
            bio: finalBio || null,
            role: 'member',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as UserProfile;
        }
        return {
          ...prev,
          first_name: finalFirstName || prev.first_name,
          last_name: finalLastName || prev.last_name,
          bio: finalBio !== undefined ? finalBio : prev.bio,
          avatar_url: finalAvatarUrl !== undefined ? finalAvatarUrl : prev.avatar_url,
          full_name: (finalFirstName && finalLastName) ? `${finalFirstName} ${finalLastName}`.trim() : prev.full_name,
        };
      });

      // Obtener usuario final para logs
      const { data: { user: finalUser } } = await supabase.auth.getUser();
      console.log('Usuario final:', finalUser);
      console.log('User metadata después de actualizar:', finalUser?.user_metadata);
      console.log('User identities después de actualizar:', finalUser?.identities);
      console.log('Perfil en estado local después de actualizar:', {
        first_name: finalFirstName,
        last_name: finalLastName,
        bio: finalBio,
        avatar_url: finalAvatarUrl,
      });

      console.log('=== Perfil actualizado correctamente ===');
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
    isAdmin,
    adminLoading,
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
        isAdmin,
        adminLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
