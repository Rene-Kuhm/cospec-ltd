import { auth } from '@/auth';
import { EstadoReclamo, type GetReclamosStatsResponse } from '@cospec/shared-types';

const API_BASE = process.env['API_URL'] ?? 'http://localhost:3001/api/v1';

const STATS_CONFIG = [
  { key: EstadoReclamo.PENDIENTE, label: 'Pendientes', color: 'text-yellow-600' },
  { key: EstadoReclamo.ASIGNADO, label: 'Asignados', color: 'text-blue-600' },
  { key: EstadoReclamo.EN_PROGRESO, label: 'En progreso', color: 'text-orange-600' },
  { key: EstadoReclamo.RESUELTO, label: 'Resueltos', color: 'text-green-600' },
];

async function getStats(token: string): Promise<GetReclamosStatsResponse> {
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
  const session = await auth();
  const stats = session?.accessToken ? await getStats(session.accessToken) : {};
  const total = STATS_CONFIG.reduce((acc, item) => acc + (stats[item.key] ?? 0), 0);

  return (
    <div className="space-y-6">
      <section className="app-shell-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="app-shell-label">Resumen operativo</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-50 sm:text-4xl">
              Bienvenido, {session?.user?.name ?? 'Usuario'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Panel central para visualizar carga, distribuir trabajo y seguir la resolucion de reclamos sin ruido visual.
            </p>
          </div>

          <div className="grid min-w-[240px] gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="app-shell-label">Total visible</p>
              <p className="mt-3 text-3xl font-semibold text-slate-50">{total}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="app-shell-label">Foco sugerido</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {stats[EstadoReclamo.PENDIENTE] ?? 0} pendientes para asignar y {stats[EstadoReclamo.EN_PROGRESO] ?? 0} en curso.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STATS_CONFIG.map(({ key, label, color }) => (
          <div key={key} className="app-shell-panel p-5">
            <p className="text-sm text-slate-400">{label}</p>
            <p className={`mt-4 text-4xl font-semibold ${color}`}>
              {stats[key] ?? 0}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="app-shell-panel p-6">
          <p className="app-shell-label">Lectura del turno</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ['Asignacion', 'Derivar rapido reclamos nuevos a tecnicos disponibles.'],
              ['Seguimiento', 'Detectar casos estancados y volver a priorizar.'],
              ['Cierre', 'Consolidar datos de resolucion y exportar periodos.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-slate-100">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="app-shell-panel p-6">
          <p className="app-shell-label">Estado del sistema</p>
          <div className="mt-5 space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Exportaciones y filtros viven en la vista de reclamos para bajar friccion operativa.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              El detalle concentra servicio, contexto, tecnico y materiales en un solo flujo.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
