-- =====================================================
-- 003_profiles_table.sql
-- Tabla de perfiles de usuario y configuración automática
-- =====================================================

-- Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    role public.user_role DEFAULT 'member',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT profiles_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT profiles_full_name_length CHECK (length(full_name) >= 2 AND length(full_name) <= 100),
    CONSTRAINT profiles_bio_length CHECK (length(bio) <= 500)
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles(created_at);

-- Habilitar Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
-- Los usuarios pueden ver todos los perfiles (para colaboración)
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Los usuarios solo pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Los usuarios solo pueden eliminar su propio perfil
CREATE POLICY "Users can delete own profile" 
ON public.profiles FOR DELETE 
TO authenticated 
USING (auth.uid() = id);

-- Crear trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para ejecutar la función cuando se crea un nuevo usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Función para obtener el perfil del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS public.profiles AS $$
DECLARE
    profile public.profiles;
BEGIN
    SELECT * INTO profile
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar el perfil del usuario actual
CREATE OR REPLACE FUNCTION public.update_current_user_profile(
    new_full_name TEXT DEFAULT NULL,
    new_bio TEXT DEFAULT NULL,
    new_avatar_url TEXT DEFAULT NULL,
    new_preferences JSONB DEFAULT NULL
)
RETURNS public.profiles AS $$
DECLARE
    updated_profile public.profiles;
BEGIN
    UPDATE public.profiles
    SET 
        full_name = COALESCE(new_full_name, full_name),
        bio = COALESCE(new_bio, bio),
        avatar_url = COALESCE(new_avatar_url, avatar_url),
        preferences = COALESCE(new_preferences, preferences),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = auth.uid()
    RETURNING * INTO updated_profile;
    
    RETURN updated_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear vista para obtener información completa del usuario
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.role,
    p.preferences,
    p.created_at,
    p.updated_at,
    u.email_confirmed_at,
    u.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id;

-- Comentarios para documentación
COMMENT ON TABLE public.profiles IS 'Perfiles de usuario con información adicional';
COMMENT ON COLUMN public.profiles.id IS 'ID del usuario (referencia a auth.users)';
COMMENT ON COLUMN public.profiles.email IS 'Email del usuario (copiado de auth.users)';
COMMENT ON COLUMN public.profiles.full_name IS 'Nombre completo del usuario';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL del avatar del usuario';
COMMENT ON COLUMN public.profiles.bio IS 'Biografía o descripción del usuario';
COMMENT ON COLUMN public.profiles.role IS 'Rol del usuario en el sistema';
COMMENT ON COLUMN public.profiles.preferences IS 'Preferencias del usuario en formato JSON';

COMMENT ON FUNCTION public.handle_new_user() IS 'Crea automáticamente un perfil cuando se registra un nuevo usuario';
COMMENT ON FUNCTION public.get_current_user_profile() IS 'Obtiene el perfil del usuario actualmente autenticado';
COMMENT ON FUNCTION public.update_current_user_profile(TEXT, TEXT, TEXT, JSONB) IS 'Actualiza el perfil del usuario actual';
COMMENT ON VIEW public.user_profiles IS 'Vista completa de perfiles con información de autenticación';

-- Insertar perfil para usuarios existentes (si los hay)
INSERT INTO public.profiles (id, email, full_name)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Tabla profiles creada exitosamente';
    RAISE NOTICE 'Políticas RLS configuradas para seguridad';
    RAISE NOTICE 'Triggers automáticos configurados';
    RAISE NOTICE 'Funciones de utilidad creadas';
    RAISE NOTICE 'Vista user_profiles disponible';
    RAISE NOTICE 'Perfiles creados para usuarios existentes';
END $$;
