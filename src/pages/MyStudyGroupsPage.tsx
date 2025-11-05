import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createPortal } from 'react-dom';

interface StudyGroup {
  id: number;
  code: string;
  name: string;
  subject: string;
  // Opcionales para los detalles (no rompen si no existen)
  description?: string;
  session_type?: 'seguimiento' | 'examen' | string;
  meeting_day?: string | null;
  meeting_date?: string | null;
  meeting_time?: string | null;
  tutor_name?: string | null;
  tutorName?: string | null;
  current_participants?: number;
  max_participants?: number;
  is_private?: boolean;
  owner_name?: string | null;
  created_at?: string;
}

// Helpers de estilo para etiquetas (mismos colores que antes)
const getSessionTypeDisplay = (type?: string) => {
  const t = (type || '').toLowerCase();
  return t === 'examen' ? 'Examen' : 'Seguimiento';
};
const getSessionTypeColor = (type?: string) => {
  const t = (type || '').toLowerCase();
  return t === 'examen'
    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
};

export const MyStudyGroupsPage: React.FC = () => {
  const { user } = useAuth();
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsGroup, setDetailsGroup] = useState<StudyGroup | null>(null);

  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        setLoading(true);
        const tokenKey = 'sb-zskuikxfcjobpygoueqp-auth-token';
        const tokenData = localStorage.getItem(tokenKey);
        
        if (!tokenData) {
          setError('Debes iniciar sesión');
          setLoading(false);
          return;
        }

        const authData = JSON.parse(tokenData);
        const accessToken = authData.access_token;

        console.log('📚 Cargando mis grupos...');

        const response = await fetch('http://localhost:8080/api/study-groups/my-groups', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Error cargando tus grupos');
        }

        const groups = await response.json();
        console.log('✅ Grupos cargados:', groups);
        setMyGroups(groups);
      } catch (err: any) {
        console.error('❌ Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMyGroups();
    }
  }, [user]);

  const handleLeaveGroup = async (groupCode: string, groupName: string) => {
    if (!confirm(`¿Estás seguro de que quieres salir del grupo "${groupName}"?`)) {
      return;
    }

    try {
      const tokenKey = 'sb-zskuikxfcjobpygoueqp-auth-token';
      const tokenData = localStorage.getItem(tokenKey);
      
      if (!tokenData) return;

      const authData = JSON.parse(tokenData);
      const accessToken = authData.access_token;

      console.log('🚪 Saliendo del grupo:', groupCode);

      const response = await fetch(`http://localhost:8080/api/study-groups/${groupCode}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('✅ ' + result.message);
        // Recargar la lista
        setMyGroups(prev => prev.filter(group => group.code !== groupCode));
      } else {
        alert('❌ ' + (result.error || 'Error al salir del grupo'));
      }
    } catch (error: any) {
      console.error('Error saliendo del grupo:', error);
      alert('❌ Error al salir del grupo: ' + error.message);
    }
  };

  const openDetails = (g: StudyGroup) => setDetailsGroup(g);
  const closeDetails = () => setDetailsGroup(null);

  const formatTime = (time?: string | null) => {
    if (!time) return 'Por definir';
    try {
      const [h, m] = time.split(':');
      const d = new Date();
      d.setHours(Number(h), Number(m || 0), 0, 0);
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch { return time; }
  };

  const formatDate = (date?: string | null) => {
    if (!date) return 'Por definir';
    try {
      return new Date(date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return date; }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8 flex items-center justify-center" style={{ paddingTop: '5rem' }}>
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white">Cargando tus grupos...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8 flex items-center justify-center" style={{ paddingTop: '5rem' }}>
        <Card className="p-8 text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">Error al cargar grupos</h3>
          <p className="text-neutral-400 mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
            <Link to="/dashboard">
              <Button variant="secondary">
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8 mt-10" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Mis Grupos de Estudio
            </h1>
            <p className="text-neutral-400 text-lg">
              Gestiona los grupos a los que perteneces
            </p>
            <div className="mt-4 text-sm text-neutral-500">
              <p>Total de grupos: {myGroups.length}</p>
            </div>
          </div>

          {/* Información adicional */}
          <Card className="p-6 mt-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-3">
                ¿Cómo funcionan los grupos?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-400">
                <div className="text-center">
                  <div className="w-10 h-10 bg-neutral-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-lg">👥</span>
                  </div>
                  <p>Únete a grupos públicos o privados</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-neutral-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-lg">📅</span>
                  </div>
                  <p>Las sesiones aparecen en tu calendario</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-neutral-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-lg">🔒</span>
                  </div>
                  <p>Puedes salir de grupos cuando quieras</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 mt-8">
            {myGroups.map(group => (
              <Card key={group.id} className="p-6 hover:shadow-lg transition-all duration-300 border-2 border-green-500/20">
                <div className="space-y-4">
                  {/* Cabecera mínima */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white line-clamp-1">{group.name}</h3>
                    
                  </div>
                  <span className="bg-gray-500/20 text-gray-400 border border-gray-500/30 px-3 py-1 rounded-full text-neutral-300 text-xs">{group.subject}</span>
                  {/* Etiquetas debajo de la materia */}
                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    <span className={`px-3 py-1 rounded-full text-xs ${getSessionTypeColor(group.session_type)}`}>
                      {getSessionTypeDisplay(group.session_type)}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        group.is_private
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}
                    >
                      {group.is_private ? '🔒 Privado' : '🌍 Público'}
                    </span>
                  </div>

                  {/* Acciones resumidas */}
                  <div className="space-y-2 mt-5">
                    {/* Acciones como iconos con tooltip */}
                    <div className="flex items-center justify-center gap-2">
                      {/* Ver detalles (icon-only) */}
                      <button
                        onClick={() => openDetails(group)}
                        className="h-10 w-10 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 flex items-center justify-center transition-colors"
                        title="Ver detalles"
                        aria-label="Ver detalles"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="sr-only">Ver detalles</span>
                      </button>

                      {/* Ver solicitudes (icon-only) */}
                      <Link to={`/groups/${group.id}/requests`}>
                        <button
                          className="h-10 w-10 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 flex items-center justify-center transition-colors"
                          title="Ver solicitudes de tutor"
                          aria-label="Ver solicitudes de tutor"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-5 w-5" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
                            />
                          </svg>
                          <span className="sr-only">Ver solicitudes de tutor</span>
                        </button>
                      </Link>
                    </div>
 
                     <Button
                       variant="secondary"
                       onClick={() => handleLeaveGroup(group.code, group.name)}
                       className="w-full mt-5"
                     >
                       Salir del Grupo
                     </Button>
                   </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Estado vacío */}
          {myGroups.length === 0 && (
            <Card className="p-12 text-center">
              <div className="space-y-4">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-2xl font-semibold text-white">
                  Aún no estás en ningún grupo
                </h3>
                <p className="text-neutral-400 max-w-2xl mx-auto">
                  Únete a grupos públicos o crea tu propio grupo para empezar a estudiar colaborativamente. 
                  Los grupos a los que te unas aparecerán aquí y en tu calendario.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                  <Link to="/study-groups">
                    <Button variant="primary" className="px-6 py-3">
                      Explorar Grupos Públicos
                    </Button>
                  </Link>
                  <Link to="/create-group">
                    <Button variant="secondary" className="px-6 py-3">
                      Crear Nuevo Grupo
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          

          {/* Navegación */}
          <div className="text-center mt-8">
            <Link to="/dashboard">
              <Button variant="secondary">
                ← Volver al Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de detalles */}
      {detailsGroup && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={closeDetails} />
          <div className="relative w-full max-w-lg rounded-lg bg-neutral-900 border border-neutral-700 p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                {detailsGroup.name}
              </h3>
              <button
                onClick={closeDetails}
                className="text-neutral-400 hover:text-white"
                aria-label="Cerrar"
                title="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-neutral-300">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Materia</span>
                <span className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-200">{detailsGroup.subject}</span>
              </div>

              {detailsGroup.session_type && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Tipo de sesión</span>
                  <span className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-200 capitalize">
                    {detailsGroup.session_type}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-800/50 rounded p-3 border border-neutral-700/50">
                  <div className="text-neutral-400 text-xs mb-1">Código</div>
                  <div className="font-mono text-white">{detailsGroup.code}</div>
                </div>

                {(detailsGroup.is_private !== undefined) && (
                  <div className="bg-neutral-800/50 rounded p-3 border border-neutral-700/50">
                    <div className="text-neutral-400 text-xs mb-1">Privacidad</div>
                    <div className="text-white">{detailsGroup.is_private ? 'Privado' : 'Público'}</div>
                  </div>
                )}
              </div>

              {(detailsGroup.meeting_date || detailsGroup.meeting_day || detailsGroup.meeting_time) && (
                <div className="bg-neutral-800/40 rounded p-3 border border-neutral-700/40">
                  <div className="text-neutral-400 text-xs mb-1">Horario</div>
                  <div className="text-white">
                    {detailsGroup.session_type === 'examen'
                      ? `📅 ${formatDate(detailsGroup.meeting_date)} • 🕒 ${formatTime(detailsGroup.meeting_time)}`
                      : `📅 ${detailsGroup.meeting_day || 'Día por definir'} • 🕒 ${formatTime(detailsGroup.meeting_time)}`
                    }
                  </div>
                </div>
              )}

              {(detailsGroup.current_participants !== undefined && detailsGroup.max_participants !== undefined) && (
                <div className="bg-neutral-800/40 rounded p-3 border border-neutral-700/40">
                  <div className="text-neutral-400 text-xs mb-1">Participantes</div>
                  <div className="text-white">
                    {detailsGroup.current_participants}/{detailsGroup.max_participants}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Tutor</span>
                <span className="text-white">{detailsGroup.tutor_name || detailsGroup.tutorName || 'Por asignar'}</span>
              </div>

              {detailsGroup.description && (
                <div className="bg-neutral-800/40 rounded p-3 border border-neutral-700/40">
                  <div className="text-neutral-400 text-xs mb-1">Descripción</div>
                  <p className="text-neutral-200 whitespace-pre-wrap">{detailsGroup.description}</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeDetails}
                className="px-4 py-2 rounded bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border border-neutral-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};