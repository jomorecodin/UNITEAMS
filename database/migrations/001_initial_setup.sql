-- =====================================================
-- 001_initial_setup.sql
-- Configuración inicial de la base de datos
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Crear esquema para la aplicación si no existe
CREATE SCHEMA IF NOT EXISTS public;

-- Comentario sobre la migración
COMMENT ON SCHEMA public IS 'Esquema principal para Uniteams - Configuración inicial';

-- Crear función para actualizar timestamps automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION update_updated_at_column() IS 'Función para actualizar automáticamente el campo updated_at';

-- Crear función para generar IDs únicos
CREATE OR REPLACE FUNCTION generate_unique_id()
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(REPLACE(uuid_generate_v4()::TEXT, '-', ''));
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION generate_unique_id() IS 'Genera IDs únicos sin guiones para usar como identificadores';

-- Verificar que las extensiones están habilitadas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        RAISE EXCEPTION 'Extension uuid-ossp is not available';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
        RAISE EXCEPTION 'Extension pgcrypto is not available';
    END IF;
    
    RAISE NOTICE 'Configuración inicial completada exitosamente';
END $$;
