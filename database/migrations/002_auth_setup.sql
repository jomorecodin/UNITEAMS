-- =====================================================
-- 002_auth_setup.sql
-- Configuración de autenticación y políticas de seguridad
-- =====================================================

-- Habilitar Row Level Security en el esquema auth (ya viene habilitado por defecto en Supabase)
-- Pero vamos a configurar algunas políticas adicionales

-- Configurar políticas para la tabla auth.users (solo lectura para usuarios autenticados)
-- Nota: En Supabase, auth.users ya tiene sus políticas, pero podemos crear vistas seguras

-- Crear una vista segura para acceder a información básica del usuario
CREATE OR REPLACE VIEW public.user_info AS
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at
FROM auth.users;

-- Habilitar RLS en la vista (aunque las vistas no soportan RLS directamente,
-- la tabla subyacente auth.users ya tiene sus controles)
COMMENT ON VIEW public.user_info IS 'Vista segura para acceder a información básica de usuarios';

-- Crear función para obtener el ID del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_current_user_id() IS 'Obtiene el ID del usuario actualmente autenticado';

-- Crear función para verificar si un usuario está autenticado
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_authenticated() IS 'Verifica si hay un usuario autenticado';

-- Configurar políticas de seguridad para futuras tablas
-- Esta función será útil para crear políticas RLS
CREATE OR REPLACE FUNCTION public.is_owner(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_owner(UUID) IS 'Verifica si el usuario actual es el propietario del recurso';

-- Configuración adicional para desarrollo
-- Nota: En producción, asegúrate de que estas configuraciones sean apropiadas

-- Crear tipo enum para roles de usuario (para uso futuro)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'member', 'viewer');
    END IF;
END $$;

COMMENT ON TYPE public.user_role IS 'Roles disponibles para usuarios en el sistema';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Configuración de autenticación completada exitosamente';
    RAISE NOTICE 'Funciones de seguridad creadas: get_current_user_id(), is_authenticated(), is_owner()';
    RAISE NOTICE 'Vista user_info creada para acceso seguro a datos de usuario';
    RAISE NOTICE 'Tipo user_role creado para manejo de roles';
END $$;
