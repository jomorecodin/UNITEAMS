import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Interface actualizada para coincidir con tu base de datos
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
  created_at: string;
  join_link?: string;
}

export const StudyGroupsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSessionType, setSelectedSessionType] = useState<'seguimiento' | 'examen' | ''>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [privateGroupSearch, setPrivateGroupSearch] = useState<StudyGroup | null>(null);

  // ✅ CARGAR GRUPOS PÚBLICOS DESDE EL BACKEND
  useEffect(() => {
    const fetchStudyGroups = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/api/study-groups/public');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const groups = await response.json();
        console.log('📥 Grupos públicos cargados:', groups);
        setStudyGroups(groups);
      } catch (err) {
        console.error('❌ Error cargando grupos públicos:', err);
        setError('No se pudieron cargar los grupos de estudio');
      } finally {
        setLoading(false);
      }
    };

    fetchStudyGroups();
  }, []);

  // ✅ BUSCAR GRUPO PRIVADO POR CÓDIGO EXACTO
  const searchPrivateGroupByCode = async (code: string) => {
    try {
      console.log('🔍 Buscando grupo privado con código:', code);
      const response = await fetch(`http://localhost:8080/api/study-groups/code/${code}`);
      
      if (!response.ok) {
        // Si no encuentra el grupo, retornar null
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const group = await response.json();
      console.log('📥 Grupo encontrado:', group);
      
      // Solo retornar si es privado (los públicos ya están en la lista)
      return group && group.is_private ? group : null;
    } catch (err) {
      console.error('❌ Error buscando grupo por código:', err);
      return null;
    }
  };

  // Get unique values for filters (solo de grupos públicos)
  const subjects = useMemo(() => 
    Array.from(new Set(studyGroups
      .filter(group => !group.is_private)
      .map(group => group.subject))), 
    [studyGroups]
  );

  const dates = useMemo(() => 
    Array.from(new Set(studyGroups
      .filter(group => !group.is_private && group.meeting_date)
      .map(group => group.meeting_date!)
      .filter(date => date !== null))).sort(), 
    [studyGroups]
  );

  // Función para formatear la fecha en formato más legible
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formatear hora (remover segundos si existen)
  const formatTime = (timeString: string) => {
    return timeString.split(':').slice(0, 2).join(':');
  };

  // ✅ FUNCIÓN SEGURA PARA BUSCAR (búsqueda parcial para campos normales)
  const safeSearch = (text: string | null | undefined, searchTerm: string): boolean => {
    if (!text) return false;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  // ✅ FUNCIÓN EXACTA PARA BÚSQUEDA POR CÓDIGO
  const exactCodeSearch = (code: string, searchTerm: string): boolean => {
    return code === searchTerm; // Búsqueda exacta y case-sensitive
  };

  // ✅ FUNCIÓN DE RENDERIZADO DE HORARIO
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

  // ✅ EFECTO PARA BUSCAR GRUPOS PRIVADOS CUANDO EL TÉRMINO DE BÚSQUEDA CAMBIA
  useEffect(() => {
    const searchPrivateGroup = async () => {
      if (searchTerm.trim()) {
        const privateGroup = await searchPrivateGroupByCode(searchTerm.trim());
        setPrivateGroupSearch(privateGroup);
      } else {
        setPrivateGroupSearch(null);
      }
    };

    // Debounce para evitar muchas llamadas
    const timeoutId = setTimeout(searchPrivateGroup, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // ✅ FILTRO PRINCIPAL ACTUALIZADO
  const filteredGroups = useMemo(() => {
    let result = studyGroups.filter(group => {
      // Por defecto solo mostrar grupos públicos
      if (group.is_private) return false;
      
      // ✅ BÚSQUEDA MEJORADA
      const matchesSearch = searchTerm ? (
        // Búsqueda parcial en campos normales
        safeSearch(group.name, searchTerm) ||
        safeSearch(group.description, searchTerm) ||
        safeSearch(group.tutor_name, searchTerm) ||
        safeSearch(group.subject, searchTerm) ||
        // Búsqueda exacta por código
        exactCodeSearch(group.code, searchTerm)
      ) : true;
      
      const matchesSubject = !selectedSubject || group.subject === selectedSubject;
      const matchesSessionType = !selectedSessionType || group.session_type === selectedSessionType;
      
      const matchesDate = !selectedDate || 
        (group.session_type === 'examen' && group.meeting_date === selectedDate) ||
        (group.session_type === 'seguimiento' && !selectedDate);

      return matchesSearch && matchesSubject && matchesSessionType && matchesDate;
    });

    // ✅ AGREGAR GRUPO PRIVADO SI SE ENCONTRÓ POR CÓDIGO EXACTO
    if (privateGroupSearch) {
      // Verificar que el grupo privado no esté ya en la lista (por si acaso)
      const privateGroupNotInList = !result.some(group => group.id === privateGroupSearch.id);
      if (privateGroupNotInList) {
        result = [privateGroupSearch, ...result];
      }
    }

    return result;
  }, [studyGroups, searchTerm, selectedSubject, selectedSessionType, selectedDate, privateGroupSearch]);

  const handleJoinGroup = async (groupId: number, groupCode: string) => {
    try {
      const tokenKey = 'sb-zskuikxfcjobpygoueqp-auth-token';
      const tokenData = localStorage.getItem(tokenKey);
      
      if (!tokenData) {
        alert('Debes iniciar sesión para unirte a un grupo');
        return;
      }

      const authData = JSON.parse(tokenData);
      const accessToken = authData.access_token;

      console.log('🔄 Uniéndose al grupo:', groupCode);

      const response = await fetch(`http://localhost:8080/api/study-groups/${groupCode}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`✅ ${result.message}`);
        window.location.reload();
      } else {
        alert(`❌ ${result.error || 'Error al unirse al grupo'}`);
      }
      
    } catch (error: any) {
      console.error('Error uniéndose al grupo:', error);
      alert('❌ Error al unirse al grupo: ' + error.message);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSubject('');
    setSelectedSessionType('');
    setSelectedDate('');
    setPrivateGroupSearch(null);
  };

  const getSessionTypeDisplay = (type: 'seguimiento' | 'examen') => {
    return type === 'examen' ? 'Preparación Examen' : 'Seguimiento';
  };

  const getSessionTypeColor = (type: 'seguimiento' | 'examen') => {
    return type === 'examen' 
      ? 'bg-red-500/20 text-red-400 border-red-500/30' 
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  const getPrivacyBadge = (isPrivate: boolean) => {
    return isPrivate 
      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      : 'bg-green-500/20 text-green-400 border-green-500/30';
  };

  const getPrivacyDisplay = (isPrivate: boolean) => {
    return isPrivate ? '🔒 Privado' : '🌍 Público';
  };

  const totalPublicGroups = studyGroups.filter(group => !group.is_private).length;
  const hasActiveFilters = searchTerm || selectedSubject || selectedSessionType || selectedDate;

  if (loading) {
    return (
      <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8 flex items-center justify-center" style={{ paddingTop: '5rem' }}>
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white">Cargando grupos de estudio...</p>
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
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Grupos de Estudio
          </h1>
          <p className="text-neutral-400 text-lg">
            Encuentra grupos públicos o ingresa el código exacto de un grupo privado
          </p>
          <div className="mt-4 flex justify-center items-center space-x-4 text-sm text-neutral-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Grupos Públicos</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span>Grupos Privados (solo por código)</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-white mb-2">
                Buscar Grupos
              </label>
              <input
                type="text"
                id="search"
                placeholder="Buscar por nombre, materia... o ingresa CÓDIGO EXACTO para grupos privados"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-neutral-400">
                💡 Para grupos privados: ingresa el código exacto. Para públicos: búsqueda normal.
              </p>
            </div>

            {/* Subject Filter */}
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
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Session Type Filter */}
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

          {/* Date Filter */}
          <div className="mt-4">
            <label htmlFor="date" className="block text-sm font-medium text-white mb-2">
              Fecha (solo para exámenes)
            </label>
            <select
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Cualquier Fecha</option>
              {dates.map(date => (
                <option key={date} value={date}>
                  {formatDate(date)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-neutral-400">
              Nota: Los grupos de seguimiento se reúnen semanalmente en el mismo día
            </p>
          </div>
        </Card>

        {/* Results Count and Actions */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <p className="text-neutral-400">
              {privateGroupSearch 
                ? `Grupo privado encontrado + ${filteredGroups.length - 1} grupo${filteredGroups.length - 1 !== 1 ? 's' : ''} público${filteredGroups.length - 1 !== 1 ? 's' : ''}`
                : `Se encontraron ${filteredGroups.length} de ${totalPublicGroups} grupo${totalPublicGroups !== 1 ? 's' : ''} público${totalPublicGroups !== 1 ? 's' : ''} de estudio`
              }
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
          
          <Link to="/create-group">
            <Button variant="primary" className="whitespace-nowrap">
              Crear Nuevo Grupo
            </Button>
          </Link>
        </div>

        {/* Study Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map(group => (
            <Card 
              key={group.id} 
              className={`p-6 hover:shadow-lg transition-all duration-300 border-2 ${
                group.is_private 
                  ? 'border-purple-500/20 hover:shadow-purple-500/10' 
                  : 'border-green-500/20 hover:shadow-blue-500/10'
              }`}
            >
              <div className="space-y-4">
                {/* Group Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${getPrivacyBadge(group.is_private)}`}>
                      {getPrivacyDisplay(group.is_private)}
                    </span>
                    <span className="text-xs font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800" title="Código del grupo">
                      #{group.code}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                    {group.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="bg-neutral-800 px-3 py-1 rounded-full text-neutral-300">
                      {group.subject}
                    </span>
                    <span className={`px-3 py-1 rounded-full border text-xs ${getSessionTypeColor(group.session_type)}`}>
                      {getSessionTypeDisplay(group.session_type)}
                    </span>
                  </div>
                </div>

                {/* Schedule Info */}
                <div className="space-y-3">
                  {renderScheduleInfo(group)}
                  <div className="flex items-center text-neutral-300 text-sm">
                    <span className="w-6">👤</span>
                    <span>Tutor: {group.tutor_name || 'Por confirmar'}</span>
                  </div>
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
                          width: `${(group.current_participants / group.max_participants) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-neutral-400 text-sm line-clamp-3">
                  {group.description}
                </p>

                {/* Action Button */}
                <Button
                  variant={group.is_private ? "secondary" : "primary"}
                  onClick={() => handleJoinGroup(group.id, group.code)}
                  className="w-full mt-2"
                  disabled={group.current_participants >= group.max_participants}
                >
                  {group.current_participants >= group.max_participants 
                    ? 'Grupo Lleno' 
                    : group.is_private 
                      ? 'Unirse al Grupo Privado' 
                      : 'Unirse al Grupo Público'
                  }
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
              <h3 className="text-2xl font-semibold text-white">
                No se encontraron grupos
              </h3>
              <p className="text-neutral-400">
                {hasActiveFilters 
                  ? 'No hay grupos que coincidan con tus filtros. Intenta ajustar tus criterios de búsqueda.'
                  : 'Actualmente no hay grupos de estudio disponibles.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Link to="/create-group">
                  <Button variant="primary">
                    Crear Nuevo Grupo
                  </Button>
                </Link>
                <Button 
                  variant="secondary" 
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Empty State cuando no hay grupos en absoluto */}
        {studyGroups.length === 0 && (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-2xl font-semibold text-white">
                Aún no hay grupos de estudio
              </h3>
              <p className="text-neutral-400">
                Sé el primero en crear un grupo de estudio y colabora con otros estudiantes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Link to="/create-group">
                  <Button variant="primary">
                    Crear el Primer Grupo
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}
        {/* Back to Dashboard */}
        <div className="text-center mt-12">
          <Link to="/dashboard">
            <Button variant="secondary">
              Volver al Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};