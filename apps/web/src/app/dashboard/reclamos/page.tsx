import Link from 'next/link';
import { ReclamosList } from '../../../components/reclamos/ReclamosList';

export default function ReclamosPage() {
  return (
    <div className="space-y-6">
      <div className="app-shell-card flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="app-shell-label">Operacion</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-50">Reclamos</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Bandeja para buscar, filtrar y asignar reclamos sin perder tiempo entrando al detalle.</p>
        </div>
        <Link
          href="/dashboard/reclamos/nuevo"
          className="app-shell-button"
        >
          Nuevo reclamo
        </Link>
      </div>
      <ReclamosList />
    </div>
  );
}
