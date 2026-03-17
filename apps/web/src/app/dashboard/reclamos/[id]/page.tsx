import Link from 'next/link';
import { notFound } from 'next/navigation';
import type {
  GetReclamoChatResponse,
  GetReclamoDetalleResponse,
  GetReclamoTimelineResponse,
  GetTecnicosActivosResponse,
} from '@cospec/shared-types';
import { auth } from '@/auth';
import { ReclamoDetail } from '../../../../components/reclamos/ReclamoDetail';

const API_BASE = process.env['API_URL'] ?? 'http://localhost:3001/api/v1';

async function getReclamo(id: string, token: string): Promise<GetReclamoDetalleResponse | null> {
  const res = await fetch(`${API_BASE}/reclamos/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Error al cargar reclamo');
  return res.json() as Promise<GetReclamoDetalleResponse>;
}

async function getTecnicosActivos(token: string): Promise<GetTecnicosActivosResponse> {
  const res = await fetch(`${API_BASE}/reclamos/tecnicos/activos`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Error al cargar tecnicos');

  return res.json() as Promise<GetTecnicosActivosResponse>;
}

async function getTimeline(id: string, token: string): Promise<GetReclamoTimelineResponse> {
  const res = await fetch(`${API_BASE}/reclamos/${id}/timeline`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Error al cargar timeline');

  return res.json() as Promise<GetReclamoTimelineResponse>;
}

async function getChat(id: string, token: string): Promise<GetReclamoChatResponse> {
  const res = await fetch(`${API_BASE}/reclamos/${id}/chat`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Error al cargar chat');

  return res.json() as Promise<GetReclamoChatResponse>;
}

export default async function ReclamoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) return notFound();

  const token = session.accessToken ?? '';
  const [reclamo, tecnicos, timeline, chat] = await Promise.all([
    getReclamo(id, token),
    getTecnicosActivos(token),
    getTimeline(id, token),
    getChat(id, token),
  ]);
  if (!reclamo) return notFound();

  return (
    <div className="space-y-6">
      <div className="app-shell-card p-6">
        <Link
          href="/dashboard/reclamos"
          className="text-sm text-slate-400 transition hover:text-slate-200"
        >
          ← Volver a reclamos
        </Link>
        <p className="app-shell-label mt-5">Trazabilidad</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">Detalle del reclamo</h1>
      </div>
      <ReclamoDetail
        reclamo={reclamo}
        tecnicos={tecnicos}
        timeline={timeline}
        chat={chat}
        currentUserId={session.user.id}
      />
    </div>
  );
}
