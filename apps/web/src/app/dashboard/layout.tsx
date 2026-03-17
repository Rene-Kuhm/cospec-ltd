import { auth, signOut } from '@/auth';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <nav className="app-shell-card px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
              <div>
                <p className="app-shell-label">COSPEC LTD</p>
                <p className="mt-2 text-lg font-semibold text-slate-50">Centro de reclamos</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard" className="app-shell-button-ghost rounded-full border border-white/10 px-4 py-2">
                  Dashboard
                </Link>
                <Link href="/dashboard/reclamos" className="app-shell-button-ghost rounded-full border border-white/10 px-4 py-2">
                  Reclamos
                </Link>
                <Link href="/dashboard/reclamos/nuevo" className="app-shell-button-ghost rounded-full border border-white/10 px-4 py-2">
                  Alta rapida
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
              <NotificationsBell />
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <p className="font-medium text-slate-100">{session.user?.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-teal-300">
                  {session.user?.rol ?? 'USER'}
                </p>
              </div>
              <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
                <button type="submit" className="app-shell-button-secondary w-full sm:w-auto">
                  Cerrar sesion
                </button>
              </form>
            </div>
          </div>
        </nav>

        <main className="pb-8">{children}</main>
      </div>
    </div>
  );
}
