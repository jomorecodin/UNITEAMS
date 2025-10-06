-- =====================================================
-- 004_add_separate_names.sql
-- Agregar campos first_name y last_name a la tabla profiles
-- MIGRACIÓN SIMPLE Y SEGURA
-- =====================================================

-- Paso 1: Agregar las columnas first_name y last_name
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Paso 2: Poblar los nuevos campos con datos de full_name existente
UPDATE public.profiles 
SET 
    first_name = CASE 
        WHEN full_name IS NOT NULL AND trim(full_name) != '' THEN
            trim(split_part(full_name, ' ', 1))
        ELSE 
            split_part(email, '@', 1)
    END,
    last_name = CASE 
        WHEN full_name IS NOT NULL AND trim(full_name) != '' AND position(' ' in trim(full_name)) > 0 THEN
            trim(substring(full_name from position(' ' in full_name) + 1))
        ELSE 
            ''
    END
WHERE first_name IS NULL OR last_name IS NULL;

-- Paso 3: Actualizar la función handle_new_user para usar los nuevos campos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_first_name TEXT;
    user_last_name TEXT;
    user_full_name TEXT;
BEGIN
    -- Extraer nombres de los metadatos del usuario
    user_first_name := COALESCE(
        NEW.raw_user_meta_data->>'first_name',
        trim(split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), ' ', 1))
    );
    
    user_last_name := COALESCE(
        NEW.raw_user_meta_data->>'last_name',
        CASE 
            WHEN position(' ' in COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')) > 0 THEN
                trim(substring(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name') from position(' ' in COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')) + 1))
            ELSE 
                ''
        END
    );
    
    user_full_name := trim(user_first_name || CASE WHEN user_last_name != '' THEN ' ' || user_last_name ELSE '' END);

    INSERT INTO public.profiles (id, email, first_name, last_name, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        user_first_name,
        user_last_name,
        user_full_name
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 4: Crear función para actualizar perfil con nombres separados
CREATE OR REPLACE FUNCTION public.update_current_user_profile(
    new_first_name TEXT DEFAULT NULL,
    new_last_name TEXT DEFAULT NULL,
    new_full_name TEXT DEFAULT NULL,
    new_bio TEXT DEFAULT NULL,
    new_avatar_url TEXT DEFAULT NULL,
    new_preferences JSONB DEFAULT NULL
)
RETURNS public.profiles AS $$
DECLARE
    updated_profile public.profiles;
    computed_full_name TEXT;
BEGIN
    -- Calcular full_name si se proporcionan first_name o last_name
    IF new_first_name IS NOT NULL OR new_last_name IS NOT NULL THEN
        SELECT 
            trim(COALESCE(new_first_name, first_name) || 
                 CASE WHEN COALESCE(new_last_name, last_name) != '' 
                      THEN ' ' || COALESCE(new_last_name, last_name) 
                      ELSE '' END)
        INTO computed_full_name
        FROM public.profiles 
        WHERE id = auth.uid();
    END IF;
    
    UPDATE public.profiles
    SET 
        first_name = COALESCE(new_first_name, first_name),
        last_name = COALESCE(new_last_name, last_name),
        full_name = COALESCE(new_full_name, computed_full_name, full_name),
        bio = COALESCE(new_bio, bio),
        avatar_url = COALESCE(new_avatar_url, avatar_url),
        preferences = COALESCE(new_preferences, preferences),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = auth.uid()
    RETURNING * INTO updated_profile;
    
    RETURN updated_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 5: Actualizar la vista user_profiles para incluir display_name
DROP VIEW IF EXISTS public.user_profiles;
CREATE VIEW public.user_profiles AS
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.full_name,
    CASE 
        WHEN p.first_name IS NOT NULL AND p.first_name != '' THEN
            trim(p.first_name || CASE WHEN p.last_name IS NOT NULL AND p.last_name != '' THEN ' ' || p.last_name ELSE '' END)
        ELSE p.full_name
    END as display_name,
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

-- Paso 6: Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS profiles_first_name_idx ON public.profiles(first_name);
CREATE INDEX IF NOT EXISTS profiles_last_name_idx ON public.profiles(last_name);

-- Mensaje de confirmación
DO $$
DECLARE
    profile_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    
    RAISE NOTICE '✅ Migración completada exitosamente';
    RAISE NOTICE '📝 Campos first_name y last_name agregados';
    RAISE NOTICE '🔄 % perfiles actualizados', profile_count;
    RAISE NOTICE '👁️ Vista user_profiles actualizada';
    RAISE NOTICE '⚡ Funciones actualizadas para manejar nombres separados';
END $$;
