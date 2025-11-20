import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

interface FeedbackItem {
  id: number;
  tutor_id: number;
  student_user_id: string;
  studygroup_id: number | null;
  comment: string | null;
  stars: number;
  created_at: string;
  updated_at: string;
}

interface Summary {
  tutor_id: number;
  count: number;
  average_stars: number;
}

export const TutorFeedbackPage: React.FC = () => {
  const { tutorId } = useParams<{ tutorId: string }>();
  const location = useLocation();
  // leer groupId de query ?groupId=123
  const searchParams = new URLSearchParams(location.search);
  const groupIdParam = searchParams.get('groupId');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [list, setList] = useState<FeedbackItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const getToken = (): string | null => {
    try {
      const raw = localStorage.getItem('sb-zskuikxfcjobpygoueqp-auth-token');
      return raw ? JSON.parse(raw).access_token : null;
    } catch { return null; }
  };

  const headersAuth = () => {
    const token = getToken();
    const h: Record<string, string> = { Accept: 'application/json' };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  const loadSummary = useCallback(async () => {
    if (!tutorId) return;
    try {
      const res = await fetch(`http://localhost:8080/api/feedback/tutors/${tutorId}/summary`, {
        headers: headersAuth()
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {}
  }, [tutorId]);

  const loadList = useCallback(async () => {
    if (!tutorId) return;
    try {
      const res = await fetch(`http://localhost:8080/api/feedback/tutors/${tutorId}`, {
        headers: headersAuth()
      });
      if (res.ok) {
        const data = await res.json();
        setList(Array.isArray(data) ? data : []);
      }
    } catch {
      setList([]);
    }
  }, [tutorId]);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (!tutorId) return;
      setLoading(true);
      await Promise.all([loadSummary(), loadList()]);
      if (alive) setLoading(false);
    };
    run();
    return () => { alive = false; };
  }, [tutorId, loadSummary, loadList]);

  const submit = async () => {
    if (!tutorId) return;
    if (stars < 1 || stars > 5) {
      setError('Selecciona entre 1 y 5 estrellas');
      return;
    }
    setPosting(true);
    setError(null);
    try {
      const payload: any = {
        tutorId: Number(tutorId),
        stars,
        comment: comment.trim() || null
      };
      // si viene groupId lo enviamos como studygroupId
      if (groupIdParam) {
        const gid = Number(groupIdParam);
        if (!Number.isNaN(gid)) {
          payload.studygroupId = gid;
        }
      }
      console.log('[Feedback] Payload →', payload);
      const res = await fetch('http://localhost:8080/api/feedback/tutors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headersAuth() },
        body: JSON.stringify(payload)
      });
      let serverJson: any = null;
      try { serverJson = await res.json(); } catch {}
      console.log('[Feedback] Status:', res.status, 'Response:', serverJson);
      const errText = serverJson?.message || serverJson?.error;
      if (res.status === 401) {
        setError('No autenticado');
      } else if (res.status === 400) {
        setError(errText || 'Validación inválida');
      } else if (!res.ok) {
        setError(errText || 'Error interno');
      } else {
        setStars(0);
        setComment('');
        await loadSummary();
        await loadList();
      }
    } catch {
      setError('Error de red');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black" style={{ paddingTop: '5rem' }}>
        <div className="text-center">
          <div className="h-10 w-10 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-sm">Cargando feedback...</p>
        </div>
      </div>
    );
  }

  if (!tutorId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Falta tutorId
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 pb-24" style={{ paddingTop: '5rem' }}>
      <div className="max-w-5xl mx-auto space-y-10">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Feedback del Tutor #{tutorId}
            {groupIdParam && <span className="ml-2 text-sm text-neutral-400">Grupo #{groupIdParam}</span>}
          </h1>
          {summary && (
            <div className="text-sm text-neutral-300 flex items-center gap-3">
              <span>Reseñas: {summary.count}</span>
              <span>Promedio: {summary.average_stars?.toFixed(2) ?? '0.00'}</span>
            </div>
          )}
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Tu reseña</h2>
          {!user && (
            <p className="text-neutral-400 text-sm mb-4">Inicia sesión para dejar feedback.</p>
          )}
          {user && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1 text-neutral-400">Estrellas</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setStars(n)}
                      className={`text-2xl ${stars >= n ? 'text-yellow-400' : 'text-neutral-700'} hover:text-yellow-300 transition`}
                      aria-label={`Estrellas ${n}`}
                    >★</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1 text-neutral-400">Comentario (opcional)</label>
                <textarea
                  className="input-custom w-full h-28 rounded-2xl"
                  maxLength={1000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Escribe tu feedback..."
                />
                <div className="text-[11px] text-neutral-500 mt-1">{comment.length}/1000</div>
              </div>
              {error && <div className="text-sm text-red-400">{error}</div>}
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={submit}
                  disabled={posting}
                  className="px-6 py-2"
                >
                  {posting ? 'Enviando...' : 'Enviar feedback'}
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Reseñas recientes</h2>
          {list.length === 0 ? (
            <p className="text-neutral-500 text-sm">Sin reseñas aún.</p>
          ) : (
            <div className="space-y-4">
              {list.map(f => (
                <div
                  key={f.id}
                  className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/40"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-yellow-400 text-sm">
                      {'★'.repeat(f.stars)}{'☆'.repeat(5 - f.stars)}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      {new Date(f.created_at).toLocaleString('es-ES')}
                    </div>
                  </div>
                  <div className="text-sm text-neutral-300 whitespace-pre-wrap">
                    {f.comment || 'Sin comentario'}
                  </div>
                  {f.studygroup_id && (
                    <div className="mt-2 text-[11px] text-neutral-500">
                      Grupo: {f.studygroup_id}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}