'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const accessError = searchParams.get('error');
  const accessErrorMessage = accessError === 'role-denied'
    ? 'Este acceso web es solo para administradores y operadores.'
    : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(
        result.error === 'AccessDenied'
          ? 'Este acceso web es solo para administradores y operadores.'
          : 'Email o contraseña incorrectos',
      );
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10 lg:px-10">
      <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="app-shell-card hidden overflow-hidden p-8 lg:flex lg:flex-col lg:justify-between lg:p-10">
          <div>
            <p className="app-shell-label">Acceso administrativo</p>
            <h1 className="mt-4 text-4xl font-semibold text-slate-50">
              Centro de control para reclamos, asignaciones y seguimiento.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
              Vista pensada para operacion diaria: carga clara, estados legibles y decisiones rapidas.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              'Monitoreo de estados con lectura instantanea.',
              'Historial y detalle operativo con mejor jerarquia.',
              'Alta de reclamos guiada para bajar friccion y errores.',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="app-shell-card w-full max-w-xl p-7 sm:p-8 lg:ml-auto">
          <div className="mb-8">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
              COSPEC LTD
            </div>
            <h2 className="mt-5 text-3xl font-semibold text-slate-50">Ingresar al sistema</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Acceso habilitado solo para administradores y operadores web.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
                Email corporativo
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="app-shell-input"
                placeholder="admin@cospec.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="app-shell-input"
                placeholder="••••••••"
              />
            </div>

            {(error ?? accessErrorMessage) && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error ?? accessErrorMessage}
              </div>
            )}

            <button type="submit" disabled={loading} className="app-shell-button w-full">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
            Recomendacion: usalo desde escritorio para administrar volumen, exportaciones y seguimiento completo.
          </div>
        </div>
      </div>
    </div>
  );
}
