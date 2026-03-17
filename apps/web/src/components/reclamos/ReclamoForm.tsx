'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  CreateReclamoDto,
  CreateReclamoResponse,
  PrioridadReclamo,
} from '@cospec/shared-types';
import { ServicioAfectado } from '@cospec/shared-types';
import { SERVICIO_LABELS } from '@cospec/shared-utils';
import { useSession } from 'next-auth/react';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';
const PRIORIDAD_OPTIONS: PrioridadReclamo[] = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
const PRIORIDAD_LABELS: Record<PrioridadReclamo, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  CRITICA: 'Critica',
};

export function ReclamoForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const dto: CreateReclamoDto = {
      telefono: form.get('telefono') as string,
      nombre: form.get('nombre') as string,
      direccion: form.get('direccion') as string,
      motivo: form.get('motivo') as string,
      servicioAfectado: form.get('servicioAfectado') as ServicioAfectado,
      prioridad: (form.get('prioridad') as PrioridadReclamo) || undefined,
      categoria: (form.get('categoria') as string) || undefined,
      subcategoria: (form.get('subcategoria') as string) || undefined,
      horaRecepcion: form.get('horaRecepcion') as string || undefined,
    };

    try {
      const res = await fetch(`${API_BASE}/reclamos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken ?? ''}`,
        },
        body: JSON.stringify(dto),
      });

      if (!res.ok) {
        const err = await res.json() as { message?: string };
        throw new Error(err.message ?? 'Error al crear reclamo');
      }

      await res.json() as CreateReclamoResponse;

      router.push('/dashboard/reclamos');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear reclamo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <section className="app-shell-card p-6">
          <p className="app-shell-label">Contacto</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Telefono" required>
              <input name="telefono" type="tel" required className="app-shell-input" placeholder="299 555 1234" />
            </Field>
            <Field label="Hora de recepcion">
              <input name="horaRecepcion" type="time" className="app-shell-input" />
            </Field>
          </div>

          <div className="mt-4 grid gap-4">
            <Field label="Nombre del cliente" required>
              <input name="nombre" type="text" required className="app-shell-input" placeholder="Nombre y apellido" />
            </Field>
            <Field label="Direccion" required>
              <input name="direccion" type="text" required className="app-shell-input" placeholder="Calle, altura y referencias" />
            </Field>
          </div>
        </section>

        <section className="app-shell-card p-6">
          <p className="app-shell-label">Incidente</p>
          <div className="mt-5 grid gap-4">
            <Field label="Servicio afectado" required>
              <select name="servicioAfectado" required className="app-shell-input">
                <option value="">Selecciona un servicio</option>
                {Object.values(ServicioAfectado).map((s) => (
                  <option key={s} value={s}>{SERVICIO_LABELS[s]}</option>
                ))}
              </select>
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Prioridad">
                <select name="prioridad" defaultValue="MEDIA" className="app-shell-input">
                  {PRIORIDAD_OPTIONS.map((prioridad) => (
                    <option key={prioridad} value={prioridad}>
                      {PRIORIDAD_LABELS[prioridad]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Categoria">
                <input name="categoria" type="text" className="app-shell-input" placeholder="Ej. Conectividad" />
              </Field>
              <Field label="Subcategoria">
                <input name="subcategoria" type="text" className="app-shell-input" placeholder="Ej. Sin senal" />
              </Field>
            </div>

            <Field label="Motivo del reclamo" required>
              <textarea
                name="motivo"
                required
                rows={5}
                className="app-shell-input resize-none"
                placeholder="Describe el problema reportado, sintomas y contexto relevante."
              />
            </Field>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <aside className="app-shell-card p-6">
          <p className="app-shell-label">Guia de carga</p>
          <div className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
            <p>Prioriza datos de contacto y una descripcion concreta del problema.</p>
            <p>Cuanto mejor entra el reclamo, menos rebote operativo genera despues.</p>
          </div>
        </aside>

        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="app-shell-card p-6">
          <div className="flex flex-col gap-3">
            <button type="submit" disabled={loading} className="app-shell-button w-full">
              {loading ? 'Guardando...' : 'Crear reclamo'}
            </button>
            <button type="button" onClick={() => router.back()} className="app-shell-button-secondary w-full">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">
        {label}
        {required ? <span className="ml-1 text-red-300">*</span> : null}
      </span>
      {children}
    </label>
  );
}
