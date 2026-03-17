import type { ReclamoResumen } from '@cospec/shared-types';
import Link from 'next/link';

// Type assertion to verify cross-workspace resolution
type _ReclamoCheck = ReclamoResumen;

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 lg:px-10">
      <section className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="app-shell-card relative overflow-hidden p-8 lg:p-12">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-sky-400 to-blue-500" />
          <div className="mb-8 flex items-center gap-3 text-sm font-medium text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">COSPEC LTD</span>
            <span className="app-shell-soft">Centro operativo de reclamos</span>
          </div>
          <div className="max-w-2xl space-y-6">
            <div className="space-y-4">
              <p className="app-shell-label">Gestion tecnica con criterio operativo</p>
              <h1 className="text-4xl font-semibold text-slate-50 lg:text-6xl">
                Una interfaz que parece producto serio, no demo improvisada.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-300 lg:text-lg">
                Seguimiento, resolucion y lectura de carga en tiempo real para operadores y administradores.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Operacion', 'Dashboard con foco en estados, volumen y accion inmediata.'],
                ['Control', 'Listado filtrable y exportacion con affordance clara.'],
                ['Trazabilidad', 'Detalle y alta con mejor jerarquia visual y contexto.'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-slate-100">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/login" className="app-shell-button">
                Ingresar al centro operativo
              </Link>
              <Link href="/dashboard" className="app-shell-button-secondary">
                Ver dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="app-shell-card p-6 lg:p-8">
            <p className="app-shell-label">Panorama</p>
            <div className="mt-4 space-y-4">
              {[
                ['01', 'Mesa de control', 'Shell sobrio, tecnico y consistente en todas las vistas.'],
                ['02', 'Carga operativa', 'Tarjetas y tablas con mejor lectura de densidad.'],
                ['03', 'Accion guiada', 'Formularios y detalles con pasos, contexto y estados.'],
              ].map(([index, title, description]) => (
                <div key={index} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <span className="font-mono text-xs text-teal-300">{index}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="app-shell-panel p-6">
            <p className="app-shell-label">Enfoque visual</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Direccion oscura, tecnica y operativa. Contraste controlado, acentos turquesa y azul industrial, tipografia con presencia y componentes con profundidad util.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
