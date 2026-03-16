import Link from 'next/link';
import { ReclamosList } from '../../../components/reclamos/ReclamosList';

export default function ReclamosPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reclamos</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión de reclamos técnicos</p>
        </div>
        <Link
          href="/dashboard/reclamos/nuevo"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          + Nuevo reclamo
        </Link>
      </div>
      <ReclamosList />
    </div>
  );
}
