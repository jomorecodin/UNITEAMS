-- =====================================================
-- 999_verification.sql
-- Script de verificación post-migración
-- Ejecuta este script DESPUÉS de todas las migraciones
-- =====================================================

-- Verificar extensiones habilitadas
DO $$
DECLARE
    ext_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO ext_count 
    FROM pg_extension 
    WHERE extname IN ('uuid-ossp', 'pgcrypto');
    
    IF ext_count = 2 THEN
        RAISE NOTICE '✅ Extensiones habilitadas correctamente (uuid-ossp, pgcrypto)';
    ELSE
        RAISE WARNING '❌ Faltan extensiones. Encontradas: %', ext_count;
    END IF;
END $$;

-- Verificar funciones creadas
DO $$
DECLARE
    func_count INTEGER;
    expected_functions TEXT[] := ARRAY[
        'update_updated_at_column',
        'generate_unique_id',
        'get_current_user_id',
        'is_authenticated',
        'is_owner',
        'handle_new_user',
        'get_current_user_profile',
        'update_current_user_profile'
    ];
    missing_functions TEXT[] := ARRAY[]::TEXT[];
    func_name TEXT;
BEGIN
    FOREACH func_name IN ARRAY expected_functions
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = func_name
        ) THEN
            missing_functions := array_append(missing_functions, func_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_functions, 1) IS NULL THEN
        RAISE NOTICE '✅ Todas las funciones creadas correctamente';
    ELSE
        RAISE WARNING '❌ Funciones faltantes: %', array_to_string(missing_functions, ', ');
    END IF;
END $$;

-- Verificar tabla profiles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') THEN
        RAISE NOTICE '✅ Tabla profiles creada correctamente';
        
        -- Verificar RLS habilitado
        IF EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'profiles' 
            AND schemaname = 'public' 
            AND rowsecurity = true
        ) THEN
            RAISE NOTICE '✅ RLS habilitado en tabla profiles';
        ELSE
            RAISE WARNING '❌ RLS no está habilitado en tabla profiles';
        END IF;
    ELSE
        RAISE WARNING '❌ Tabla profiles no encontrada';
    END IF;
END $$;

-- Verificar políticas RLS
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'profiles' AND schemaname = 'public';
    
    IF policy_count >= 4 THEN
        RAISE NOTICE '✅ Políticas RLS configuradas correctamente (% políticas)', policy_count;
    ELSE
        RAISE WARNING '❌ Políticas RLS insuficientes. Encontradas: %', policy_count;
    END IF;
END $$;

-- Verificar triggers
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'profiles'
    AND t.tgname IN ('update_profiles_updated_at');
    
    IF trigger_count >= 1 THEN
        RAISE NOTICE '✅ Triggers configurados correctamente';
    ELSE
        RAISE WARNING '❌ Triggers faltantes en tabla profiles';
    END IF;
END $$;

-- Verificar trigger en auth.users
DO $$
DECLARE
    auth_trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO auth_trigger_count
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users'
    AND t.tgname = 'on_auth_user_created';
    
    IF auth_trigger_count >= 1 THEN
        RAISE NOTICE '✅ Trigger de creación automática de perfiles configurado';
    ELSE
        RAISE WARNING '❌ Trigger on_auth_user_created no encontrado';
    END IF;
END $$;

-- Verificar vistas
DO $$
DECLARE
    view_count INTEGER;
    expected_views TEXT[] := ARRAY['user_info', 'user_profiles'];
    missing_views TEXT[] := ARRAY[]::TEXT[];
    view_name TEXT;
BEGIN
    FOREACH view_name IN ARRAY expected_views
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_views 
            WHERE viewname = view_name AND schemaname = 'public'
        ) THEN
            missing_views := array_append(missing_views, view_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_views, 1) IS NULL THEN
        RAISE NOTICE '✅ Todas las vistas creadas correctamente';
    ELSE
        RAISE WARNING '❌ Vistas faltantes: %', array_to_string(missing_views, ', ');
    END IF;
END $$;

-- Verificar tipos de datos
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        RAISE NOTICE '✅ Tipo user_role creado correctamente';
    ELSE
        RAISE WARNING '❌ Tipo user_role no encontrado';
    END IF;
END $$;

-- Mostrar estadísticas de la base de datos
DO $$
DECLARE
    user_count INTEGER;
    profile_count INTEGER;
BEGIN
    -- Contar usuarios en auth.users
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    -- Contar perfiles
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    
    RAISE NOTICE '📊 Estadísticas:';
    RAISE NOTICE '   - Usuarios registrados: %', user_count;
    RAISE NOTICE '   - Perfiles creados: %', profile_count;
    
    IF user_count = profile_count THEN
        RAISE NOTICE '✅ Todos los usuarios tienen perfil';
    ELSIF profile_count < user_count THEN
        RAISE WARNING '❌ Algunos usuarios no tienen perfil (% faltantes)', user_count - profile_count;
    END IF;
END $$;

-- Prueba de funciones básicas
DO $$
DECLARE
    current_user_id UUID;
    is_auth BOOLEAN;
BEGIN
    -- Probar función get_current_user_id
    SELECT public.get_current_user_id() INTO current_user_id;
    
    -- Probar función is_authenticated
    SELECT public.is_authenticated() INTO is_auth;
    
    RAISE NOTICE '🧪 Pruebas de funciones:';
    RAISE NOTICE '   - get_current_user_id(): %', COALESCE(current_user_id::TEXT, 'NULL (no autenticado)');
    RAISE NOTICE '   - is_authenticated(): %', is_auth;
END $$;

-- Resumen final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 VERIFICACIÓN COMPLETADA';
    RAISE NOTICE '================================';
    RAISE NOTICE 'Si todos los elementos muestran ✅, tu base de datos está lista.';
    RAISE NOTICE 'Si hay elementos con ❌, revisa las migraciones anteriores.';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Próximos pasos:';
    RAISE NOTICE '1. Configura las variables de entorno en tu aplicación';
    RAISE NOTICE '2. Inicia el servidor de desarrollo (npm run dev)';
    RAISE NOTICE '3. Prueba el registro de usuarios';
    RAISE NOTICE '4. Verifica que se crean perfiles automáticamente';
    RAISE NOTICE '';
END $$;
