import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Link, useNavigate } from 'react-router-dom'; // <-- añade useNavigate

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
  const navigate = useNavigate(); // <-- hook de navegación
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());

  // NUEVO: estado para saber si el usuario es tutor
  const [isTutor, setIsTutor] = useState<boolean>(false);
  const [tutorCheckLoading, setTutorCheckLoading] = useState(true);

  // Estado local para el botón de cerrar sesión
  const [signingOut, setSigningOut] = useState(false);

  // Log del perfil al cargar/cambiar
  useEffect(() => {
    console.log('Dashboard profile:', profile);
  }, [profile]);

  // NUEVO: verificar si el usuario es tutor al montar el Dashboard
  useEffect(() => {
    let alive = true;
    const checkTutor = async () => {
      setTutorCheckLoading(true);
      try {
        const tokenKey = 'sb-zskuikxfcjobpygoueqp-auth-token';
        const tokenData = localStorage.getItem(tokenKey);
        if (!tokenData) {
          if (alive) {
            setIsTutor(false);
            setTutorCheckLoading(false);
          }
          return;
        }
        const authData = JSON.parse(tokenData);
        const accessToken = authData.access_token;

        const res = await fetch('http://localhost:8080/api/auth/login', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!alive) return;

        if (res.ok) {
          const data = await res.json();
          console.log('✅ Tutor check:', data);
          setIsTutor(data.isTutor === true);
          if (data.isTutor === true) {
            console.log('🎓 Bienvenido tutor');
          }
        } else {
          console.error('❌ Tutor check error:', res.status);
          setIsTutor(false);
        }
      } catch (e) {
        console.error('❌ Check tutor failed:', e);
        if (alive) setIsTutor(false);
      } finally {
        if (alive) setTutorCheckLoading(false);
      }
    };
    if (user) {
      checkTutor();
    } else {
      setTutorCheckLoading(false);
    }
    return () => {
      alive = false;
    };
  }, [user]);

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

  // ✅ Generar calendario de 1 semana
  const generateWeekCalendar = () => {
    const days = [];
    const startDate = new Date(currentWeekStart);
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Empezar en lunes
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  // ✅ Obtener próximas sesiones ordenadas
  const getUpcomingSessions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return studySessions
      .filter(session => {
        if (session.session_type === 'examen' && session.meeting_date) {
          return new Date(session.meeting_date) >= today;
        } else if (session.session_type === 'seguimiento') {
          return true; // Las sesiones de seguimiento son recurrentes
        }
        return false;
      })
      .slice(0, 5); // Solo las próximas 5
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

  // ✅ Formatear fecha corta
  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
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

  // Limpia claves de Supabase/Auth del storage
  const clearAuthStorage = () => {
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith('sb-') || k.includes('auth') || k === 'accessToken') {
          localStorage.removeItem(k);
        }
      }
      // Por si acaso:
      sessionStorage.clear();
    } catch (e) {
      console.warn('Auth storage clear warn:', e);
    }
  };

  const SIGN_OUT_TIMEOUT_MS = 1200; // antes 5000
  const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const handleSignOut = () => {
    // logout instantáneo + navegación inmediata
    signOut();
    navigate('/login', { replace: true });
  };

  // ✅ Obtener nombre del mes y año
  const getMonthYearDisplay = () => {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() - start.getDay() + 1); // Empezar en lunes
    
    const month = start.toLocaleDateString('es-ES', { month: 'long' });
    const year = start.getFullYear();
    
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
  };

  // ✅ Obtener rango de fechas de la semana
  const getWeekRange = () => {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() - start.getDay() + 1); // Empezar en lunes
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = start.toLocaleDateString('es-ES', { month: 'short' });
    const endMonth = end.toLocaleDateString('es-ES', { month: 'short' });
    
    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} ${startMonth}`;
    } else {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
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

  const calendarDays = generateWeekCalendar();
  const upcomingSessions = getUpcomingSessions();

  // Obtener nombre completo para el saludo
  const getUserDisplayName = (): string => {
    if (profile?.first_name || profile?.last_name) {
      const firstName = profile.first_name?.trim() || '';
      const lastName = profile.last_name?.trim() || '';
      
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      }
      if (firstName) {
        return firstName;
      }
      if (lastName) {
        return lastName;
      }
    }
    return 'Usuario';
  };

  const displayName = getUserDisplayName();

  return (
    <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header de bienvenida */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 pt-8 pb-6">
          Bienvenido {displayName}
        </h1>
        {/* Calendario rediseñado */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Calendario semanal compacto */}
          <Card className="lg:col-span-2 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-1">
                  Calendario Semanal
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-400">
                  <span>{getMonthYearDisplay()}</span>
                  <span className="text-neutral-600">•</span>
                  <span>{getWeekRange()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousWeek}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all duration-200 border border-neutral-700 hover:border-neutral-600 cursor-pointer"
                  aria-label="Semana anterior"
                  title="Semana anterior"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={goToToday}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-red-500/20 text-neutral-300 hover:text-red-400 transition-all duration-200 border border-neutral-700 hover:border-red-500/30 text-sm font-medium cursor-pointer"
                  aria-label="Ir a hoy"
                  title="Ir a hoy"
                >
                  Hoy
                </button>
                <button
                  onClick={goToNextWeek}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all duration-200 border border-neutral-700 hover:border-neutral-600 cursor-pointer"
                  aria-label="Semana siguiente"
                  title="Semana siguiente"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {calendarLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto mb-2"></div>
                <p className="text-sm text-neutral-400">Cargando...</p>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {/* Encabezados de días */}
                {calendarDays.map((date) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  const daySessions = getSessionsForDay(date);
                  return (
                    <div key={date.toDateString()} className="flex flex-col">
                      {/* Header del día */}
                      <div className={`text-center p-2 rounded-t-lg ${
                        isToday ? 'bg-red-500/20' : 'bg-neutral-800/50'
                      }`}>
                        <div className="text-xs text-neutral-400 uppercase mb-1">
                          {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                        </div>
                        <div className={`text-lg font-bold ${
                          isToday ? 'text-red-400' : 'text-white'
                        }`}>
                          {date.getDate()}
                        </div>
                      </div>
                      {/* Sesiones del día */}
                      <div className={`rounded-b-lg p-2 min-h-[100px] ${
                        isToday ? 'bg-neutral-900/50 border border-red-500/30' : 'bg-neutral-900/30'
                      }`}>
                        {daySessions.length === 0 ? (
                          <div className="text-xs text-neutral-600 text-center pt-2">
                            —
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {daySessions.slice(0, 2).map((session, idx) => (
                              <div
                                key={idx}
                                className={`text-xs p-1.5 rounded ${
                                  session.session_type === 'examen'
                                    ? 'bg-red-500/20 border border-red-500/30'
                                    : 'bg-blue-500/20 border border-blue-500/30'
                                }`}
                              >
                                <div className="font-semibold text-white truncate mb-0.5">
                                  {session.name}
                                </div>
                                <div className="text-neutral-300">
                                  {formatTimeDisplay(session.meeting_time)}
                                </div>
                              </div>
                            ))}
                            {daySessions.length > 2 && (
                              <div className="text-xs text-neutral-500 text-center">
                                +{daySessions.length - 2}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Próximas sesiones */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Próximas Sesiones
            </h2>
            {calendarLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto mb-2"></div>
                <p className="text-sm text-neutral-400">Cargando...</p>
              </div>
            ) : upcomingSessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-neutral-500">
                  No hay sesiones próximas
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      session.session_type === 'examen'
                        ? 'bg-red-500/10 border-red-500/20'
                        : 'bg-blue-500/10 border-blue-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm truncate">
                          {session.name}
                        </div>
                        <div className="text-xs text-neutral-400 mt-0.5">
                          {session.subject}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-neutral-300">
                        {session.session_type === 'examen' && session.meeting_date
                          ? formatShortDate(new Date(session.meeting_date))
                          : session.meeting_day}
                      </div>
                      <div className="text-xs font-medium text-neutral-300">
                        {formatTimeDisplay(session.meeting_time)}
                      </div>
                    </div>
                    {session.session_type === 'examen' && (
                      <div className="mt-2">
                        <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
                          Examen
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

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

          {/* NUEVO: Card visible solo si es tutor */}
          {isTutor && !tutorCheckLoading && (
            <Card className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-xl">👥</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Postularse a un grupo
                </h3>
                <p className="text-neutral-400 text-sm mb-4">
                  Únete a grupos de estudio disponibles como tutor
                </p>
                <Link to="/apply-to-group">
                  <Button variant="primary" className="w-full">
                    Ver grupos
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>

        

        {/* Botón de cerrar sesión */}
        <div className="text-center mt-8">
          <Button
            variant="secondary"
            onClick={handleSignOut}
            loading={signingOut}            // <-- usa el estado local
            className="px-6 py-3"
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
};