import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Link, useNavigate } from 'react-router-dom'; // <-- añade useNavigate
import { supabase } from '../lib/supabaseClient';

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

// Sessions Manager Component
type SessionsManagerProps = { initialSessions?: any[] };
const SessionsManager: React.FC<SessionsManagerProps> = ({ initialSessions = [] }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(initialSessions.length === 0);
  const [sessions, setSessions] = useState<any[]>(initialSessions);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: '',
    subject: '',
    session_type: 'seguimiento' as 'seguimiento' | 'examen',
    meeting_day: 'lunes',
    meeting_date: '',
    meeting_time: '08:00',
    duration: 60,
    is_private: false,
  });

  const getToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch { return null; }
  };

  const fetchSessions = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('http://localhost:8080/api/study-groups/my-groups', { headers, signal: controller.signal });
      if (!res.ok) throw new Error('fetch failed');
      const userGroups = await res.json();
      const mapped = Array.isArray(userGroups) ? userGroups.map((g: any) => ({
        id: g.id,
        name: g.name,
        subject: g.subject,
        session_type: g.session_type,
        meeting_date: g.meeting_date,
        meeting_day: g.meeting_day,
        meeting_time: g.meeting_time,
        duration: g.duration ?? 120,
        is_private: !!g.is_private,
        coordinator_id: g.coordinator_id,
        is_coordinator: g.coordinator_id && user?.id ? g.coordinator_id === user.id : false,
        joined: true,
      })) : [];
      setSessions(mapped);
    } catch (e) {
      console.warn('Sessions fetch failed, using existing list', e);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [user]);

  // Seed with initial sessions mapped, then refresh in background
  useEffect(() => {
    if (!user) return;
    if (initialSessions && initialSessions.length > 0) {
      const mapped = initialSessions.map((g: any) => ({
        id: g.id,
        name: g.name,
        subject: g.subject,
        session_type: g.session_type,
        meeting_date: g.meeting_date,
        meeting_day: g.meeting_day,
        meeting_time: g.meeting_time,
        duration: g.duration ?? 120,
        is_private: !!g.is_private,
        coordinator_id: g.coordinator_id,
        is_coordinator: g.coordinator_id && user?.id ? g.coordinator_id === user.id : false,
        joined: true,
      }));
      setSessions(mapped);
      setLoading(false);
      // refresh quietly
      fetchSessions();
    } else {
      setLoading(true);
      fetchSessions();
    }
  }, [user, initialSessions, fetchSessions]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', subject: '', session_type: 'seguimiento', meeting_day: 'lunes', meeting_date: '', meeting_time: '08:00', duration: 60, is_private: false });
    setModalOpen(true);
  };
  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      name: s.name || '',
      subject: s.subject || '',
      session_type: s.session_type || 'seguimiento',
      meeting_day: s.meeting_day || 'lunes',
      meeting_date: s.meeting_date || '',
      meeting_time: s.meeting_time?.slice(0,5) || '08:00',
      duration: s.duration || 60,
      is_private: !!s.is_private,
    });
    setModalOpen(true);
  };

  const saveSession = async () => {
    try {
      const token = await getToken();
      const headers: Record<string, string> = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const payload = { ...form };
      const url = editing ? `http://localhost:8080/api/study-sessions/${editing.id}` : 'http://localhost:8080/api/study-sessions';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('save failed');
      setModalOpen(false);
      fetchSessions();
    } catch (e) {
      console.error('Save session failed', e);
    }
  };

  const deleteSession = async (id: number) => {
    if (!confirm('¿Eliminar sesión?')) return;
    try {
      const token = await getToken();
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`http://localhost:8080/api/study-sessions/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('delete failed');
      fetchSessions();
    } catch (e) {
      console.error('Delete session failed', e);
    }
  };

  const joinSession = async (id: number) => {
    try {
      const token = await getToken();
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`http://localhost:8080/api/study-sessions/${id}/join`, { method: 'POST', headers });
      if (!res.ok) throw new Error('join failed');
      fetchSessions();
    } catch (e) {
      console.error('Join session failed', e);
    }
  };

  const leaveSession = async (id: number) => {
    try {
      const token = await getToken();
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`http://localhost:8080/api/study-sessions/${id}/leave`, { method: 'POST', headers });
      if (!res.ok) throw new Error('leave failed');
      fetchSessions();
    } catch (e) {
      console.error('Leave session failed', e);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-xl sm:text-2xl font-semibold text-white">Mis sesiones</h3>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/study-groups')} className="px-4 py-2 cursor-pointer">Explorar sesiones</Button>
          <Button variant="primary" onClick={() => navigate('/create-group')} className="px-4 py-2 cursor-pointer">Crear sesión</Button>
        </div>
      </div>

      {/* Horizontal list */}
      {loading ? (
        <div className="overflow-x-auto">
          <div className="flex gap-4 snap-x snap-mandatory pb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="min-w-[240px] snap-start bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 animate-pulse">
                <div className="h-4 w-32 bg-neutral-800 rounded mb-2" />
                <div className="h-3 w-24 bg-neutral-800 rounded" />
                <div className="mt-3 h-3 w-28 bg-neutral-800 rounded" />
                <div className="mt-2 h-3 w-16 bg-neutral-800 rounded" />
                <div className="mt-4 flex gap-2">
                  <div className="h-5 w-16 bg-neutral-800 rounded" />
                  <div className="h-5 w-12 bg-neutral-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-10 text-center text-neutral-500">Aún no tienes sesiones</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-4 snap-x snap-mandatory pb-2">
            {sessions.slice(0,5).map((s) => {
              const coordinator = (s.coordinator_id && user?.id && s.coordinator_id === user.id) || s.is_coordinator;
              return (
                <Link to={`/groups/${s.id}`} className="min-w-[260px] snap-start rounded-xl p-4 bg-gradient-to-b from-neutral-900/60 to-neutral-900/30 border border-neutral-800 hover:border-neutral-700 hover:from-neutral-900/70 hover:to-neutral-900/40 transition-colors group shadow-sm">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 pr-3">
                      <div className="text-white font-semibold truncate group-hover:text-white/90">{s.name}</div>
                    </div>
                    {coordinator && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 whitespace-nowrap">Coordinador</span>
                    )}
                  </div>
                  {/* Meta */}
                  <div className="mt-3 flex items-center justify-between text-xs text-neutral-300">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      <span>{s.session_type === 'examen' ? (s.meeting_date || '-') : (s.meeting_day || '-')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <span>{(s.meeting_time || '').slice(0,5)}</span>
                    </div>
                  </div>
                  {/* Footer */}
                  <div className="mt-3 space-y-1.5">
                    {s.subject && <div><span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[11px]">{s.subject}</span></div>}
                    <div><span className={`px-2 py-0.5 rounded text-[11px] ${s.session_type === 'examen' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-300'}`}>{s.session_type}</span></div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-300">{s.is_private ? 'Privada' : 'Pública'}</span>
                      <div className="flex gap-2">
                        {s.joined ? (
                          <Button variant="secondary" className="px-2 py-1 text-[11px]" onClick={(e) => { e.preventDefault(); leaveSession(s.id); }}>Salir</Button>
                        ) : (
                          <Button variant="primary" className="px-2 py-1 text-[11px]" onClick={(e) => { e.preventDefault(); joinSession(s.id); }}>Unirme</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal create/edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-lg p-6">
            <h3 className="text-white font-bold text-lg mb-4">{editing ? 'Editar sesión' : 'Nueva sesión'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* form inputs remain the same */}
              <div>
                <label className="block text-sm text-neutral-300 mb-1">Nombre</label>
                <input className="input-custom w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1">Materia</label>
                <input className="input-custom w-full" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1">Tipo</label>
                <select className="input-custom w-full" value={form.session_type} onChange={(e) => setForm({ ...form, session_type: e.target.value as any })}>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="examen">Examen</option>
                </select>
              </div>
              {form.session_type === 'seguimiento' ? (
                <div>
                  <label className="block text-sm text-neutral-300 mb-1">Día</label>
                  <select className="input-custom w-full" value={form.meeting_day} onChange={(e) => setForm({ ...form, meeting_day: e.target.value })}>
                    {['lunes','martes','miércoles','jueves','viernes','sábado','domingo'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-neutral-300 mb-1">Fecha (examen)</label>
                  <input type="date" className="input-custom w-full" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} />
                </div>
              )}
              <div>
                <label className="block text-sm text-neutral-300 mb-1">Hora</label>
                <input type="time" className="input-custom w-full" value={form.meeting_time} onChange={(e) => setForm({ ...form, meeting_time: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1">Duración (min)</label>
                <input type="number" min={15} step={15} className="input-custom w-full" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input id="is_private" type="checkbox" checked={form.is_private} onChange={(e) => setForm({ ...form, is_private: e.target.checked })} />
                <label htmlFor="is_private" className="text-sm text-neutral-300">Privada</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button variant="primary" onClick={saveSession}>{editing ? 'Guardar' : 'Crear'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
      .slice(0, 2); // Solo las próximas 2
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
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-10 sm:mb-12 pt-8 sm:pt-10 pb-6 sm:pb-8">
          Bienvenido {displayName}
        </h1>
        {/* Calendario rediseñado */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 sm:mb-12">
          {/* Calendario semanal compacto */}
          <Card className="lg:col-span-2 p-6 sm:p-8">
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
                              <Link
                                to={`/groups/${session.id}`}
                                key={`${date.toDateString()}-${session.id}-${idx}`}
                                className="block group"
                                state={{
                                  groupHint: {
                                    id: session.id,
                                    name: session.name,
                                    subject: session.subject,
                                    is_private: session.is_private,
                                  },
                                }}
                              >
                                <div
                                  className={`text-xs p-1.5 rounded cursor-pointer transition-colors duration-200 group-hover:ring-1 group-hover:ring-white/10 ${
                                    session.session_type === 'examen'
                                      ? 'bg-red-500/20 border border-red-500/30 group-hover:bg-red-500/25'
                                      : 'bg-blue-500/20 border border-blue-500/30 group-hover:bg-blue-500/25'
                                  }`}
                                >
                                  <div className="font-semibold text-white truncate mb-0.5">
                                    {session.name}
                                  </div>
                                  <div className="text-neutral-300">
                                    {formatTimeDisplay(session.meeting_time)}
                                  </div>
                                </div>
                              </Link>
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
                  <Link
                    to={`/groups/${session.id}`}
                    key={`upcoming-${session.id}-${idx}`}
                    className="block group"
                    state={{
                      groupHint: {
                        id: session.id,
                        name: session.name,
                        subject: session.subject,
                        is_private: session.is_private,
                      },
                    }}
                  >
                    <div
                      className={`p-3 rounded-lg border cursor-pointer transition-colors duration-200 group-hover:ring-1 group-hover:ring-white/10 ${
                        session.session_type === 'examen'
                          ? 'bg-red-500/10 border-red-500/20 group-hover:bg-red-500/15'
                          : 'bg-blue-500/10 border-blue-500/20 group-hover:bg-blue-500/15'
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
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Título de gestión de sesiones */}
        <h2 className="text-xl sm:text-2xl font-bold text-white mt-6 sm:mt-8 mb-6 sm:mb-8">Gestión de Sesiones</h2>

        {/* Sessions Manager (CRUD) */}
        <Card className="p-6 sm:p-8 mb-12">
          <SessionsManager initialSessions={studySessions} />
        </Card>

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

      </div>
    </div>
  );
};