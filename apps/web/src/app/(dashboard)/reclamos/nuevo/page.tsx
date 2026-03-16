import Link from 'next/link';
import { ReclamoForm } from '../../../../components/reclamos/ReclamoForm';

export default function NuevoReclamoPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/reclamos"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Volver a reclamos
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Nuevo reclamo</h1>
        <p className="text-slate-500 text-sm mt-1">Registrá un reclamo técnico</p>
      </div>
      <ReclamoForm />
    </div>
  );
}
