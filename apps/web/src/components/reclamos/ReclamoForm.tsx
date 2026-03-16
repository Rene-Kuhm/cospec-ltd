'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ServicioAfectado } from '@cospec/shared-types';
import { SERVICIO_LABELS } from '@cospec/shared-utils';
import { useSession } from 'next-auth/react';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

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
    const dto = {
      telefono: form.get('telefono') as string,
      nombre: form.get('nombre') as string,
      direccion: form.get('direccion') as string,
      motivo: form.get('motivo') as string,
      servicioAfectado: form.get('servicioAfectado') as ServicioAfectado,
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

      router.push('/dashboard/reclamos');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear reclamo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Teléfono <span className="text-red-500">*</span>
          </label>
          <input
            name="telefono"
            type="tel"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Hora recepción
          </label>
          <input
            name="horaRecepcion"
            type="time"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nombre del cliente <span className="text-red-500">*</span>
        </label>
        <input
          name="nombre"
          type="text"
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Dirección <span className="text-red-500">*</span>
        </label>
        <input
          name="direccion"
          type="text"
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Servicio afectado <span className="text-red-500">*</span>
        </label>
        <select
          name="servicioAfectado"
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Seleccioná un servicio</option>
          {Object.values(ServicioAfectado).map((s) => (
            <option key={s} value={s}>{SERVICIO_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Motivo del reclamo <span className="text-red-500">*</span>
        </label>
        <textarea
          name="motivo"
          required
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          placeholder="Describí el problema reportado por el cliente..."
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Guardando...' : 'Crear reclamo'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-slate-600 hover:text-slate-800 font-medium py-2 px-4 text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
