# 🗄️ Migraciones de Base de Datos - Uniteams

Esta carpeta contiene las migraciones SQL necesarias para configurar la base de datos de Supabase.

## 📋 Orden de Ejecución

**⚠️ IMPORTANTE**: Ejecuta las migraciones en el orden exacto que se muestra a continuación.

### 1. `001_initial_setup.sql`
**Propósito**: Configuración inicial de la base de datos
- Habilita extensiones necesarias (`uuid-ossp`, `pgcrypto`)
- Crea funciones utilitarias
- Configura el esquema principal

### 2. `002_auth_setup.sql`
**Propósito**: Configuración de autenticación y seguridad
- Crea funciones de seguridad
- Configura políticas de acceso
- Establece tipos de datos para roles
- Crea vistas seguras

### 3. `003_profiles_table.sql`
**Propósito**: Tabla de perfiles de usuario
- Crea tabla `profiles` con RLS habilitado
- Configura triggers automáticos
- Establece políticas de seguridad
- Crea funciones para manejo de perfiles

### 4. `004_add_separate_names.sql`
**Propósito**: Agregar campos de nombres separados
- Agrega columnas `first_name` y `last_name`
- Migra datos existentes desde `full_name`
- Actualiza funciones para registro y actualización
- Crea vista con `display_name` calculado

## 🚀 Cómo Ejecutar las Migraciones

### Paso a Paso en Supabase

1. **Accede a tu proyecto en Supabase**
   - Ve a [supabase.com](https://supabase.com)
   - Selecciona tu proyecto `Uniteams`

2. **Abre el SQL Editor**
   - En el menú lateral, haz clic en **"SQL Editor"**
   - Verás una interfaz para ejecutar consultas SQL

3. **Ejecuta cada migración**

   **Primera migración:**
   ```sql
   -- Copia y pega el contenido completo de 001_initial_setup.sql
   -- Haz clic en "Run" o presiona Ctrl+Enter
   ```

   **Segunda migración:**
   ```sql
   -- Copia y pega el contenido completo de 002_auth_setup.sql
   -- Haz clic en "Run" o presiona Ctrl+Enter
   ```

   **Tercera migración:**
   ```sql
   -- Copia y pega el contenido completo de 003_profiles_table.sql
   -- Haz clic en "Run" o presiona Ctrl+Enter
   ```

   **Cuarta migración:**
   ```sql
   -- Copia y pega el contenido completo de 004_add_separate_names.sql
   -- Haz clic en "Run" o presiona Ctrl+Enter
   ```

4. **Verificar la ejecución**
   - Cada migración mostrará mensajes de confirmación
   - Si hay errores, revisa el mensaje y corrige antes de continuar

## ✅ Verificación Post-Migración

Después de ejecutar todas las migraciones, verifica que todo esté configurado correctamente:

### 1. Verificar Tablas Creadas

```sql
-- Ejecuta esta consulta para ver las tablas creadas
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Deberías ver:
- `profiles` (tabla)
- `user_info` (vista)
- `user_profiles` (vista)

### 2. Verificar Funciones Creadas

```sql
-- Ejecuta esta consulta para ver las funciones creadas
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;
```

Deberías ver funciones como:
- `get_current_user_id()`
- `is_authenticated()`
- `is_owner()`
- `handle_new_user()`
- `get_current_user_profile()`
- `update_current_user_profile()`

### 3. Verificar Políticas RLS

```sql
-- Verificar que RLS está habilitado en la tabla profiles
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';
```

### 4. Probar la Funcionalidad

```sql
-- Probar función de usuario actual (debería devolver NULL si no estás autenticado)
SELECT public.get_current_user_id();

-- Probar función de autenticación
SELECT public.is_authenticated();
```

## 🔧 Configuración Adicional en Supabase

### Deshabilitar Confirmación de Email (Solo para Desarrollo)

1. Ve a **Authentication** → **Settings**
2. Desactiva **"Enable email confirmations"**
3. Esto permite registro sin confirmar email en desarrollo

### Configurar Proveedores de Auth (Opcional)

1. Ve a **Authentication** → **Providers**
2. Configura proveedores adicionales si los necesitas:
   - Google
   - GitHub
   - Discord
   - etc.

## 🐛 Solución de Problemas

### Error: "Extension does not exist"
- Asegúrate de tener permisos de administrador en tu proyecto
- Las extensiones deberían instalarse automáticamente en Supabase

### Error: "Function already exists"
- Si re-ejecutas una migración, usa `CREATE OR REPLACE FUNCTION`
- Las migraciones están diseñadas para ser re-ejecutables

### Error: "Permission denied"
- Verifica que estás ejecutando las consultas como administrador
- En Supabase, deberías tener permisos completos por defecto

### Tabla profiles no se crea automáticamente
- Verifica que ejecutaste las migraciones en orden
- El trigger `on_auth_user_created` debería crear perfiles automáticamente

## 📊 Estructura Final de la Base de Datos

Después de ejecutar todas las migraciones, tendrás:

```
📦 Base de Datos
├── 🔐 auth (esquema de Supabase)
│   └── users (tabla de usuarios)
├── 🏠 public (esquema principal)
│   ├── 📋 Tablas
│   │   └── profiles (perfiles de usuario)
│   ├── 👁️ Vistas
│   │   ├── user_info (info básica de usuarios)
│   │   └── user_profiles (perfiles completos)
│   ├── ⚡ Funciones
│   │   ├── get_current_user_id()
│   │   ├── is_authenticated()
│   │   ├── is_owner()
│   │   ├── handle_new_user()
│   │   ├── get_current_user_profile()
│   │   └── update_current_user_profile()
│   ├── 🔒 Políticas RLS
│   │   └── Políticas de seguridad para profiles
│   └── ⚙️ Triggers
│       ├── update_profiles_updated_at
│       └── on_auth_user_created
```

## 🎯 Próximos Pasos

Una vez completadas las migraciones:

1. **Configura las variables de entorno** en tu aplicación
2. **Inicia el servidor de desarrollo** (`npm run dev`)
3. **Prueba el registro de usuarios** - debería crear perfiles automáticamente
4. **Verifica la autenticación** - los usuarios deberían poder iniciar sesión
5. **Revisa el dashboard** - debería mostrar información del usuario

¡Tu base de datos está lista para Uniteams! 🚀
