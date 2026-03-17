import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { GetReclamoDetalleResponse } from '@cospec/shared-types';
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

export default async function ReclamoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) return notFound();

  const reclamo = await getReclamo(id, session.accessToken ?? '');
  if (!reclamo) return notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/reclamos"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Volver a reclamos
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Detalle del reclamo</h1>
      </div>
      <ReclamoDetail reclamo={reclamo} />
    </div>
  );
}
