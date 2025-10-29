import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';

interface StudySession {
  id: number;
  name: string;
  subject: string;
  session_type: 'seguimiento' | 'examen';
  meeting_date: string | null;
  meeting_day: string | null;
  meeting_time: string;
  duration: number;
  is_private: boolean;
  tutor_name: string;
}

export const Dashboard: React.FC = () => {
  const { user, profile, signOut, loading, initialLoading } = useAuth();
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());

  // Log del perfil al cargar/cambiar
  useEffect(() => {
    console.log('Dashboard profile:', profile);
  }, [profile]);

  const handleSignOut = async () => {
    await signOut();
  };

  // ✅ Cargar sesiones de estudio del usuario
  useEffect(() => {
    const fetchUserSessions = async () => {
      try {
        setCalendarLoading(true);
        const tokenKey = 'sb-zskuikxfcjobpygoueqp-auth-token';
        const tokenData = localStorage.getItem(tokenKey);
        
        if (!tokenData) {
          setCalendarLoading(false);
          return;
        }

        const authData = JSON.parse(tokenData);
        const accessToken = authData.access_token;

        console.log('📅 Cargando grupos del usuario...');

        const response = await fetch('http://localhost:8080/api/study-groups/my-groups', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const userGroups = await response.json();
          console.log('✅ Grupos cargados:', userGroups);
          
          // Transformar los datos al formato que espera el calendario
          const sessions: StudySession[] = userGroups.map((group: any) => ({
            id: group.id,
            name: group.name,
            subject: group.subject,
            session_type: group.session_type,
            meeting_date: group.meeting_date,
            meeting_day: group.meeting_day,
            meeting_time: group.meeting_time,
            duration: 120, // Valor por defecto de 2 horas
            is_private: group.is_private,
            tutor_name: group.tutor_name || 'Por asignar'
          }));
          
          setStudySessions(sessions);
        } else {
          console.error('❌ Error cargando grupos');
          // Mantener array vacío si hay error
          setStudySessions([]);
        }
      } catch (error) {
        console.error('❌ Error cargando sesiones:', error);
        setStudySessions([]);
      } finally {
        setCalendarLoading(false);
      }
    };

    if (user) {
      fetchUserSessions();
    }
  }, [user]);

  // ✅ Generar calendario de 2 semanas
  const generateTwoWeekCalendar = () => {
    const days = [];
    const startDate = new Date(currentWeekStart);
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Empezar en lunes
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  // ✅ Obtener sesiones para un día específico
  const getSessionsForDay = (date: Date) => {
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
    const dateString = date.toISOString().split('T')[0];
    
    return studySessions.filter(session => {
      if (session.session_type === 'seguimiento') {
        // Para seguimiento: comparar día de la semana
        return session.meeting_day?.toLowerCase() === dayName.toLowerCase();
      } else {
        // Para examen: comparar fecha específica
        return session.meeting_date === dateString;
      }
    });
  };

  // ✅ Formatear hora para display
  const formatTimeDisplay = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  // ✅ Navegación entre semanas
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(new Date());
  };

  // ✅ Obtener nombre del mes y año
  const getMonthYearDisplay = () => {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() - start.getDay() + 1); // Empezar en lunes
    const end = new Date(start);
    end.setDate(end.getDate() + 13);
    
    const startMonth = start.toLocaleDateString('es-ES', { month: 'long' });
    const endMonth = end.toLocaleDateString('es-ES', { month: 'long' });
    const year = start.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth.charAt(0).toUpperCase() + startMonth.slice(1)} ${year}`;
    } else {
      return `${startMonth.charAt(0).toUpperCase() + startMonth.slice(1)} - ${endMonth.charAt(0).toUpperCase() + endMonth.slice(1)} ${year}`;
    }
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

  const calendarDays = generateTwoWeekCalendar();

  // Nombre para saludo (sin fallback al correo)
  const getFirstName = (p?: any): string => {
    const pick = (s?: string) => (typeof s === 'string' ? s.trim() : '');
    const fromDisplay = pick(p?.display_name)?.split(/\s+/)[0] || '';
    const fromFull = pick(p?.full_name)?.split(/\s+/)[0] || '';
    return pick(p?.first_name) || fromDisplay || fromFull || 'Usuario';
  };
  const firstName = getFirstName(profile);

  return (
    <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header de bienvenida */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Bienvenido a tu Panel
          </h1>
          <p className="text-neutral-400 text-lg">
            Hola, {firstName}! Este es tu espacio personal de trabajo.
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
        {/* ✅ NUEVO: Calendario de 2 semanas */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Mi Calendario de Estudio
              </h2>
              <p className="text-neutral-400">
                {getMonthYearDisplay()} - Próximas 2 semanas
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" onClick={goToPreviousWeek} className="px-3 py-2 text-sm">
                ‹ Anterior
              </Button>
              <Button variant="secondary" onClick={goToToday} className="px-3 py-2 text-sm">
                Hoy
              </Button>
              <Button variant="secondary" onClick={goToNextWeek} className="px-3 py-2 text-sm">
                Siguiente ›
              </Button>
            </div>
          </div>

          {calendarLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p className="text-neutral-400">Cargando calendario...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 min-w-[800px] gap-2">
                {/* Encabezados de días */}
                {calendarDays.slice(0, 7).map((date, index) => (
                  <div key={index} className="text-center p-2">
                    <div className="text-white font-semibold text-sm">
                      {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                    </div>
                    <div className={`text-sm ${
                      date.toDateString() === new Date().toDateString() 
                        ? 'bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                        : 'text-neutral-400'
                    }`}>
                      {date.getDate()}
                    </div>
                  </div>
                ))}

                {/* Sesiones por día - Semana 1 */}
                {calendarDays.slice(0, 7).map((date, dayIndex) => {
                  const daySessions = getSessionsForDay(date);
                  return (
                    <div key={dayIndex} className="min-h-[200px] border border-neutral-700 rounded-lg p-2 bg-neutral-900/50">
                      {daySessions.length === 0 ? (
                        <div className="text-center text-neutral-500 text-sm h-full flex items-center justify-center">
                          Sin sesiones
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {daySessions.map((session, sessionIndex) => (
                            <div
                              key={sessionIndex}
                              className={`p-2 rounded text-xs ${
                                session.session_type === 'examen' 
                                  ? 'bg-red-500/20 border border-red-500/30' 
                                  : 'bg-blue-500/20 border border-blue-500/30'
                              }`}
                            >
                              <div className="font-semibold text-white truncate">
                                {session.name}
                              </div>
                              <div className="text-neutral-300">
                                {formatTimeDisplay(session.meeting_time)}
                              </div>
                              <div className="text-neutral-400 truncate">
                                {session.subject}
                              </div>
                              {session.session_type === 'examen' && (
                                <div className="text-red-400 text-xs mt-1">
                                  📝 Examen
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Encabezados de días - Semana 2 */}
                {calendarDays.slice(7, 14).map((date, index) => (
                  <div key={index + 7} className="text-center p-2">
                    <div className="text-white font-semibold text-sm">
                      {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                    </div>
                    <div className={`text-sm ${
                      date.toDateString() === new Date().toDateString() 
                        ? 'bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                        : 'text-neutral-400'
                    }`}>
                      {date.getDate()}
                    </div>
                  </div>
                ))}

                {/* Sesiones por día - Semana 2 */}
                {calendarDays.slice(7, 14).map((date, dayIndex) => {
                  const daySessions = getSessionsForDay(date);
                  return (
                    <div key={dayIndex + 7} className="min-h-[200px] border border-neutral-700 rounded-lg p-2 bg-neutral-900/50">
                      {daySessions.length === 0 ? (
                        <div className="text-center text-neutral-500 text-sm h-full flex items-center justify-center">
                          Sin sesiones
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {daySessions.map((session, sessionIndex) => (
                            <div
                              key={sessionIndex}
                              className={`p-2 rounded text-xs ${
                                session.session_type === 'examen' 
                                  ? 'bg-red-500/20 border border-red-500/30' 
                                  : 'bg-blue-500/20 border border-blue-500/30'
                              }`}
                            >
                              <div className="font-semibold text-white truncate">
                                {session.name}
                              </div>
                              <div className="text-neutral-300">
                                {formatTimeDisplay(session.meeting_time)}
                              </div>
                              <div className="text-neutral-400 truncate">
                                {session.subject}
                              </div>
                              {session.session_type === 'examen' && (
                                <div className="text-red-400 text-xs mt-1">
                                  📝 Examen
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Leyenda */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500/20 border border-blue-500/30 rounded"></div>
              <span>Seguimiento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500/20 border border-red-500/30 rounded"></div>
              <span>Preparación Examen</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Hoy</span>
            </div>
          </div>
        </Card>

        {/* Cards de funcionalidades actualizadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Mis Grupos</h3>
              <p className="text-neutral-400 text-sm mb-4">
                Gestiona los grupos a los que perteneces
              </p>
              <Link to="/my-groups">
                <Button variant="primary" className="w-full">
                  Ver Mis Grupos
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Explorar Grupos
              </h3>
              <p className="text-neutral-400 text-sm mb-4">
                Encuentra y únete a grupos públicos de estudio
              </p>
              <Link to="/study-groups">
                <Button variant="primary" className="w-full">
                  Explorar Grupos
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-xl">🛠️</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Crear Grupo
              </h3>
              <p className="text-neutral-400 text-sm mb-4">
                Crea tu propio grupo de estudio
              </p>
              <Link to="/create-group">
                <Button variant="primary" className="w-full">
                  Crear Grupo
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Cards de acciones principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          

          <Card className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">🎓</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Nueva solicitud de tutoría
              </h3>
              <p className="text-neutral-400 text-sm mb-4">
                Envía una solicitud para convertirte en tutor
              </p>
              <Link to="/requests/new">
                <Button variant="primary" className="w-full">
                  Crear solicitud
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-xl">📚</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Mis Materias
              </h3>
              <p className="text-neutral-400 text-sm mb-4">
                Gestiona tu registro de materias
              </p>
              <Link to="/subjects-register">
                <Button variant="primary" className="w-full">
                  Ver Materias
                </Button>
              </Link>
            </div>
          </Card>

          {/* Card de aceptación de tutor (solo para administradores) */}
          <Card className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-xl">✅</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Aceptación de tutor
              </h3>
              <p className="text-neutral-400 text-sm mb-4">
                Gestiona las solicitudes de tutoría pendientes.
              </p>
              <div className="mt-4">
                <Link to="/accept-tutor">
                  <Button variant="primary" className="w-full">Ir</Button>
                </Link>
              </div>
            </div>
          </Card>

          
        </div>

        

        {/* Botón de cerrar sesión */}
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