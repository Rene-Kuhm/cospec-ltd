import type { ReclamoResumen } from '@cospec/shared-types';

// Type assertion to verify cross-workspace resolution
type _ReclamoCheck = ReclamoResumen;

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">
          COSPEC LTD
        </h1>
        <p className="text-slate-500 text-lg">Sistema de Gestión de Reclamos</p>
        <p className="mt-6 text-sm text-slate-400">
          Panel administrativo — próximamente
        </p>
      </div>
    </main>
  );
}
