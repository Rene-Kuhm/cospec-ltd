import { auth } from '@/auth';

const API_BASE = process.env['API_URL'] ?? 'http://localhost:3001/api/v1';

const STATS_CONFIG = [
  { key: 'PENDIENTE', label: 'Pendientes', color: 'text-yellow-600' },
  { key: 'ASIGNADO', label: 'Asignados', color: 'text-blue-600' },
  { key: 'EN_PROGRESO', label: 'En progreso', color: 'text-orange-600' },
  { key: 'RESUELTO', label: 'Resueltos', color: 'text-green-600' },
];

async function getStats(token: string): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${API_BASE}/reclamos/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 30 },
    });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

export default async function DashboardPage() {
  const session: any = await auth();
  const stats = session?.accessToken ? await getStats(session.accessToken) : {};

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        Bienvenido, {session?.user?.name ?? 'Usuario'}
      </h1>
      <p className="text-slate-500 mb-8">Panel de gestión de reclamos — COSPEC LTD</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {STATS_CONFIG.map(({ key, label, color }) => (
          <div key={key} className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>
              {stats[key] ?? 0}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
