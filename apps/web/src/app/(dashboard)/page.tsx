import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        Bienvenido, {session?.user.name}
      </h1>
      <p className="text-slate-500">
        Panel de gestión de reclamos — COSPEC LTD
      </p>

      {/* Stats placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        {['Pendientes', 'Asignados', 'En Progreso', 'Resueltos'].map((estado) => (
          <div
            key={estado}
            className="bg-white rounded-xl border border-slate-200 p-6"
          >
            <p className="text-sm text-slate-500">{estado}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
