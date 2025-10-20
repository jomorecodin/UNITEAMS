import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user, profile, signOut, loading, initialLoading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  // ✅ CORREGIDO: Usar initialLoading para la carga inicial
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">No autenticado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Bienvenido a tu Panel
          </h1>
          <p className="text-neutral-400 text-lg">
            Hola, {profile?.display_name || profile?.first_name || user?.email}! Este es tu espacio personal de trabajo.
          </p>
          {profile && (
            <div className="mt-4 text-sm text-neutral-500">
              <p>Correo: {profile.email}</p>
              {profile.first_name && profile.last_name && (
                <p>Nombre completo: {profile.first_name} {profile.last_name}</p>
              )}
              <p>Rol: {profile.role}</p>
              <p>Miembro desde: {new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {/* Resto del componente igual */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Equipos</h3>
              <p className="text-neutral-400 text-sm">
                Administra tus equipos y colabora con otros
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-xl">🗂️</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Proyectos
              </h3>
              <p className="text-neutral-400 text-sm">
                Haz seguimiento de tus proyectos y monitorea el progreso
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-xl">🛠️</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Configuración
              </h3>
              <p className="text-neutral-400 text-sm">
                Personaliza tu cuenta y preferencias
              </p>
            </div>
          </Card>

          
        </div>

        <Card className="p-8">
          <div className="text-center space-y-6">
            {/* Icono para Primeros Pasos */}
            <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto flex items-center justify-center mb-4">
              <span className="text-white text-2xl">🚀</span>
            </div>
            <h2 className="text-2xl font-semibold text-white">
              Primeros Pasos
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              Este es un panel de ejemplo. En una aplicación real, aquí verías tus equipos, proyectos, notificaciones y otra información relevante.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/create-group">
                <Button variant="primary">
                  Create Study Group
                </Button>
              </Link>
              <Link to="/study-groups">
                <Button variant="secondary">
                  Join Team
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card className="p-8 mt-8">
          <div className="text-center space-y-6">
            {/* Icono para Conviértete en Tutor */}
            <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto flex items-center justify-center mb-4">
              <span className="text-white text-2xl">🎓</span>
            </div>
            <h2 className="text-2xl font-semibold text-white">
              Conviértete en Tutor
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              ¿Listo para compartir tu experiencia? 
              Aplica ahora para ser Tutor y ayuda a otros estudiantes a tener éxito en tus materias más fuertes. 
              Gana experiencia en liderazgo, obtén horas de servicio y refuerza tus propios conocimientos. 
              Se requiere un buen historial académico.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/apply-tutor">
                <Button
                  variant="primary"
                  className="w-full sm:w-auto px-8 py-4 text-lg"
                >
                  Aplicar
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card className="p-6 mt-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                {/* Icono de materias */}
                <span className="text-white text-xl">📚</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Registro de Materias
              </h3>
              <p className="text-neutral-400 text-sm">
                Consulta y registra nuevas materias.
              </p>
              <div className="mt-4">
                <Link to="/subjects-register">
                  <Button variant="primary">Ir</Button>
                </Link>
              </div>
            </div>
          </Card>

          
          <Card className="p-6 mt-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-xl">✅</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Aceptación de tutor
              </h3>
              <p className="text-neutral-400 text-sm">
                Revisa y procesa las solicitudes de tutoría pendientes.
              </p>
              <div className="mt-4">
                <Link to="/accept-tutor">
                  <Button variant="primary">Ir</Button>
                </Link>
              </div>
            </div>
          </Card>

        <div className="text-center mt-8">
          <Button
            variant="secondary"
            onClick={handleSignOut}
            loading={loading}
            className="px-6 py-3"
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
};