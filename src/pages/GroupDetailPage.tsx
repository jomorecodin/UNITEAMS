import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

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
  const location = useLocation();
  const { user } = useAuth();

  const hint = (location.state as any)?.groupHint as Partial<Group> | undefined;

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(hint ? ({
    id: Number(hint.id),
    name: hint.name || 'Grupo',
    subject: hint.subject,
    is_private: !!hint.is_private,
    coordinator_id: '',
  } as Group) : null);
  const [status, setStatus] = useState<GroupStatus | null>(null);

  // Coordinator management state
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const isCoordinator = useMemo(() => status?.role === 'coordinator', [status]);
  const isMember = useMemo(() => status?.role === 'member', [status]);
  const isInvited = useMemo(() => status?.role === 'invited' || status?.invited, [status]);
  const isPrivate = useMemo(() => !!group?.is_private, [group]);

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  };

  const buildHeaders = async () => {
    const token = await getAccessToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // Fetch coordinator data
  const fetchRequests = async () => {
    if (!groupId) return;
    setRequestsLoading(true);
    try {
      const headers = await buildHeaders();
      const res = await fetch(`http://localhost:8080/api/study-groups/${groupId}/requests`, { headers });
      if (!res.ok) throw new Error('requests failed');
      const json = await res.json();
      setRequests(Array.isArray(json) ? json : []);
    } catch (e) {
      console.warn('No se pudieron cargar las solicitudes');
      setRequests([]);
    } finally { setRequestsLoading(false); }
  };

  const fetchMembers = async () => {
    if (!groupId) return;
    setMembersLoading(true);
    try {
      const headers = await buildHeaders();
      const res = await fetch(`http://localhost:8080/api/study-groups/${groupId}/members`, { headers });
      if (!res.ok) throw new Error('members failed');
      const json = await res.json();
      setMembers(Array.isArray(json) ? json : []);
    } catch (e) {
      console.warn('No se pudieron cargar los miembros');
      setMembers([]);
    } finally { setMembersLoading(false); }
  };

  useEffect(() => {
    if (isCoordinator) {
      fetchRequests();
      fetchMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCoordinator, groupId]);

  useEffect(() => {
    let alive = true;
    const fetchData = async () => {
      if (!groupId || !user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const accessToken = await getAccessToken();
        const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

        const [groupRes, statusRes] = await Promise.all([
          fetch(`http://localhost:8080/api/study-groups/${groupId}`, { headers }),
          fetch(`http://localhost:8080/api/study-groups/${groupId}/status`, { headers })
        ]);

        if (!alive) return;

        if (!groupRes.ok) {
          console.warn('Group fetch failed:', groupRes.status, groupRes.statusText);
          if (groupRes.status === 404 && hint) {
            setGroup((prev) => prev || (hint as Group));
          } else {
            throw new Error('No se pudo cargar el grupo');
          }
        } else {
          const groupJson = await groupRes.json();
          setGroup(groupJson as Group);
        }

        if (!statusRes.ok) {
          console.warn('Status fetch not OK, deriving basic status');
          setStatus({ role: (hint && hint.coordinator_id === user.id) ? 'coordinator' : 'none' });
        } else {
          const statusJson = await statusRes.json();
          setStatus(statusJson as GroupStatus);
        }
      } catch (e) {
        console.error('Group detail load error:', e);
        if (alive) {
          if (hint) {
            setGroup((prev) => prev || (hint as Group));
            setStatus((prev) => prev || { role: 'none' });
            setError(null);
          } else {
            setError('No se pudo cargar la información del grupo');
          }
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchData();
    return () => { alive = false; };
  }, [groupId, user]);

  // Actions
  const handleLeaveGroup = async () => {
    if (!groupId) return;
    setActionLoading(true);
    setError(null);
    try {
      const headers = await buildHeaders();
      const res = await fetch(`http://localhost:8080/api/study-groups/${groupId}/leave`, { method: 'POST', headers });
      if (!res.ok) throw new Error('leave failed');
      setStatus({ role: 'none' });
    } catch (e) {
      console.error(e);
      setError('No se pudo salir del grupo');
    } finally { setActionLoading(false); }
  };

  const handleApproveRequest = async (requestId: number) => {
    if (!groupId) return;
    try {
      const headers = await buildHeaders();
      const res = await fetch(`http://localhost:8080/api/study-groups/${groupId}/requests/${requestId}/approve`, { method: 'POST', headers });
      if (!res.ok) throw new Error('approve failed');
      fetchRequests();
      fetchMembers();
    } catch (e) { console.error(e); }
  };

  const handleDeclineRequest = async (requestId: number) => {
    if (!groupId) return;
    try {
      const headers = await buildHeaders();
      const res = await fetch(`http://localhost:8080/api/study-groups/${groupId}/requests/${requestId}/decline`, { method: 'POST', headers });
      if (!res.ok) throw new Error('decline failed');
      fetchRequests();
    } catch (e) { console.error(e); }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!groupId) return;
    if (!confirm('¿Remover miembro del grupo?')) return;
    try {
      const headers = await buildHeaders();
      const res = await fetch(`http://localhost:8080/api/study-groups/${groupId}/members/${memberId}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('remove member failed');
      fetchMembers();
    } catch (e) { console.error(e); }
  };

  const handleInvite = async () => {
    if (!groupId || !inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      const headers = await buildHeaders();
      const res = await fetch(`http://localhost:8080/api/study-groups/${groupId}/invitations`, {
        method: 'POST', headers, body: JSON.stringify({ email: inviteEmail.trim() })
      });
      if (!res.ok) throw new Error('invite failed');
      setInviteEmail('');
      alert('Invitación enviada');
    } catch (e) {
      console.error(e);
      alert('No se pudo enviar la invitación');
    } finally { setInviteLoading(false); }
  };

  const handleAcceptInvite = async () => {
    if (!groupId) return;
    setActionLoading(true);
    setError(null);
    try {
      const headers = await buildHeaders();
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
      const headers = await buildHeaders();
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

  const handleRequestJoin = async () => {
    if (!groupId) return;
    setActionLoading(true);
    setError(null);
    try {
      const headers = await buildHeaders();
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

  const handleJoinPublic = async () => {
    if (!groupId) return;
    setActionLoading(true);
    setError(null);
    try {
      const headers = await buildHeaders();
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

  const CoordinatorView = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs">Coordinador</span>
        {isPrivate ? (
          <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 text-xs">Privado</span>
        ) : (
          <span className="px-2 py-1 rounded bg-green-500/20 text-green-300 text-xs">Público</span>
        )}
      </div>

      {/* Invite */}
      <div className="border border-neutral-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Invitar miembro</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            className="input-custom flex-1"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <Button variant="primary" onClick={handleInvite} loading={inviteLoading} className="px-4">Enviar invitación</Button>
        </div>
      </div>

      {/* Requests */}
      <div className="border border-neutral-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Solicitudes pendientes</h3>
          {requestsLoading && <span className="text-xs text-neutral-400">Cargando...</span>}
        </div>
        {requests.length === 0 ? (
          <p className="text-neutral-500 text-sm">No hay solicitudes</p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-neutral-900/40 rounded p-3">
                <div className="min-w-0">
                  <div className="text-white text-sm font-medium truncate">{r.email || r.user_email || 'Usuario'}</div>
                  <div className="text-xs text-neutral-400">Solicitado el {r.created_at ? new Date(r.created_at).toLocaleString() : ''}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" className="px-3 py-1.5 text-xs" onClick={() => handleApproveRequest(r.id)}>Aceptar</Button>
                  <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => handleDeclineRequest(r.id)}>Rechazar</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Members */}
      <div className="border border-neutral-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Miembros</h3>
          {membersLoading && <span className="text-xs text-neutral-400">Cargando...</span>}
        </div>
        {members.length === 0 ? (
          <p className="text-neutral-500 text-sm">No hay miembros</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between bg-neutral-900/40 rounded p-3">
                <div className="min-w-0">
                  <div className="text-white text-sm font-medium truncate">{m.name || m.full_name || m.email || 'Miembro'}</div>
                  <div className="text-xs text-neutral-400">{m.email}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => handleRemoveMember(m.id)}>Remover</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const MemberView = () => (
    <div className="space-y-4">
      <span className="px-2 py-1 rounded bg-green-500/20 text-green-300 text-xs">Miembro</span>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" className="px-4 py-2">Ver sesiones</Button>
        <Button variant="secondary" onClick={handleLeaveGroup} loading={actionLoading} className="px-4 py-2">Salir del grupo</Button>
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
