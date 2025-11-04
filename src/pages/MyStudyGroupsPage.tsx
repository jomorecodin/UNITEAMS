import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface StudyGroup {
  id: number;
  code: string;
  name: string;
  subject: string;
  session_type: 'seguimiento' | 'examen';
  meeting_date: string | null;
  meeting_day: string | null;
  meeting_time: string;
  description: string;
  max_participants: number;
  current_participants: number;
  is_private: boolean;
  tutor_name: string;
  created_by: string;
}

export const MyStudyGroupsPage: React.FC = () => {
  const { user } = useAuth();
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const formatTime = (timeString: string) => {
    return timeString.split(':').slice(0, 2).join(':');
  };

  const getSessionTypeDisplay = (type: 'seguimiento' | 'examen') => {
    return type === 'examen' ? 'Preparación Examen' : 'Seguimiento';
  };

  const getSessionTypeColor = (type: 'seguimiento' | 'examen') => {
    return type === 'examen' 
      ? 'bg-red-500/20 text-red-400 border-red-500/30' 
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
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
    <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {myGroups.map(group => (
            <Card key={group.id} className="p-6 hover:shadow-lg transition-all duration-300 border-2 border-green-500/20">
              <div className="space-y-4">
                {/* Header del grupo */}
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full border text-xs ${getSessionTypeColor(group.session_type)}`}>
                    {getSessionTypeDisplay(group.session_type)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    group.is_private 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}>
                    {group.is_private ? '🔒 Privado' : '🌍 Público'}
                  </span>
                </div>

                {/* Información del grupo */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                    {group.name}
                  </h3>
                  <div className="flex items-center text-sm mb-2">
                    <span className="bg-neutral-800 px-3 py-1 rounded-full text-neutral-300">
                      {group.subject}
                    </span>
                  </div>
                </div>

                {/* Horario */}
                <div className="space-y-2 text-sm text-neutral-300">
                  <div className="flex items-center">
                    <span className="w-6">📅</span>
                    <span className="capitalize">
                      {group.session_type === 'examen' 
                        ? (group.meeting_date ? new Date(group.meeting_date).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Fecha por definir')
                        : `Todos los ${group.meeting_day || 'días'}`
                      }
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-6">🕒</span>
                    <span>{formatTime(group.meeting_time)} hrs</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-6">👤</span>
                    <span>Tutor: {group.tutor_name || 'Por asignar'}</span>
                  </div>
                </div>

                {/* Participantes */}
                <div className="flex items-center justify-between text-sm text-neutral-300">
                  <div className="flex items-center">
                    <span className="w-6">👥</span>
                    <span>
                      {group.current_participants}/{group.max_participants} participantes
                    </span>
                  </div>
                  <div className="w-20 bg-neutral-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        group.current_participants / group.max_participants >= 0.8 
                          ? 'bg-red-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${(group.current_participants / group.max_participants) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Código del grupo */}
                <div className="bg-neutral-800/50 rounded-lg p-3">
                  <div className="text-xs text-neutral-400 mb-1">Código del grupo:</div>
                  <div className="text-white font-mono text-sm bg-neutral-900 px-3 py-2 rounded border border-neutral-700">
                    {group.code}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    Comparte este código para invitar a otros
                  </div>
                </div>

                {/* Descripción */}
                <p className="text-neutral-400 text-sm line-clamp-3">
                  {group.description}
                </p>
                
                {/* Botones de acción */}
                <div className="space-y-2">
                  <Link 
                    to={`/groups/${group.id}/requests`}
                    className="block"
                  >
                    <button
                      className="w-full px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm border border-neutral-700"
                      title="Ver solicitudes de tutor"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4" 
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
                      Ver solicitudes de tutor
                    </button>
                  </Link>
                  
                  <Button
                    variant="secondary"
                    onClick={() => handleLeaveGroup(group.code, group.name)}
                    className="w-full"
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
  );
};