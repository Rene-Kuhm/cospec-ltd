import { EstadoReclamo } from '@cospec/shared-types';
import { ESTADO_LABELS } from '@cospec/shared-utils';

const ESTADO_COLORS: Record<EstadoReclamo, string> = {
  [EstadoReclamo.PENDIENTE]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [EstadoReclamo.ASIGNADO]: 'bg-blue-100 text-blue-800 border-blue-200',
  [EstadoReclamo.EN_PROGRESO]: 'bg-orange-100 text-orange-800 border-orange-200',
  [EstadoReclamo.RESUELTO]: 'bg-green-100 text-green-800 border-green-200',
  [EstadoReclamo.CANCELADO]: 'bg-gray-100 text-gray-500 border-gray-200',
};

export function EstadoBadge({ estado }: { estado: EstadoReclamo }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ESTADO_COLORS[estado]}`}
    >
      {ESTADO_LABELS[estado]}
    </span>
  );
}
