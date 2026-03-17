'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  EstadoReclamo,
  Rol,
  type GetCategoriasReclamoResponse,
  type GetOperadoresActivosResponse,
  type GetTecnicosActivosResponse,
  type PrioridadReclamo,
} from '@cospec/shared-types';
import { ESTADO_LABELS, formatFecha } from '@cospec/shared-utils';
import { useReclamos } from '../../hooks/useReclamos';
import { EstadoBadge } from './EstadoBadge';
import { ReclamoAssignmentPanel } from './ReclamoAssignmentPanel';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';
const PAGE_SIZE = 20;
const ESTADO_OPTIONS = Object.values(EstadoReclamo);
const PRIORIDAD_OPTIONS: PrioridadReclamo[] = ['CRITICA', 'ALTA', 'MEDIA', 'BAJA'];
const PRIORIDAD_LABELS: Record<PrioridadReclamo, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  CRITICA: 'Critica',
};

export function ReclamosList() {
  const { data: session } = useSession();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState<PrioridadReclamo | ''>('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroTecnicoId, setFiltroTecnicoId] = useState('');
  const [filtroOperadorId, setFiltroOperadorId] = useState('');
  const [page, setPage] = useState(1);
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [tecnicos, setTecnicos] = useState<GetTecnicosActivosResponse>([]);
  const [operadores, setOperadores] = useState<GetOperadoresActivosResponse>([]);
  const [categorias, setCategorias] = useState<GetCategoriasReclamoResponse>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const canOperateInbox =
    session?.user?.rol === Rol.ADMIN || session?.user?.rol === Rol.OPERADOR;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!session?.accessToken || !canOperateInbox) return;

    let ignore = false;
    const accessToken = session.accessToken;

    async function loadCatalogs() {
      try {
        setCatalogError(null);

        const headers = { Authorization: `Bearer ${accessToken}` };
        const [tecnicosRes, operadoresRes, categoriasRes] = await Promise.all([
          fetch(`${API_BASE}/reclamos/tecnicos/activos`, { headers, cache: 'no-store' }),
          fetch(`${API_BASE}/reclamos/operadores/activos`, { headers, cache: 'no-store' }),
          fetch(`${API_BASE}/reclamos/categorias`, { headers, cache: 'no-store' }),
        ]);

        if (!tecnicosRes.ok || !operadoresRes.ok || !categoriasRes.ok) {
          throw new Error('No se pudieron cargar los catalogos operativos');
        }

        const [tecnicosData, operadoresData, categoriasData] = await Promise.all([
          tecnicosRes.json() as Promise<GetTecnicosActivosResponse>,
          operadoresRes.json() as Promise<GetOperadoresActivosResponse>,
          categoriasRes.json() as Promise<GetCategoriasReclamoResponse>,
        ]);

        if (ignore) return;

        setTecnicos(tecnicosData);
        setOperadores(operadoresData);
        setCategorias(categoriasData);
      } catch (error) {
        if (ignore) return;

        setCatalogError(error instanceof Error ? error.message : 'No se pudieron cargar los catalogos operativos');
      }
    }

    void loadCatalogs();

    return () => {
      ignore = true;
    };
  }, [canOperateInbox, session?.accessToken]);

  useEffect(() => {
    setPage(1);
  }, [search, filtroEstado, filtroPrioridad, filtroCategoria, filtroTecnicoId, filtroOperadorId]);

  const { reclamos, total, stats, isLoading, error, refetch } = useReclamos({
    search: search || undefined,
    estado: filtroEstado || undefined,
    prioridad: filtroPrioridad || undefined,
    categoria: filtroCategoria || undefined,
    tecnicoId: filtroTecnicoId || undefined,
    operadorId: filtroOperadorId || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const resumen = [
    { label: 'Total filtrado', value: total, tone: 'text-slate-50' },
    {
      label: 'Pendientes',
      value: stats[EstadoReclamo.PENDIENTE] ?? 0,
      tone: 'text-amber-200',
    },
    {
      label: 'Asignados',
      value: stats[EstadoReclamo.ASIGNADO] ?? 0,
      tone: 'text-sky-200',
    },
    {
      label: 'En progreso',
      value: stats[EstadoReclamo.EN_PROGRESO] ?? 0,
      tone: 'text-orange-200',
    },
  ];

  const activeFilters = useMemo(
    () => [
      search
        ? { label: `Busqueda: ${search}`, clear: () => setSearchInput('') }
        : null,
      filtroEstado
        ? { label: `Estado: ${ESTADO_LABELS[filtroEstado as EstadoReclamo]}`, clear: () => setFiltroEstado('') }
        : null,
      filtroPrioridad
        ? { label: `Prioridad: ${PRIORIDAD_LABELS[filtroPrioridad]}`, clear: () => setFiltroPrioridad('') }
        : null,
      filtroCategoria
        ? { label: `Categoria: ${filtroCategoria}`, clear: () => setFiltroCategoria('') }
        : null,
      filtroTecnicoId
        ? {
            label: `Tecnico: ${tecnicos.find((item) => item.id === filtroTecnicoId)?.nombre ?? 'Seleccionado'}`,
            clear: () => setFiltroTecnicoId(''),
          }
        : null,
      filtroOperadorId
        ? {
            label: `Operador: ${operadores.find((item) => item.id === filtroOperadorId)?.nombre ?? 'Seleccionado'}`,
            clear: () => setFiltroOperadorId(''),
          }
        : null,
    ].filter((item): item is { label: string; clear: () => void } => Boolean(item)),
    [
      filtroCategoria,
      filtroEstado,
      filtroOperadorId,
      filtroPrioridad,
      filtroTecnicoId,
      operadores,
      search,
      tecnicos,
    ],
  );

  async function handleExport() {
    setExportError(null);

    if (!filtroDesde || !filtroHasta) {
      setExportError('Selecciona un rango de fechas para exportar');
      return;
    }

    if (!session?.accessToken) return;

    setIsExporting(true);

    try {
      const params = new URLSearchParams({
        desde: filtroDesde,
        hasta: filtroHasta,
        ...(filtroEstado && { estado: filtroEstado }),
      });

      const url = `${API_BASE}/reclamos/export?${params}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setExportError(body.message ?? 'Error al exportar. Intenta de nuevo.');
        return;
      }

      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reclamos-${filtroDesde}_a_${filtroHasta}.xlsx`;
      link.click();
    } catch {
      setExportError('Error de red al exportar. Intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  }

  function clearAllFilters() {
    setSearchInput('');
    setFiltroEstado('');
    setFiltroPrioridad('');
    setFiltroCategoria('');
    setFiltroTecnicoId('');
    setFiltroOperadorId('');
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="app-shell-card p-5 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-shell-label">Bandeja operativa</p>
                <p className="mt-2 text-sm text-slate-400">
                  Busca por numero, cliente o telefono. Filtra sin chamuyo y asigna desde la misma fila.
                </p>
              </div>
              <button
                type="button"
                onClick={refetch}
                className="app-shell-button-secondary px-4 py-2 text-xs"
              >
                Actualizar bandeja
              </button>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.5fr_repeat(2,minmax(0,1fr))]">
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="app-shell-input"
                placeholder="Buscar por numero, nombre o telefono"
              />

              <select
                value={filtroEstado}
                onChange={(event) => setFiltroEstado(event.target.value)}
                className="app-shell-input"
              >
                <option value="">Todos los estados</option>
                {ESTADO_OPTIONS.map((estado) => (
                  <option key={estado} value={estado}>
                    {ESTADO_LABELS[estado]}
                  </option>
                ))}
              </select>

              <select
                value={filtroPrioridad}
                onChange={(event) => setFiltroPrioridad(event.target.value as PrioridadReclamo | '')}
                className="app-shell-input"
              >
                <option value="">Todas las prioridades</option>
                {PRIORIDAD_OPTIONS.map((prioridad) => (
                  <option key={prioridad} value={prioridad}>
                    {PRIORIDAD_LABELS[prioridad]}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <select
                value={filtroCategoria}
                onChange={(event) => setFiltroCategoria(event.target.value)}
                className="app-shell-input"
              >
                <option value="">Todas las categorias</option>
                {categorias.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>

              <select
                value={filtroTecnicoId}
                onChange={(event) => setFiltroTecnicoId(event.target.value)}
                className="app-shell-input"
              >
                <option value="">Todos los tecnicos</option>
                {tecnicos.map((tecnico) => (
                  <option key={tecnico.id} value={tecnico.id}>
                    {tecnico.nombre}
                  </option>
                ))}
              </select>

              <select
                value={filtroOperadorId}
                onChange={(event) => setFiltroOperadorId(event.target.value)}
                className="app-shell-input"
              >
                <option value="">Todos los operadores</option>
                {operadores.map((operador) => (
                  <option key={operador.id} value={operador.id}>
                    {operador.nombre} ({operador.rol === Rol.ADMIN ? 'Admin' : 'Operador'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {activeFilters.length === 0 ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                    Sin filtros activos
                  </span>
                ) : (
                  activeFilters.map((filter) => (
                    <button
                      key={filter.label}
                      type="button"
                      onClick={filter.clear}
                      className="rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-xs text-teal-100 transition hover:border-teal-300/40 hover:bg-teal-400/15"
                    >
                      {filter.label} x
                    </button>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={clearAllFilters}
                disabled={activeFilters.length === 0}
                className="text-sm text-slate-400 transition hover:text-slate-200 disabled:cursor-not-allowed disabled:text-slate-600"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {resumen.map((item) => (
            <div key={item.label} className="app-shell-panel p-5">
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className={`mt-3 text-3xl font-semibold ${item.tone}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="app-shell-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="app-shell-label">Exportacion</p>
            <p className="mt-2 text-sm text-slate-400">
              Exporta un periodo con el estado actual aplicado, sin depender de la pagina visible.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
            <input
              type="date"
              value={filtroDesde}
              onChange={(event) => setFiltroDesde(event.target.value)}
              className="app-shell-input"
            />
            <input
              type="date"
              value={filtroHasta}
              onChange={(event) => setFiltroHasta(event.target.value)}
              className="app-shell-input"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Pagina {Math.min(page, totalPages)} de {totalPages} · {total} reclamo{total !== 1 ? 's' : ''} filtrado{total !== 1 ? 's' : ''}.
          </p>
          <button onClick={handleExport} disabled={isExporting} className="app-shell-button whitespace-nowrap">
            {isExporting ? 'Exportando...' : 'Exportar periodo'}
          </button>
        </div>
      </div>

      {catalogError ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
          {catalogError}
        </div>
      ) : null}

      {exportError ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
          {exportError}
        </div>
      ) : null}

      {isLoading ? (
        <div className="app-shell-panel py-12 text-center text-slate-400">Cargando bandeja...</div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {!isLoading && !error ? (
        <>
          <div className="grid gap-4 lg:hidden">
            {reclamos.length === 0 ? (
              <div className="app-shell-panel py-12 text-center text-slate-400">No hay reclamos para esos filtros</div>
            ) : (
              reclamos.map((reclamo) => (
                <article key={reclamo.id} className="app-shell-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
                        {reclamo.numeroReclamo}
                      </p>
                      <h3 className="mt-3 text-lg font-semibold text-slate-50">{reclamo.nombre}</h3>
                    </div>
                    <EstadoBadge estado={reclamo.estado} />
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    <p>{reclamo.telefono}</p>
                    <p className="text-slate-400">Prioridad: {PRIORIDAD_LABELS[reclamo.prioridad]}</p>
                    <p className="text-slate-400">Categoria: {reclamo.categoria ?? 'Sin definir'}</p>
                    <p className="text-slate-400">Tecnico: {reclamo.tecnico?.nombre ?? 'Sin asignar'}</p>
                    <p className="text-slate-400">Operador: {reclamo.operador?.nombre ?? 'Sin registrar'}</p>
                    <p className="text-slate-500">
                      {formatFecha(new Date(reclamo.fechaRecepcion))} · {reclamo.horaRecepcion}
                    </p>
                  </div>

                  {canOperateInbox ? (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                        Asignacion rapida
                      </p>
                      <div className="mt-3">
                        <ReclamoAssignmentPanel
                          reclamoId={reclamo.id}
                          estado={reclamo.estado}
                          tecnicoId={reclamo.tecnicoId}
                          tecnicos={tecnicos}
                          compact
                          onAssigned={refetch}
                        />
                      </div>
                    </div>
                  ) : null}

                  <Link
                    href={`/dashboard/reclamos/${reclamo.id}`}
                    className="app-shell-button-secondary mt-5 w-full"
                  >
                    Ver detalle
                  </Link>
                </article>
              ))
            )}
          </div>

          <div className="hidden overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(10,20,36,0.88)] lg:block">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-4 py-4 text-left font-medium text-slate-400">N°</th>
                  <th className="px-4 py-4 text-left font-medium text-slate-400">Cliente</th>
                  <th className="px-4 py-4 text-left font-medium text-slate-400">Prioridad</th>
                  <th className="px-4 py-4 text-left font-medium text-slate-400">Categoria</th>
                  <th className="px-4 py-4 text-left font-medium text-slate-400">Estado</th>
                  <th className="px-4 py-4 text-left font-medium text-slate-400">Tecnico</th>
                  <th className="px-4 py-4 text-left font-medium text-slate-400">Operador</th>
                  <th className="px-4 py-4 text-left font-medium text-slate-400">Fecha</th>
                  <th className="px-4 py-4 text-left font-medium text-slate-400">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reclamos.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No hay reclamos para esos filtros
                    </td>
                  </tr>
                ) : (
                  reclamos.map((reclamo) => (
                    <tr key={reclamo.id} className="align-top transition-colors hover:bg-white/5">
                      <td className="px-4 py-4 font-mono text-xs text-slate-500">
                        {reclamo.numeroReclamo}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-100">{reclamo.nombre}</div>
                        <div className="text-xs text-slate-500">{reclamo.telefono}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {PRIORIDAD_LABELS[reclamo.prioridad]}
                      </td>
                      <td className="px-4 py-4 text-slate-400">{reclamo.categoria ?? '—'}</td>
                      <td className="px-4 py-4">
                        <EstadoBadge estado={reclamo.estado} />
                      </td>
                      <td className="px-4 py-4 text-slate-400">{reclamo.tecnico?.nombre ?? '—'}</td>
                      <td className="px-4 py-4 text-slate-400">{reclamo.operador?.nombre ?? '—'}</td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {formatFecha(new Date(reclamo.fechaRecepcion))}
                        <div>{reclamo.horaRecepcion}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-3">
                          {canOperateInbox ? (
                            <ReclamoAssignmentPanel
                              reclamoId={reclamo.id}
                              estado={reclamo.estado}
                              tecnicoId={reclamo.tecnicoId}
                              tecnicos={tecnicos}
                              compact
                              onAssigned={refetch}
                            />
                          ) : null}
                          <Link
                            href={`/dashboard/reclamos/${reclamo.id}`}
                            className="block text-xs font-semibold text-teal-300 transition hover:text-teal-200"
                          >
                            Ver detalle →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Mostrando {(page - 1) * PAGE_SIZE + (reclamos.length === 0 ? 0 : 1)}-
              {(page - 1) * PAGE_SIZE + reclamos.length} de {total} reclamos.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="app-shell-button-secondary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                Pagina {Math.min(page, totalPages)} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="app-shell-button-secondary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
