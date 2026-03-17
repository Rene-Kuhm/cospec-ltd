'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { EstadoReclamo, ServicioAfectado } from '@cospec/shared-types';
import { SERVICIO_LABELS, formatFecha } from '@cospec/shared-utils';
import { useReclamos } from '../../hooks/useReclamos';
import { EstadoBadge } from './EstadoBadge';

export function ReclamosList() {
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroServicio, setFiltroServicio] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const { data: session } = useSession();

  const { reclamos, total, isLoading, error } = useReclamos({
    estado: filtroEstado || undefined,
    servicioAfectado: filtroServicio || undefined,
    desde: filtroDesde || undefined,
    hasta: filtroHasta || undefined,
  });

  async function handleExport() {
    setExportError(null);

    if (!filtroDesde || !filtroHasta) {
      setExportError('Seleccioná un rango de fechas para exportar');
      return;
    }
    if (!session?.accessToken) return;

    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        desde: filtroDesde,
        hasta: filtroHasta,
        ...(filtroEstado && { estado: filtroEstado }),
        ...(filtroServicio && { servicioAfectado: filtroServicio }),
      });

      const url = `${process.env['NEXT_PUBLIC_API_URL']}/reclamos/export?${params}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        setExportError(body.message ?? 'Error al exportar. Intentá de nuevo.');
        return;
      }

      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reclamos-${filtroDesde}_a_${filtroHasta}.xlsx`;
      link.click();
    } catch {
      setExportError('Error de red al exportar. Intentá de nuevo.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl border border-slate-200 p-4">
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          {Object.values(EstadoReclamo).map((e) => (
            <option key={e} value={e}>{e.replace('_', ' ')}</option>
          ))}
        </select>

        <select
          value={filtroServicio}
          onChange={(e) => setFiltroServicio(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los servicios</option>
          {Object.values(ServicioAfectado).map((s) => (
            <option key={s} value={s}>{SERVICIO_LABELS[s]}</option>
          ))}
        </select>

        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={filtroDesde}
            onChange={(e) => setFiltroDesde(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Desde"
          />
          <input
            type="date"
            value={filtroHasta}
            onChange={(e) => setFiltroHasta(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Hasta"
          />
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors whitespace-nowrap"
          >
            {isExporting ? 'Exportando...' : 'Exportar'}
          </button>
        </div>

        <span className="text-sm text-slate-400 self-center ml-auto">
          {total} reclamo{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Error de exportación */}
      {exportError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {exportError}
        </div>
      )}

      {/* Estado */}
      {isLoading && (
        <div className="text-center py-12 text-slate-400">Cargando...</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Tabla */}
      {!isLoading && !error && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">N°</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Servicio</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Técnico</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Fecha</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reclamos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No hay reclamos
                  </td>
                </tr>
              ) : (
                reclamos.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {r.numeroReclamo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{r.nombre}</div>
                      <div className="text-slate-400 text-xs">{r.telefono}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {SERVICIO_LABELS[r.servicioAfectado]}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={r.estado} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {r.tecnico?.nombre ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {formatFecha(new Date(r.fechaRecepcion))}
                      <div>{r.horaRecepcion}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/reclamos/${r.id}`}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
