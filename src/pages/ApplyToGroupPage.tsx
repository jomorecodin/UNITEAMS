import React, { useState, useMemo, useEffect } from 'react';
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
  session_type: 'seguimiento' | 'examen';
  meeting_date: string | null;
  meeting_day: string | null;
  meeting_time: string;
  description: string;
  max_participants: number;
  current_participants: number;
  is_private: boolean;
  tutor_name: string | null;
  created_by: string;
  created_at: string;
}

export const ApplyToGroupPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSessionType, setSelectedSessionType] = useState<'seguimiento' | 'examen' | ''>('');
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());
  const [isTutor, setIsTutor] = useState<boolean>(false);
  const [tutorCheckLoading, setTutorCheckLoading] = useState(true);
  const [confirm, setConfirm] = useState<{ open: boolean; id: number | null; name: string; subject: string }>({
    open: false,
    id: null,
    name: '',
    subject: '',
  });

  // Verificar si el usuario es tutor
  useEffect(() => {
    let alive = true;
    const checkTutor = async () => {
      try {
        const tokenKey = 'sb-zskuikxfcjobpygoueqp-auth-token';
        const tokenData = localStorage.getItem(tokenKey);
        if (!tokenData) {
          if (alive) setIsTutor(false);
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
          setIsTutor(data.isTutor === true);
          if (data.isTutor === true) {
            console.log('🎓 Bienvenido tutor');
          }
        } else {
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

  // Cargar grupos sin tutor desde el backend
  useEffect(() => {
    let alive = true;
    const loadGroups = async () => {
      try {
        setLoading(true);
        setError(null);
        const tokenKey = 'sb-zskuikxfcjobpygoueqp-auth-token';
        const tokenData = localStorage.getItem(tokenKey);
        if (!tokenData) {
          if (alive) {
            setStudyGroups([]);
            setLoading(false);
          }
          return;
        }
        const authData = JSON.parse(tokenData);
        const accessToken = authData.access_token;

        // Si es tutor, usar endpoint filtrado por materias aceptadas
        const endpoint = isTutor 
          ? 'http://localhost:8080/api/study-groups/without-tutor/eligible'
          : 'http://localhost:8080/api/study-groups/without-tutor';
        
        console.log('📚 Cargando grupos desde:', endpoint);
        
        const res = await fetch(endpoint, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!alive) return;

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(txt || `Error ${res.status}`);
        }

        const data: StudyGroup[] = await res.json();
        console.log(`✅ Grupos cargados: ${data.length}${isTutor ? ' (filtrados por tus materias)' : ''}`);
        setStudyGroups(data);

        // Cargar solicitudes previas (esto previene duplicados)
        console.log('🔍 Cargando solicitudes previas del tutor...');
        const reqRes = await fetch('http://localhost:8080/api/group-requests/tutor/my-requests', {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (reqRes.ok) {
          const myRequests: { idGroup: number }[] = await reqRes.json();
          console.log('✅ Solicitudes previas encontradas:', myRequests.length);
          console.log('📋 IDs de grupos con solicitud:', myRequests.map(r => r.idGroup));
          if (alive) {
            setAppliedIds(new Set(myRequests.map((r) => r.idGroup)));
          }
        } else {
          console.warn('⚠️ No se pudieron cargar las solicitudes previas (status:', reqRes.status, ')');
          // Si el endpoint devuelve error, inicializar vacío
          if (alive) {
            setAppliedIds(new Set());
          }
        }
      } catch (e: any) {
        console.error('❌ Error cargando grupos:', e);
        if (alive) {
          setError(e?.message || 'No se pudieron cargar los grupos');
          setStudyGroups([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    if (user && !tutorCheckLoading) {
      loadGroups();
    }
    return () => {
      alive = false;
    };
  }, [user, isTutor, tutorCheckLoading]);

  // Filtros únicos
  const subjects = useMemo(
    () => Array.from(new Set(studyGroups.map((g) => g.subject))),
    [studyGroups]
  );

  const safeSearch = (text: string | null | undefined, term: string): boolean => {
    if (!text) return false;
    return text.toLowerCase().includes(term.toLowerCase());
  };

  const filteredGroups = useMemo(() => {
    return studyGroups.filter((group) => {
      const matchesSearch =
        safeSearch(group.name, searchTerm) ||
        safeSearch(group.description, searchTerm) ||
        safeSearch(group.subject, searchTerm);
      const matchesSubject = !selectedSubject || group.subject === selectedSubject;
      const matchesSessionType = !selectedSessionType || group.session_type === selectedSessionType;
      return matchesSearch && matchesSubject && matchesSessionType;
    });
  }, [studyGroups, searchTerm, selectedSubject, selectedSessionType]);

  const openConfirm = (g: StudyGroup) =>
    setConfirm({ open: true, id: g.id, name: g.name, subject: g.subject });
  const closeConfirm = () => setConfirm({ open: false, id: null, name: '', subject: '' });

  // Crear solicitud en group_requests (idGroup + tutor del JWT)
  const handleApplyToGroup = async (groupId: number) => {
    try {
      // Validación: verificar si ya se postuló
      if (appliedIds.has(groupId)) {
        alert('⚠️ Ya te has postulado a este grupo anteriormente.');
        console.warn('🚫 Intento de postulación duplicada bloqueado para grupo:', groupId);
        return;
      }

      if (!isTutor) {
        alert('Debes ser tutor para postularte a un grupo.');
        return;
      }
      setApplyingId(groupId);
      const tokenKey = 'sb-zskuikxfcjobpygoueqp-auth-token';
      const tokenData = localStorage.getItem(tokenKey);
      if (!tokenData) {
        alert('Debes iniciar sesión para postularte');
        setApplyingId(null);
        return;
      }
      const accessToken = JSON.parse(tokenData).access_token;

      console.log('📤 Enviando POST /api/group-requests');
      console.log('   Body:', { idGroup: groupId });
      console.log('   ID numérico enviado:', groupId, typeof groupId);

      const response = await fetch(`http://localhost:8080/api/group-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({ idGroup: groupId }),
      });

      const rawText = await response.text().catch(() => '');
      console.log('📥 Response:', response.status, rawText);
      let result: any = {};
      try { result = rawText ? JSON.parse(rawText) : {}; } catch { /* texto plano */ }
      console.log('📦 Parsed result:', result);

      if (response.ok && (result.success || result.id)) {
        alert(`✅ ${result.message || 'Solicitud enviada con éxito'}`);
        setAppliedIds((prev) => new Set(prev).add(groupId));
        console.log('✅ Grupo agregado a appliedIds:', groupId);
      } else if (response.status === 409 || result.error?.toLowerCase().includes('ya has enviado') || result.error?.toLowerCase().includes('duplicate') || result.error?.toLowerCase().includes('ya existe')) {
        // Manejar error de duplicado del backend
        alert(`⚠️ ${result.error || 'Ya existe una solicitud activa para este grupo.'}`);
        setAppliedIds((prev) => new Set(prev).add(groupId)); // Actualizar el estado local
        console.log('⚠️ Duplicado detectado por backend, grupo agregado a appliedIds:', groupId);
      } else {
        alert(`❌ ${result.error || 'Error al postularse'}`);
      }
    } catch (error: any) {
      console.error('Error al postularse:', error);
      alert('❌ Error al postularse: ' + error.message);
    } finally {
      setApplyingId(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSubject('');
    setSelectedSessionType('');
  };

  const getSessionTypeDisplay = (type: 'seguimiento' | 'examen') =>
    type === 'examen' ? 'Preparación Examen' : 'Seguimiento';

  const getSessionTypeColor = (type: 'seguimiento' | 'examen') =>
    type === 'examen'
      ? 'bg-red-500/20 text-red-400 border-red-500/30'
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => timeString.split(':').slice(0, 2).join(':');

  const renderScheduleInfo = (group: StudyGroup) => {
    if (group.session_type === 'examen') {
      return (
        <>
          <div className="flex items-center text-neutral-300 text-sm">
            <span className="w-6">📅</span>
            <span className="capitalize">
              {group.meeting_date ? formatDate(group.meeting_date) : 'Fecha por definir'}
            </span>
          </div>
          <div className="flex items-center text-neutral-300 text-sm">
            <span className="w-6">🕒</span>
            <span>{formatTime(group.meeting_time)} hrs</span>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className="flex items-center text-neutral-300 text-sm">
            <span className="w-6">📅</span>
            <span className="capitalize">
              {group.meeting_day ? `Todos los ${group.meeting_day}` : 'Día por definir'}
            </span>
          </div>
          <div className="flex items-center text-neutral-300 text-sm">
            <span className="w-6">🕒</span>
            <span>{formatTime(group.meeting_time)} hrs</span>
          </div>
        </>
      );
    }
  };

  const hasActiveFilters = searchTerm || selectedSubject || selectedSessionType;

  if (loading || tutorCheckLoading) {
    return (
      <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8 flex items-center justify-center" style={{ paddingTop: '5rem' }}>
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4" />
          <p className="text-white">Cargando grupos disponibles...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen bg-black px-4 sm:px-6 lg:px-8 flex items-center justify-center"
        style={{ paddingTop: '5rem' }}
      >
        <Card className="p-8 text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">Error al cargar grupos</h3>
          <p className="text-neutral-400 mb-4">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-black px-4 sm:px-6 lg:px-8"
      style={{ paddingTop: '5rem', paddingBottom: '3rem' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Postularse como Tutor
          </h1>
          <p className="text-neutral-400 text-lg">
            {isTutor 
              ? 'Grupos sin tutor en tus materias aprobadas'
              : 'Encuentra grupos que necesitan un tutor y postúlate'
            }
          </p>
          {isTutor && studyGroups.length === 0 && !loading && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">
                No hay grupos disponibles para las materias que tienes aprobadas como tutor.
              </p>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <label htmlFor="search" className="block text-sm font-medium text-white mb-2">
                Buscar Grupos
              </label>
              <input
                type="text"
                id="search"
                placeholder="Buscar por nombre, descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-white mb-2">
                Materia
              </label>
              <select
                id="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las Materias</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sessionType" className="block text-sm font-medium text-white mb-2">
                Tipo de Sesión
              </label>
              <select
                id="sessionType"
                value={selectedSessionType}
                onChange={(e) => setSelectedSessionType(e.target.value as 'seguimiento' | 'examen' | '')}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los Tipos</option>
                <option value="examen">Preparación Examen</option>
                <option value="seguimiento">Seguimiento</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Results Count */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-neutral-400">
            Se encontraron {filteredGroups.length} de {studyGroups.length} grupo
            {studyGroups.length !== 1 ? 's' : ''} sin tutor
          </p>
          <Button
            variant="secondary"
            onClick={clearFilters}
            className="text-sm px-3 py-1"
            disabled={!hasActiveFilters}
          >
            ✕ Limpiar Filtros
          </Button>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <Card
              key={group.id}
              className="p-6 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 border-2 border-orange-500/20"
            >
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded-full border border-orange-500/30">
                      🎓 Sin Tutor
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full border text-xs ${getSessionTypeColor(
                        group.session_type
                      )}`}
                    >
                      {getSessionTypeDisplay(group.session_type)}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">{group.name}</h3>
                  <div className="flex items-center text-sm mb-2">
                    <span className="bg-neutral-800 px-3 py-1 rounded-full text-neutral-300">
                      {group.subject}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {renderScheduleInfo(group)}
                  <div className="flex items-center justify-between text-neutral-300 text-sm">
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
                          width: `${(group.current_participants / group.max_participants) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-neutral-400 text-sm line-clamp-3">{group.description}</p>

                <Button
                  variant="primary"
                  onClick={() => openConfirm(group)}
                  disabled={applyingId === group.id || appliedIds.has(group.id)}
                  className="w-full mt-2"
                >
                  {appliedIds.has(group.id)
                    ? '✓ Ya postulado'
                    : applyingId === group.id
                    ? 'Postulando…'
                    : 'Postularse como Tutor'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredGroups.length === 0 && studyGroups.length > 0 && (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold text-white">No se encontraron grupos</h3>
              <p className="text-neutral-400">
                {hasActiveFilters
                  ? 'No hay grupos que coincidan con tus filtros.'
                  : 'Actualmente no hay grupos sin tutor.'}
              </p>
              <Button variant="secondary" onClick={clearFilters} disabled={!hasActiveFilters}>
                Limpiar Filtros
              </Button>
            </div>
          </Card>
        )}

        {studyGroups.length === 0 && (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-2xl font-semibold text-white">No hay grupos sin tutor</h3>
              <p className="text-neutral-400">Todos los grupos ya tienen un tutor asignado.</p>
            </div>
          </Card>
        )}

        <div className="text-center mt-12">
          <Link to="/dashboard">
            <Button variant="secondary">Volver al Dashboard</Button>
          </Link>
        </div>
      </div>

      {/* Modal de confirmación */}
      {confirm.open &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/60" onClick={closeConfirm} />
            <div className="relative w-full max-w-md rounded-lg bg-neutral-900 border border-neutral-700 p-6 shadow-xl text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Confirmar postulación</h3>
              <p className="text-sm text-neutral-300 mb-4">
                ¿Deseas postularte como tutor para este grupo?
              </p>
              <ul className="text-sm text-neutral-400 mb-6 space-y-1">
                <li>
                  Grupo: <span className="text-neutral-200 font-medium">{confirm.name}</span>
                </li>
                <li>
                  Materia: <span className="text-neutral-200 font-medium">{confirm.subject}</span>
                </li>
              </ul>
              {appliedIds.has(confirm.id!) && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm">⚠️ Ya te has postulado a este grupo</p>
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={closeConfirm}>Cancelar</Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    const id = confirm.id!;
                    closeConfirm();
                    handleApplyToGroup(id);
                  }}
                  disabled={appliedIds.has(confirm.id!)}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};