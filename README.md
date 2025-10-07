# 🚀 Uniteams - Plataforma de Colaboración en Equipos

Una aplicación web moderna construida con React 19, Vite, TypeScript, TailwindCSS y Supabase para la colaboración en equipos.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#️-stack-tecnológico)
- [Configuración Inicial](#-configuración-inicial)
- [Configuración de Supabase](#-configuración-de-supabase)
- [Instalación y Desarrollo](#-instalación-y-desarrollo)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Scripts Disponibles](#-scripts-disponibles)
- [Migraciones de Base de Datos](#-migraciones-de-base-de-datos)

## ✨ Características

- **🔐 Autenticación**: Registro e inicio de sesión seguro con Supabase Auth
- **🛡️ Rutas Protegidas**: Protección de rutas con redirecciones automáticas
- **📱 Diseño Responsivo**: Diseño mobile-first con TailwindCSS
- **🌙 UI Moderna**: Tema oscuro con diseño minimalista
- **♿ Accesibilidad**: Formularios compatibles con WCAG
- **🔒 Type Safety**: Soporte completo de TypeScript con modo estricto

## 🛠️ Stack Tecnológico

- **Frontend**: React 19, TypeScript, Vite
- **Estilos**: TailwindCSS v4
- **Enrutamiento**: React Router v6+
- **Autenticación**: Supabase Auth
- **Base de Datos**: PostgreSQL (Supabase)
- **Calidad de Código**: ESLint, Prettier
- **Herramienta de Build**: Vite

## 🚀 Configuración Inicial

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase (gratuita)

### 1. Clonar e Instalar

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd uniteams

# Instalar dependencias
npm install
```

## 🔧 Configuración de Supabase

### Paso 1: Crear Cuenta en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Haz clic en **"Start your project"**
3. Regístrate con:
   - GitHub (recomendado)
   - Google
   - Email y contraseña

### Paso 2: Crear Nuevo Proyecto

1. En el dashboard, haz clic en **"New Project"**
2. Completa los datos:
   - **Name**: `Uniteams`
   - **Database Password**: Crea una contraseña segura (¡guárdala!)
   - **Region**: Selecciona la más cercana
   - **Plan**: Selecciona **"Free"**
3. Haz clic en **"Create new project"**
4. Espera 1-2 minutos a que se configure

### Paso 3: Obtener Credenciales

1. Ve a **Settings** ⚙️ → **API**
2. Copia estos valores:
   - **Project URL**: `https://tu-proyecto.supabase.co`
   - **anon public key**: `eyJ...` (clave larga)

### Paso 4: Configurar Variables de Entorno

```bash
# Crear archivo de configuración
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Paso 5: Ejecutar Migraciones

1. Ve a tu proyecto en Supabase
2. Abre **SQL Editor**
3. Ejecuta los archivos de migración en orden (ver carpeta `database/migrations/`)

## 💻 Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# Ejecutar migraciones en Supabase (ver sección de migraciones)

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
uniteams/
├── 📄 README.md
├── 📄 .env.example
├── 📄 package.json
├── 📄 tailwind.config.js
├── 📄 postcss.config.js
├── 📄 tsconfig.json
├── 📄 vite.config.ts
├── 🗂️ database/
│   └── migrations/           # Migraciones SQL
│       ├── 001_initial_setup.sql
│       ├── 002_auth_setup.sql
│       └── 003_profiles_table.sql
├── 🗂️ src/
│   ├── 📄 index.css
│   ├── 📄 main.tsx
│   ├── 📄 App.tsx
│   ├── 🗂️ lib/
│   │   └── supabaseClient.ts
│   ├── 🗂️ context/
│   │   └── AuthContext.tsx
│   ├── 🗂️ routes/
│   │   ├── AppRouter.tsx
│   │   └── ProtectedRoute.tsx
│   ├── 🗂️ pages/
│   │   ├── Landing.tsx
│   │   ├── SignUp.tsx
│   │   ├── SignIn.tsx
│   │   └── Dashboard.tsx
│   └── 🗂️ components/
│       ├── Navbar.tsx
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       └── AuthLayout.tsx
└── 🗂️ public/
    └── vite.svg
```

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build           # Build de producción
npm run preview         # Preview del build

# Calidad de código
npm run lint            # Ejecutar ESLint
npm run lint:fix        # Corregir errores de ESLint
npm run format          # Formatear con Prettier
npm run format:check    # Verificar formato
```

## 🗄️ Migraciones de Base de Datos

### Cómo ejecutar las migraciones

1. Ve a tu proyecto en Supabase
2. Abre **SQL Editor** en el menú lateral
3. Ejecuta los archivos en orden:

#### 1. Configuración Inicial (`001_initial_setup.sql`)
- Configura la base de datos inicial
- Habilita extensiones necesarias

#### 2. Configuración de Auth (`002_auth_setup.sql`)
- Configura políticas de autenticación
- Habilita registro público

#### 3. Tabla de Perfiles (`003_profiles_table.sql`)
- Crea tabla de perfiles de usuario
- Configura triggers automáticos

### Orden de ejecución

```sql
-- 1. Ejecutar primero
database/migrations/001_initial_setup.sql

-- 2. Ejecutar segundo
database/migrations/002_auth_setup.sql

-- 3. Ejecutar tercero
database/migrations/003_profiles_table.sql
```

## 🔐 Características de Seguridad

- **Autenticación persistente** con manejo automático de sesiones
- **Rutas protegidas** con redirecciones fluidas
- **Validación de formularios** con manejo de errores
- **Políticas RLS** (Row Level Security) en Supabase
- **Variables de entorno** para credenciales sensibles

## 🎨 Características de UI/UX

- **Tema oscuro** con fondo negro minimalista
- **Diseño responsivo** que funciona en todos los dispositivos
- **Formularios accesibles** con validación y manejo de errores
- **Estados de carga** para mejor experiencia de usuario
- **Tipografía moderna** con contraste optimizado

## 🚀 Despliegue

### Variables de entorno para producción

```env
VITE_SUPABASE_URL=tu_url_de_produccion
VITE_SUPABASE_ANON_KEY=tu_clave_de_produccion
```

### Build de producción

```bash
npm run build
```

Los archivos se generarán en la carpeta `dist/`

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 🆘 Solución de Problemas

### Error: "supabaseUrl is required"
- Verifica que el archivo `.env` existe
- Confirma que las variables están configuradas correctamente
- Reinicia el servidor de desarrollo

### Error: "Invalid API key"
- Verifica que copiaste la clave correcta desde Supabase
- Asegúrate de usar la **anon public key**, no la service key

### Problemas de autenticación
- Verifica que ejecutaste todas las migraciones
- Confirma que el email confirmation está deshabilitado en desarrollo

## 📞 Soporte

Si tienes problemas:
1. Revisa esta documentación
2. Verifica la consola del navegador para errores
3. Consulta la documentación de [Supabase](https://supabase.com/docs)

---

¡Listo para colaborar! 🎉