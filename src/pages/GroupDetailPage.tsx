import React, { useState, useEffect, useMemo } from 'react';
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
  code?: string;
  is_private: boolean;
  coordinator_id: string;
  created_at?: string;
  session_type?: string;
  current_participants?: number;
  max_participants?: number;
  meeting_date?: string | null;
  meeting_time?: string | null;
  tutor_name?: string | null;
  members_count?: number;
}

interface GroupStatus {
  role: 'coordinator' | 'member' | 'invited' | 'none';
  request_pending?: boolean;
  [key: string]: any;
}

export const GroupDetailPage: React.FC = () => {
  const { id, groupId } = useParams<{ id?: string; groupId?: string }>();
  const effectiveGroupId = groupId || id;
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const hint = (location.state as any)?.groupHint as Partial<Group> | undefined;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [membersCount, setMembersCount] = useState<number | null>(null);
  const [status, setStatus] = useState<GroupStatus | null>(null);

  const getAccessToken = (): string | null => {
    try {
      const raw = localStorage.getItem('sb-zskuikxfcjobpygoueqp-auth-token');
      return raw ? JSON.parse(raw).access_token : null;
    } catch {
      return null;
    }
  };

  const buildHeaders = async () => {
    const token = await getAccessToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchGroup = async () => {
    if (!effectiveGroupId) return;
    try {
      const headers = await buildHeaders();
      const res = await fetch(`http://localhost:8080/api/groups/${effectiveGroupId}`, { headers });
      console.log(`GET /api/groups/${effectiveGroupId} → ${res.status}`);
      if (!res.ok) {
        setError('No se pudo cargar la información del grupo');
        return;
      }
      const data: Group = await res.json();
      setGroup(data);
      setError(null);
    } catch {
      setError('No se pudo cargar la información del grupo');
    }
  };

  const fetchMembershipStatus = async () => {
    if (!groupId) return;
    try {
      const headers = await buildHeaders();
      const res = await fetch(`http://localhost:8080/api/groups/my-groups`, { headers });
      if (!res.ok) {
        setStatus((prev) => prev ?? { role: 'none' });
        return;
      }
      const list = await res.json();
      const gid = Number(groupId);
      const found = Array.isArray(list) ? list.find((g: any) => Number(g.id) === gid) : null;
      if (found) {
        const rawRole = found.role || found.membership_role || found.membershipRole || 'member';
        setStatus({ role: rawRole === 'coordinator' ? 'coordinator' : 'member' });
      } else {
        setStatus({ role: 'none' });
      }
    } catch {
      setStatus((prev) => prev ?? { role: 'none' });
    }
  };

  useEffect(() => { fetchGroup(); }, [effectiveGroupId]);
  useEffect(() => { fetchMembershipStatus(); }, [groupId]);

  const participantsCount = group
    ? (group.current_participants ??
      (group as any).participants_count ??
      (group as any).members_count ??
      null)
    : null;

  const fetchRequests = async () => {
    if (!groupId) return;
    setRequestsLoading(true);
    try {
      const headers = await buildHeaders();
      const res = await fetch(`http://localhost:8080/api/groups/${groupId}/requests`, { headers });
      if (!res.ok) throw new Error('requests failed');
      const json = await res.json();
      setRequests(Array.isArray(json) ? json : []);
    } catch {
      setRequests([]);
    } finally { setRequestsLoading(false); }
  };

  const fetchMembers = async (): Promise<any[]> => {
    if (!groupId) return [];
    setMembersLoading(true);
    try {
      const headers = await buildHeaders();
      const base = 'http://localhost:8080';
      const candidates = [
        `${base}/api/study-groups/${groupId}/members`,
        `${base}/api/groups/${groupId}/members`,
        `${base}/api/study-groups/${groupId}/participants`,
        `${base}/api/groups/${groupId}/participants`,
        `${base}/api/group-members?groupId=${groupId}`
      ];

      for (const url of candidates) {
        try {
          const res = await fetch(url, { headers });
            console.log(`GET ${url} → ${res.status}`);
          if (res.ok) {
            const json = await res.json();
            const arr = Array.isArray(json) ? json : (Array.isArray(json?.members) ? json.members : []);
            setMembers(arr);
            return arr;
          }
        } catch {
          continue;
        }
      }

      try {
        const myRes = await fetch(`${base}/api/study-groups/my-groups`, { headers });
        if (myRes.ok) {
          const myList = await myRes.json();
          const found = Array.isArray(myList) && myList.find((g: any) => String(g.id) === String(groupId));
          if (found) {
            const fakeMember = { id: (user as any)?.id ?? 'me', name: (user as any)?.email ?? 'Tú' };
            setMembers([fakeMember]);
            return [fakeMember];
          }
        }
      } catch {}

      setMembers([]);
      return [];
    } catch {
      setMembers([]);
      return [];
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (status?.role === 'coordinator') {
      fetchRequests();
      fetchMembers();
    }
  }, [status?.role, groupId]);

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
        const headers = await buildHeaders();
        const groupRes = await fetch(`http://localhost:8080/api/study-groups/${groupId}`, { headers });
        let groupData: Group | null = null;

        if (groupRes.ok) {
          groupData = await groupRes.json();
          setGroup(groupData);
        } else {
          await fetchGroup();
          if (!group && hint) {
            setGroup(hint as Group);
            groupData = hint as Group;
          } else if (!group) {
            setError('No se pudo cargar la información del grupo');
          }
        }

        if (!alive) return;

        const statusRes = await fetch(`http://localhost:8080/api/study-groups/${groupId}/status`, { headers });
        if (statusRes.ok) {
          const statusJson = await statusRes.json();
          setStatus(statusJson as GroupStatus);
        } else {
          const mems = await fetchMembers();
          const isMemberNow = mems.some((m: any) =>
            String(m.user_id ?? m.id ?? m.id_user ?? m.member_id) === String(user?.id)
          );
          const isCoord = !!groupData && String(groupData.coordinator_id) === String(user?.id);
          setStatus(isMemberNow ? { role: 'member' } : (isCoord ? { role: 'coordinator' } : { role: 'none' }));
        }
      } catch {
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

  const normalizeStatus = (raw: any): GroupStatus => {
    if (!raw) return { role: 'none' };
    if (typeof raw === 'string') return { role: raw as GroupStatus['role'] };
    if (raw.role) {
      return {
        role: raw.role as GroupStatus['role'],
        request_pending: raw.request_pending ?? raw.pending_request ?? raw.requestPending ?? false,
        ...raw
      };
    }
    if (raw.status) {
      return {
        role: raw.status as GroupStatus['role'],
        request_pending: raw.request_pending ?? false,
        ...raw
      };
    }
    return { role: 'none' };
  };

  useEffect(() => {
    const loadStatus = async () => {
      if (!group?.id) return;
      try {
        const headers = await buildHeaders();
        const res = await fetch(`http://localhost:8080/api/groups/${group.id}/status`, { headers });
        if (res.ok) {
          const json = await res.json();
          setStatus(normalizeStatus(json));
        } else {
          setStatus((prev) => prev ?? { role: 'none' });
        }
      } catch {
        setStatus((prev) => prev ?? { role: 'none' });
      }
    };
    loadStatus();
  }, [group?.id]);

  // Si el usuario es el creador del grupo, asegura rol coordinador
  useEffect(() => {
    if (!group || !user) return;
    const isCreator = String(group.coordinator_id) === String(user.id);
    if (isCreator && status?.role !== 'coordinator') {
      setStatus((prev) => ({ ...(prev || { role: 'none' }), role: 'coordinator' }));
    }
  }, [group?.coordinator_id, user?.id]);

  // Rol efectivo: prioriza si es el creador del grupo
  const isCreator = String(group?.coordinator_id ?? '') === String(user?.id ?? '');
  const effectiveRole = (isCreator ? 'coordinator' : (status?.role ?? 'none')) as GroupStatus['role'];
  const isCoordinator = effectiveRole === 'coordinator';
  const isMember = effectiveRole === 'member';
  const isInvited = effectiveRole === 'invited';
  const isPrivate = !!group?.is_private;

  const roleLabel =
    isCoordinator ? 'Coordinador' :
    isMember ? 'Miembro' :
    isInvited ? 'Invitado' :
    isPrivate ? 'Privado' :
    'Público';

  // Actions
  const handleLeaveGroup = async () => {
    if (!group?.id) return;
    setActionLoading(true);
    try {
      const headers = await buildHeaders();
      const res = await fetch(`http://localhost:8080/api/groups/${group.id}/leave`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        setStatus({ role: 'none' });
        await fetchGroup();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    if (!groupId) return;
    try {
      const headers = await buildHeaders();
      const res = await fetch(`http://localhost:8080/api/study-groups/${groupId}/requests/${requestId}/approve`, { method: 'POST', headers });
      if (!res.ok) throw new Error('approve failed');
      fetchRequests();
      fetchMembers();
    } catch {}
  };

  const handleDeclineRequest = async (requestId: number) => {
    if (!groupId) return;
    try {
      const headers = await buildHeaders();
      const res = await fetch(`http://localhost:8080/api/study-groups/${groupId}/requests/${requestId}/decline`, { method: 'POST', headers });
      if (!res.ok) throw new Error('decline failed');
      fetchRequests();
    } catch {}
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!groupId) return;
    if (!confirm('¿Remover miembro del grupo?')) return;
    try {
      const headers = await buildHeaders();
      const res = await fetch(`http://localhost:8080/api/study-groups/${groupId}/members/${memberId}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('remove member failed');
      fetchMembers();
    } catch {}
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      setError('No se pudo realizar la acción');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinPublic = async () => {
    if (!group?.id) return;
    setActionLoading(true);
    try {
      const headers = await buildHeaders();
      const res = await fetch(`http://localhost:8080/api/groups/${group.id}/join`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        setStatus({ role: 'member' });
        await fetchGroup();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleGoToRequests = () => {
    if (!groupId) return;
    navigate(`/groups/${groupId}/requests`);
  };

  const CoordinatorView = () => (
    <div className="space-y-6">
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
          <Button variant="primary" onClick={handleInvite} loading={inviteLoading} className="px-4">
            Enviar invitación
          </Button>
        </div>
      </div>

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
                  <div className="text-white text-sm font-medium truncate">
                    {r.email || r.user_email || 'Usuario'}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {r.created_at ? new Date(r.created_at).toLocaleString() : ''}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => handleApproveRequest(r.id)}
                  >
                    Aceptar
                  </Button>
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => handleDeclineRequest(r.id)}
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                  <div className="text-white text-sm font-medium truncate">
                    {m.name || m.full_name || m.email || 'Miembro'}
                  </div>
                  <div className="text-xs text-neutral-400">{m.email}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => handleRemoveMember(m.id)}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center flex-wrap gap-4 pt-2">
        <Button variant="primary" className="px-5 py-2" onClick={handleGoToRequests}>
          Ver solicitudes
        </Button>
      </div>
    </div>
  );

  const MemberView = () => (
    
      <div className="flex justify-center flex-wrap gap-4">
        <Button variant="primary" className="px-5 py-2" onClick={handleGoToRequests}>
          Ver solicitudes
        </Button>
        <Button
          variant="secondary"
          onClick={handleLeaveGroup}
          loading={actionLoading}
          className="px-5 py-2"
        >
          Salir del grupo
        </Button>
      </div>
    
  );

  const InvitedView = () => (
    <div className="space-y-4">
      <div className="flex justify-center flex-wrap gap-4">
        <Button
          variant="primary"
          onClick={handleAcceptInvite}
          loading={actionLoading}
          className="px-5 py-2"
        >
          Aceptar invitación
        </Button>
        <Button
          variant="secondary"
          onClick={handleDeclineInvite}
          disabled={actionLoading}
          className="px-5 py-2"
        >
          Rechazar
        </Button>
      </div>
    </div>
  );

  const VisitorPrivateView = () => (
    <div className="space-y-4">
      {status?.request_pending ? (
        <p className="text-neutral-400 text-sm text-center">
          Solicitud enviada. Espera la aprobación del coordinador.
        </p>
      ) : (
        <div className="flex justify-center flex-wrap gap-4">
          <Button
            variant="primary"
            onClick={handleRequestJoin}
            loading={actionLoading}
            className="px-5 py-2"
          >
            Solicitar unirse
          </Button>
        </div>
      )}
    </div>
  );

  const VisitorPublicView = () => (
    <div className="space-y-4">
      <div className="flex justify-center flex-wrap gap-4">
        <Button
          variant="primary"
          onClick={handleJoinPublic}
          loading={actionLoading}
          className="px-5 py-2"
        >
          Unirme
        </Button>
      </div>
    </div>
  );

  const roleView: React.ReactNode =
    isCoordinator ? <CoordinatorView /> :
    isMember ? <MemberView /> :
    isInvited ? <InvitedView /> :
    isPrivate ? <VisitorPrivateView /> :
    <VisitorPublicView />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black" style={{ paddingTop: '5rem' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-sm">Cargando grupo...</p>
        </div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4" style={{ paddingTop: '5rem' }}>
        <Card className="max-w-sm w-full border border-red-900/40">
          <h2 className="text-white font-semibold mb-2">No se pudo cargar el grupo</h2>
            <p className="text-neutral-400 text-sm mb-4">{error}</p>
            <Button variant="secondary" onClick={() => navigate(-1)}>Volver</Button>
        </Card>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4" style={{ paddingTop: '5rem' }}>
        <Card className="max-w-sm w-full">
          <h2 className="text-white font-semibold mb-2">Grupo no disponible</h2>
          <p className="text-neutral-400 text-sm mb-4">Intenta nuevamente más tarde.</p>
          <Button variant="secondary" onClick={() => navigate(-1)}>Volver</Button>
        </Card>
      </div>
    );
  }

  const GroupAvatar: React.FC<{ name?: string; code?: string }> = ({ name, code }) => {
    const label = (name?.trim() || code || '?').slice(0, 2).toUpperCase();
    return (
      <div className="w-30 h-30 rounded-full bg-neutral-900 border-4 border-black ring-2 ring-neutral-700 flex items-center justify-center">
        <span className="text-white font-bold">{label}</span>
      </div>
    );
  };

  const StatPill: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="bg-neutral-900/60 border border-neutral-700 rounded-lg p-3 text-xs">
      <div className="text-neutral-400">{label}</div>
      <div className="text-white font-semibold mt-1">{value}</div>
    </div>
  );

  const sessionTypeText = (() => {
    const raw =
      group?.session_type ??
      (group as any)?.sessionType ??
      (group as any)?.type ??
      null;
    if (!raw) return '—';
    const v = String(raw).toLowerCase();
    if (v === 'examen') return 'Examen';
    if (v === 'seguimiento') return 'Seguimiento';
    return v.charAt(0).toUpperCase() + v.slice(1);
  })();

  const shownParticipants =
    group?.current_participants ??
    (group as any)?.participants_count ??
    (group as any)?.members_count ??
    null;

  return (
    <div className="min-h-screen bg-black text-white px-4 pb-20" style={{ paddingTop: '5rem' }}>
      <div className="max-w-6xl mx-auto">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-red-700 to-orange-400" />
          <div className="px-4 sm:px-6 -mt-1 flex items-end gap-4">
            <GroupAvatar name={group?.name} code={group?.code} />
            <div className="flex-1 pb-2">
              <span className="inline-block text-xs font-medium text-neutral-300 mb-1 px-2 py-0.5 rounded bg-neutral-800/60 border border-neutral-700">
                {roleLabel}
              </span>
              <h1 className="text-4xl font-bold text-white leading-tight">{group?.name}</h1>
              <div className="text-neutral-400 text-sm mt-0.5">Código: {group?.code || '—'}</div>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatPill
                label="Participantes"
                value={
                  <>
                    {(shownParticipants ?? '—').toString()}
                    {group?.max_participants ? ` / ${group.max_participants}` : ''}
                  </>
                }
              />
              <StatPill label="Tipo" value={sessionTypeText} />
              <StatPill label="Privacidad" value={group?.is_private ? '🔒 Privado' : '🌍 Público'} />
              <StatPill label="ID" value={group?.id ?? '—'} />
            </div>
            {group?.description && (
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-1">Descripción</h3>
                <p className="text-neutral-300 text-sm whitespace-pre-wrap">{group.description}</p>
              </div>
            )}
            {roleView && (
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
                {roleView}
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={() => navigate('/dashboard')} className="px-6 py-2">
            Volver al dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
