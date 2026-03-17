import Link from 'next/link';
import { ReclamoForm } from '../../../../components/reclamos/ReclamoForm';

export default function NuevoReclamoPage() {
  return (
    <div className="space-y-6">
      <div className="app-shell-card p-6">
        <Link
          href="/dashboard/reclamos"
          className="text-sm text-slate-400 transition hover:text-slate-200"
        >
          ← Volver a reclamos
        </Link>
        <p className="app-shell-label mt-5">Alta de caso</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">Nuevo reclamo</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Carga guiada para registrar el caso con datos minimos y buena trazabilidad.</p>
      </div>
      <ReclamoForm />
    </div>
  );
}
