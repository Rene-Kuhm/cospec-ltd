'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { EstadoReclamo, TecnicoActivo } from '@cospec/shared-types';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

interface ReclamoAssignmentPanelProps {
  reclamoId: string;
  estado: EstadoReclamo;
  tecnicoId?: string | null;
  tecnicos: TecnicoActivo[];
  compact?: boolean;
  onAssigned?: () => void | Promise<void>;
}

export function ReclamoAssignmentPanel({
  reclamoId,
  estado,
  tecnicoId,
  tecnicos,
  compact = false,
  onAssigned,
}: ReclamoAssignmentPanelProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedTecnicoId, setSelectedTecnicoId] = useState(tecnicoId ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLocked = estado === 'RESUELTO' || estado === 'CANCELADO';
  const hasChanged = selectedTecnicoId !== (tecnicoId ?? '');

  useEffect(() => {
    setSelectedTecnicoId(tecnicoId ?? '');
  }, [tecnicoId]);

  async function handleAssign() {
    if (!selectedTecnicoId || !session?.accessToken || !hasChanged) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/reclamos/${reclamoId}/asignacion`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ tecnicoId: selectedTecnicoId }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? 'No se pudo actualizar la asignacion');
      }

      await onAssigned?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la asignacion');
    } finally {
      setIsSubmitting(false);
    }
  }

  const content = (
    <>
      <select
        value={selectedTecnicoId}
        onChange={(event) => setSelectedTecnicoId(event.target.value)}
        disabled={isLocked || tecnicos.length === 0 || isSubmitting}
        className="app-shell-input"
      >
        <option value="">Selecciona un tecnico activo</option>
        {tecnicos.map((tecnico) => (
          <option key={tecnico.id} value={tecnico.id}>
            {tecnico.nombre}
          </option>
        ))}
      </select>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleAssign}
        disabled={isLocked || !selectedTecnicoId || !hasChanged || isSubmitting}
        className={compact ? 'app-shell-button-secondary min-w-[144px] px-4 py-2 text-xs' : 'app-shell-button w-full'}
      >
        {isSubmitting ? 'Guardando...' : tecnicoId ? 'Reasignar tecnico' : 'Asignar tecnico'}
      </button>
    </>
  );

  if (compact) {
    return <div className="space-y-2">{content}</div>;
  }

  return (
    <div className="app-shell-panel p-5">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
            Asignacion operativa
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Deriva o reasigna el caso sin mezclarlo con la toma del tecnico en mobile.
          </p>
        </div>

        {content}
      </div>
    </div>
  );
}
