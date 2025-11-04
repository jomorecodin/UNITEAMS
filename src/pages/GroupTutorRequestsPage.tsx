import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { createPortal } from 'react-dom';

type GroupRequest = {
  id: number;
  idGroup: number;
  idTutor: string;
  tutorName?: string;
  tutor_name?: string; // Por si el backend envía snake_case
  createdAt: string;
  created_at?: string; // Por si el backend envía snake_case
};

type GroupInfo = {
  tutorId: string | number | null;
  tutorName: string | null;
};

export const GroupTutorRequestsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const numericGroupId = Number(groupId);

  const [requests, setRequests] = useState<GroupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [group, setGroup] = useState<GroupInfo>({ tutorId: null, tutorName: null });

  const [confirm, setConfirm] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [confirmAccept, setConfirmAccept] = useState<{
    open: boolean;
    requestId: number | null;
    tutorId: string | null;
    tutorName: string | null;
  }>({ open: false, requestId: null, tutorId: null, tutorName: null });

  const hasTutorAssigned = !!(group.tutorId !== null && String(group.tutorId).trim().length > 0);

  const openConfirm = (id: number) => setConfirm({ open: true, id });
  const closeConfirm = () => setConfirm({ open: false, id: null });
  const openConfirmAccept = (r: GroupRequest) =>
    setConfirmAccept({
      open: true,
      requestId: r.id,
      tutorId: String(r.idTutor ?? '').trim(),
      tutorName: r.tutorName || r.tutor_name || null
    });
  const closeConfirmAccept = () =>
    setConfirmAccept({ open: false, requestId: null, tutorId: null, tutorName: null });

  const getAccessToken = (): string | null => {
    try {
      const raw = localStorage.getItem('sb-zskuikxfcjobpygoueqp-auth-token');
      return raw ? JSON.parse(raw).access_token : null;
    } catch {
      return null;
    }
  };

  // Cargar información del grupo (para saber si ya tiene tutor asignado)
  const fetchGroup = async () => {
    if (!numericGroupId) return;
    try {
      const token = getAccessToken();
      const headers: HeadersInit = {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`http://localhost:8080/api/groups/${numericGroupId}`, { headers });
       console.log('📡 Response status (api/groups):', res.status);
      
       if (!res.ok) {
        console.warn('❌ No se pudo cargar info del grupo (status:', res.status, ')');
         setGroup({ tutorId: null, tutorName: null });
         return;
       }
      
       const data = await res.json();
       console.log('✅ Group data received:', JSON.stringify(data, null, 2));
       const tutorId = data?.tutorId ?? data?.tutor_id ?? null;
       const tutorName = data?.tutorName ?? data?.tutor_name ?? null;
       console.log('🎯 Extracted tutorId:', tutorId, 'tutorName:', tutorName);
       setGroup({ tutorId, tutorName });
    } catch (e) {
       console.error('❌ Error fetching group:', e);
       setGroup({ tutorId: null, tutorName: null });
    }
  };

  const fetchRequests = async () => {
    if (!numericGroupId) return;
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      console.log('🔍 Fetching requests for group:', numericGroupId);
      console.log('🔑 Token:', token ? 'present' : 'missing');
      const res = await fetch(`http://localhost:8080/api/group-requests/group/${numericGroupId}`, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      console.log('📡 Response status:', res.status);
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.error('❌ Error response:', txt);
        throw new Error(txt || `Error ${res.status}`);
      }
      const data: GroupRequest[] = await res.json();
      console.log('✅ Requests loaded:', data);
      console.log('🔍 Primera solicitud (estructura completa):', JSON.stringify(data[0], null, 2));
      setRequests(data);
    } catch (e: any) {
      console.error('❌ Fetch error:', e);
      setError(e?.message || 'No se pudieron cargar las solicitudes');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (id: number) => {
    try {
      setDeletingId(id);
      const token = getAccessToken();
      const res = await fetch(`http://localhost:8080/api/group-requests/${id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Error ${res.status}`);
      }
      await fetchRequests();
    } catch (e: any) {
      alert(e?.message || 'No se pudo eliminar la solicitud');
    } finally {
      setDeletingId(null);
    }
  };

  const assignTutorOnServer = async (groupId: number, payload: any, token: string | null) => {
    const res = await fetch(`http://localhost:8080/api/groups/${groupId}/assign-tutor`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(txt || `Error ${res.status} al asignar tutor`);
    }
    return res;
  };

  const acceptRequest = async (requestId: number, tutorId: string, tutorName: string | null) => {
    try {
      // Validación: si ya hay tutor asignado, bloquear
      if (hasTutorAssigned) {
        alert('Este grupo ya tiene un tutor asignado. Elimina el actual antes de asignar otro.');
        return;
      }
      setAcceptingId(requestId);
      const token = getAccessToken();

      // 1) Asignar tutor usando el nuevo endpoint /api/groups/{id}/assign-tutor
      const trimmed = String(tutorId ?? '').trim();
      const maybeNum = Number(trimmed);
      const normalizedId: string | number = Number.isFinite(maybeNum) && trimmed !== '' ? maybeNum : trimmed;
      const payload = {
        tutorId: normalizedId,
        tutorName,
        // por compatibilidad
        tutor_id: normalizedId,
        tutor_name: tutorName,
      };
      await assignTutorOnServer(numericGroupId, payload, token);

      // 2. Eliminar la solicitud aceptada
      const deleteRes = await fetch(`http://localhost:8080/api/group-requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!deleteRes.ok) {
        console.warn('No se pudo eliminar la solicitud aceptada');
      }

      alert(`✅ Tutor ${tutorName || tutorId} asignado correctamente`);
      await Promise.all([fetchRequests(), fetchGroup()]); // Recargar lista y estado del grupo
    } catch (e: any) {
      console.error('❌ Error al aceptar solicitud:', e);
      alert(`❌ ${e?.message || 'No se pudo aceptar la solicitud'}`);
    } finally {
      setAcceptingId(null);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericGroupId]);

  if (!numericGroupId) {
    return (
      <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8 flex items-center justify-center" style={{ paddingTop: '5rem' }}>
        <Card className="p-8 text-center">
          <p className="text-white">ID de grupo inválido.</p>
          <div className="mt-4">
            <Link to="/dashboard">
              <Button variant="secondary">Volver</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8 flex items-center justify-center" style={{ paddingTop: '5rem' }}>
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4" />
          <p className="text-white">Cargando solicitudes...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8 flex items-center justify-center" style={{ paddingTop: '5rem' }}>
        <Card className="p-8 text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">Error al cargar</h3>
          <p className="text-neutral-400 mb-4">{error}</p>
          <Button variant="primary" onClick={fetchRequests}>Reintentar</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Solicitudes de Tutor</h1>
          <p className="text-neutral-400">Grupo #{numericGroupId}</p>
          <div className="mt-3">
            {hasTutorAssigned ? (
              <div className="inline-flex items-center gap-2 rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2">
                <span className="text-sm text-neutral-300">Tutor asignado:</span>
                <span className="text-sm font-semibold text-white">
                  {group.tutorName || 'Sin nombre'}
                </span>
                {group.tutorId ? (
                  <span className="text-xs text-neutral-500">
                    (ID: {String(group.tutorId).substring(0, 8)}...)
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="inline-flex items-center rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2">
                <span className="text-sm text-neutral-400">Sin tutor asignado</span>
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => { fetchRequests(); fetchGroup(); }}>Actualizar</Button>
            <Link to="/dashboard">
              <Button variant="secondary">Volver al Dashboard</Button>
            </Link>
          </div>
        </div>

        <Card className="p-0 overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-800">
            <thead className="bg-neutral-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-300 uppercase tracking-wider">Tutor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-300 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-900/40">
                  <td className="px-6 py-4 text-base text-neutral-200 font-medium">{r.id}</td>
                  <td className="px-6 py-4">
                    {(r.tutorName || r.tutor_name) ? (
                      <div>
                        <div className="font-semibold text-white text-base">{r.tutorName || r.tutor_name}</div>
                        <div className="text-sm text-neutral-500 truncate max-w-[250px]" title={r.idTutor}>
                          ID: {String(r.idTutor).substring(0, 8)}...
                        </div>
                      </div>
                    ) : (
                      <span className="text-neutral-400 text-sm break-all">{r.idTutor}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-base text-neutral-300">
                    {(r.createdAt || r.created_at) ? new Date(r.createdAt || r.created_at!).toLocaleString('es-ES') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="primary"
                        onClick={() => openConfirmAccept(r)}
                        disabled={hasTutorAssigned || acceptingId === r.id || deletingId === r.id}
                        className="text-sm px-4 py-2"
                      >
                        {hasTutorAssigned ? 'Tutor ya asignado' : (acceptingId === r.id ? 'Aceptando…' : 'Aceptar')}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => openConfirm(r.id)}
                        disabled={deletingId === r.id || acceptingId === r.id}
                        className="text-sm px-4 py-2"
                      >
                        {deletingId === r.id ? 'Eliminando…' : 'Eliminar'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-neutral-400 text-base">
                    No hay solicitudes para este grupo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Modal eliminar */}
      {confirm.open &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/60" onClick={closeConfirm} />
            <div className="relative w-full max-w-md rounded-lg bg-neutral-900 border border-neutral-700 p-6 shadow-xl text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Eliminar solicitud</h3>
              <p className="text-sm text-neutral-300 mb-6">
                ¿Seguro que deseas eliminar esta solicitud de tutor?
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={closeConfirm}>Cancelar</Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    const id = confirm.id!;
                    closeConfirm();
                    deleteRequest(id);
                  }}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal aceptar */}
      {confirmAccept.open &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/60" onClick={closeConfirmAccept} />
            <div className="relative w-full max-w-md rounded-lg bg-neutral-900 border border-neutral-700 p-6 shadow-xl text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Aceptar solicitud</h3>
              <p className="text-sm text-neutral-300 mb-4">
                ¿Deseas asignar este tutor al grupo?
              </p>
              <div className="bg-neutral-800 rounded-lg p-4 mb-6">
                <p className="text-white font-medium">
                  {confirmAccept.tutorName || 'Tutor sin nombre'}
                </p>
                {confirmAccept.tutorId && String(confirmAccept.tutorId).length > 0 && (
                  <p className="text-xs text-neutral-500 mt-1">
                    ID: {String(confirmAccept.tutorId).substring(0, 12)}...
                  </p>
                )}
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={closeConfirmAccept}>Cancelar</Button>
                <Button
                  variant="primary"
                  disabled={hasTutorAssigned || !confirmAccept.requestId || !confirmAccept.tutorId}
                  onClick={() => {
                    const { requestId, tutorId, tutorName } = confirmAccept;
                    if (hasTutorAssigned) {
                      alert('Este grupo ya tiene un tutor asignado. Elimina el actual antes de asignar otro.');
                      return;
                    }
                    if (!requestId || !tutorId) {
                      alert('Datos incompletos para aceptar la solicitud');
                      return;
                    }
                    closeConfirmAccept();
                    acceptRequest(requestId, tutorId, tutorName);
                  }}
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