// src/context/AuthContext.tsx

// ---- IMPORTACIONES ----
import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react'; // Importación de tipo separada
import { supabase } from '../lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

// ---- TIPOS Y DEFINICIONES ----

// 1. Define un tipo para el perfil del usuario
interface Profile {
  id: string;
  full_name: string;
}

// 2. Define el tipo de datos que proveerá el contexto
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

// 3. Crea el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Define las props para el componente Provider
interface AuthProviderProps {
  children: ReactNode;
}


// ---- COMPONENTE PROVIDER (ÚNICA DEFINICIÓN) ----
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Función para obtener la sesión y el perfil inicial
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);
      }
      setLoading(false);
    };

    fetchSessionAndProfile();

    // Listener para cambios de autenticación (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('id', session.user.id)
            .single();
          setProfile(profileData);
        } else {
          setProfile(null); // Limpia el perfil al cerrar sesión
        }
        setLoading(false);
      }
    );

    // Limpia la suscripción al desmontar el componente
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = { session, user, profile, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};


// ---- HOOK PERSONALIZADO ----
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};