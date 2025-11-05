import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

interface Group {
  id: number;
  name: string;
  description?: string;
  subject?: string;
  is_private: boolean;
  coordinator_id: string;
  created_at?: string;
}

interface GroupStatus {
  role: 'coordinator' | 'member' | 'invited' | 'none';
  invited?: boolean;        // invited to private group
  request_pending?: boolean;// sent join request pending
}

export const GroupDetailPage: React.FC = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [status, setStatus] = useState<GroupStatus | null>(null);

  const isCoordinator = useMemo(() => status?.role === 'coordinator', [status]);
  const isMember = useMemo(() => status?.role === 'member', [status]);
  const isInvited = useMemo(() => status?.role === 'invited' || status?.invited, [status]);
  const isPrivate = useMemo(() => !!group?.is_private, [group]);

  useEffect(() => {
    let alive = true;
    const fetchData = async () => {
      if (!groupId || !user) return;
      setLoading(true);
      setError(null);
      try {
        // Access token from supabase local storage
        const tokenKey = Object.keys(localStorage).find((k) => k.includes('-auth-token'));
        const tokenData = tokenKey ? localStorage.getItem(tokenKey) : null;
        const accessToken = tokenData ? JSON.parse(tokenData).access_token : null;

        const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

        const [groupRes, statusRes] = await Promise.all([
          fetch(`http://localhost:8080/api/study-groups/${groupId}`, { headers }),
          fetch(`http://localhost:8080/api/study-groups/${groupId}/status`, { headers })
        ]);

        if (!alive) return;

        if (!groupRes.ok) throw new Error('No se pudo cargar el grupo');
        const groupJson = await groupRes.json();
        setGroup(groupJson as Group);

        if (!statusRes.ok) {
          // Si el backend aún no implementa, derivar un estado básico
          setStatus({ role: groupJson.coordinator_id === user.id ? 'coordinator' : 'none' });
        } else {
          const statusJson = await statusRes.json();
          setStatus(statusJson as GroupStatus);
        }
      } catch (e) {
        console.error(e);
        if (alive) setError('No se pudo cargar la información del grupo');
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchData();
    return () => { alive = false; };
  }, [groupId, user]);

  const handleJoinPublic = async () => {
    if (!groupId) return;
    setActionLoading(true);
    setError(null);
    try {
      const tokenKey = Object.keys(localStorage).find((k) => k.includes('-auth-token'));
      const tokenData = tokenKey ? localStorage.getItem(tokenKey) : null;
      const accessToken = tokenData ? JSON.parse(tokenData).access_token : null;
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const res = await fetch(`http://localhost:8080/api/study-groups/${groupId}/join`, {
        method: 'POST', headers
      });
      if (!res.ok) throw new Error('No se pudo unir al grupo');
      setStatus({ role: 'member' });
    } catch (e) {
      console.error(e);
      setError('No se pudo realizar la acción');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestJoin = async () => {
    if (!groupId) return;
    setActionLoading(true);
    setError(null);
    try {
      const tokenKey = Object.keys(localStorage).find((k) => k.includes('-auth-token'));
      const tokenData = tokenKey ? localStorage.getItem(tokenKey) : null;
      const accessToken = tokenData ? JSON.parse(tokenData).access_token : null;
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const res = await fetch(`http://localhost:8080/api/study-groups/${groupId}/requests`, {
        method: 'POST', headers
      });
      if (!res.ok) throw new Error('No se pudo solicitar unirse');
      setStatus({ role: 'none', request_pending: true });
    } catch (e) {
      console.error(e);
      setError('No se pudo realizar la acción');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!groupId) return;
    setActionLoading(true);
    setError(null);
    try {
      const tokenKey = Object.keys(localStorage).find((k) => k.includes('-auth-token'));
      const tokenData = tokenKey ? localStorage.getItem(tokenKey) : null;
      const accessToken = tokenData ? JSON.parse(tokenData).access_token : null;
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const res = await fetch(`http://localhost:8080/api/study-groups/${groupId}/invitations/accept`, {
        method: 'POST', headers
      });
      if (!res.ok) throw new Error('No se pudo aceptar la invitación');
      setStatus({ role: 'member' });
    } catch (e) {
      console.error(e);
      setError('No se pudo realizar la acción');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineInvite = async () => {
    if (!groupId) return;
    setActionLoading(true);
    setError(null);
    try {
      const tokenKey = Object.keys(localStorage).find((k) => k.includes('-auth-token'));
      const tokenData = tokenKey ? localStorage.getItem(tokenKey) : null;
      const accessToken = tokenData ? JSON.parse(tokenData).access_token : null;
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const res = await fetch(`http://localhost:8080/api/study-groups/${groupId}/invitations/decline`, {
        method: 'POST', headers
      });
      if (!res.ok) throw new Error('No se pudo rechazar la invitación');
      setStatus({ role: 'none' });
    } catch (e) {
      console.error(e);
      setError('No se pudo realizar la acción');
    } finally {
      setActionLoading(false);
    }
  };

  const CoordinatorView = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs">Coordinador</span>
        {isPrivate ? (
          <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 text-xs">Privado</span>
        ) : (
          <span className="px-2 py-1 rounded bg-green-500/20 text-green-300 text-xs">Público</span>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" className="px-4 py-2">Editar grupo</Button>
        <Button variant="secondary" className="px-4 py-2">Gestionar miembros</Button>
        <Button variant="secondary" className="px-4 py-2">Invitar</Button>
      </div>
    </div>
  );

  const MemberView = () => (
    <div className="space-y-4">
      <span className="px-2 py-1 rounded bg-green-500/20 text-green-300 text-xs">Miembro</span>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" className="px-4 py-2">Ver sesiones</Button>
        <Button variant="secondary" className="px-4 py-2">Salir del grupo</Button>
      </div>
    </div>
  );

  const InvitedView = () => (
    <div className="space-y-4">
      <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-xs">Invitado</span>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={handleAcceptInvite} loading={actionLoading} className="px-4 py-2">Aceptar invitación</Button>
        <Button variant="secondary" onClick={handleDeclineInvite} disabled={actionLoading} className="px-4 py-2">Rechazar</Button>
      </div>
    </div>
  );

  const VisitorPrivateView = () => (
    <div className="space-y-4">
      <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 text-xs">Grupo privado</span>
      {status?.request_pending ? (
        <p className="text-neutral-400 text-sm">Solicitud enviada. Espera la aprobación del coordinador.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={handleRequestJoin} loading={actionLoading} className="px-4 py-2">Solicitar unirse</Button>
        </div>
      )}
    </div>
  );

  const VisitorPublicView = () => (
    <div className="space-y-4">
      <span className="px-2 py-1 rounded bg-green-500/20 text-green-300 text-xs">Grupo público</span>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={handleJoinPublic} loading={actionLoading} className="px-4 py-2">Unirme</Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" style={{ paddingTop: '5rem' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Cargando grupo...</p>
        </div>
      </div>
    );
  }

  if (error || !group || !status) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4" style={{ paddingTop: '5rem' }}>
        <Card className="p-8 max-w-lg w-full">
          <h1 className="text-xl font-bold text-white mb-2">No se pudo cargar el grupo</h1>
          <p className="text-neutral-400 mb-4">{error || 'Intenta de nuevo más tarde.'}</p>
          <Button variant="secondary" onClick={() => navigate(-1)}>Volver</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{group.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-400">
            {group.subject && <span>{group.subject}</span>}
            <span className="text-neutral-600">•</span>
            <span>{isPrivate ? 'Privado' : 'Público'}</span>
            {group.created_at && (
              <>
                <span className="text-neutral-600">•</span>
                <span>Creado el {new Date(group.created_at).toLocaleDateString()}</span>
              </>
            )}
          </div>
          {group.description && (
            <p className="text-neutral-300 mt-3">{group.description}</p>
          )}
        </div>

        <Card className="p-6">
          {isCoordinator && <CoordinatorView />}
          {!isCoordinator && isMember && <MemberView />}
          {!isCoordinator && !isMember && isInvited && <InvitedView />}
          {!isCoordinator && !isMember && !isInvited && isPrivate && <VisitorPrivateView />}
          {!isCoordinator && !isMember && !isInvited && !isPrivate && <VisitorPublicView />}
        </Card>
      </div>
    </div>
  );
};
