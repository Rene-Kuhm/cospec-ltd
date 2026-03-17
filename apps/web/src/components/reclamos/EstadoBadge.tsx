import { EstadoReclamo } from '@cospec/shared-types';
import { ESTADO_LABELS } from '@cospec/shared-utils';

const ESTADO_COLORS: Record<EstadoReclamo, string> = {
  [EstadoReclamo.PENDIENTE]: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  [EstadoReclamo.ASIGNADO]: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
  [EstadoReclamo.EN_PROGRESO]: 'border-orange-400/20 bg-orange-400/10 text-orange-200',
  [EstadoReclamo.RESUELTO]: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  [EstadoReclamo.CANCELADO]: 'border-slate-400/20 bg-slate-400/10 text-slate-300',
};

export function EstadoBadge({ estado }: { estado: EstadoReclamo }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${ESTADO_COLORS[estado]}`}
    >
      {ESTADO_LABELS[estado]}
    </span>
  );
}
