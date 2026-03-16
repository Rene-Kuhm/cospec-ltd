import { EstadoReclamo, ServicioAfectado } from '@cospec/shared-types';

// Estado labels for UI display
export const ESTADO_LABELS: Record<EstadoReclamo, string> = {
  [EstadoReclamo.PENDIENTE]: 'Pendiente',
  [EstadoReclamo.ASIGNADO]: 'Asignado',
  [EstadoReclamo.EN_PROGRESO]: 'En progreso',
  [EstadoReclamo.RESUELTO]: 'Resuelto',
  [EstadoReclamo.CANCELADO]: 'Cancelado',
};

// Servicio labels for UI display
export const SERVICIO_LABELS: Record<ServicioAfectado, string> = {
  [ServicioAfectado.FIBRA_OPTICA]: 'Internet Fibra Óptica',
  [ServicioAfectado.ADSL]: 'Internet ADSL',
  [ServicioAfectado.TELEFONIA]: 'Telefonía Línea Fija',
  [ServicioAfectado.TV_SENSA]: 'TV Sensa',
};

// Format date to DD/MM/YYYY
export function formatFecha(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

// Format time to HH:mm
export function formatHora(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

// Get week range (Monday to Sunday) for a given date
export function getWeekRange(date: Date): { desde: Date; hasta: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const desde = new Date(d.setDate(diff));
  desde.setHours(0, 0, 0, 0);
  const hasta = new Date(desde);
  hasta.setDate(desde.getDate() + 6);
  hasta.setHours(23, 59, 59, 999);
  return { desde, hasta };
}

// Get month range for a given date
export function getMonthRange(date: Date): { desde: Date; hasta: Date } {
  const desde = new Date(date.getFullYear(), date.getMonth(), 1);
  desde.setHours(0, 0, 0, 0);
  const hasta = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  hasta.setHours(23, 59, 59, 999);
  return { desde, hasta };
}

// Check if a reclamo state transition is valid
export function isValidTransition(
  from: EstadoReclamo,
  to: EstadoReclamo
): boolean {
  const transitions: Record<EstadoReclamo, EstadoReclamo[]> = {
    [EstadoReclamo.PENDIENTE]: [EstadoReclamo.ASIGNADO, EstadoReclamo.CANCELADO],
    [EstadoReclamo.ASIGNADO]: [EstadoReclamo.EN_PROGRESO, EstadoReclamo.CANCELADO, EstadoReclamo.PENDIENTE],
    [EstadoReclamo.EN_PROGRESO]: [EstadoReclamo.RESUELTO, EstadoReclamo.CANCELADO],
    [EstadoReclamo.RESUELTO]: [],
    [EstadoReclamo.CANCELADO]: [],
  };
  return transitions[from]?.includes(to) ?? false;
}
