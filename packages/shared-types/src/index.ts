// ============================================================
// COSPEC LTD — Shared TypeScript Types
// Source of truth for all domain entities
// ============================================================

export enum Rol {
  ADMIN = 'ADMIN',
  OPERADOR = 'OPERADOR',
  TECNICO = 'TECNICO',
}

export enum EstadoReclamo {
  PENDIENTE = 'PENDIENTE',
  ASIGNADO = 'ASIGNADO',
  EN_PROGRESO = 'EN_PROGRESO',
  RESUELTO = 'RESUELTO',
  CANCELADO = 'CANCELADO',
}

export enum ServicioAfectado {
  FIBRA_OPTICA = 'FIBRA_OPTICA',
  ADSL = 'ADSL',
  TELEFONIA = 'TELEFONIA',
  TV_SENSA = 'TV_SENSA',
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialUsado {
  id: string;
  reclamoId: string;
  descripcion: string;
  cantidad: number;
}

export type ReclamoUsuarioRef = Pick<Usuario, 'id' | 'nombre'> & {
  email?: string;
};

export type ReclamoDateValue = Date | string;

export type ReclamoListadoUsuarioRef = Pick<ReclamoUsuarioRef, 'id' | 'nombre'>;

export interface ReclamoResumen {
  id: string;
  numeroReclamo: string;
  telefono: string;
  nombre: string;
  direccion: string;
  motivo: string;
  servicioAfectado: ServicioAfectado;
  estado: EstadoReclamo;
  fechaRecepcion: ReclamoDateValue;
  horaRecepcion: string;
  operadorId: string;
  operador?: ReclamoListadoUsuarioRef | null;
  tecnicoId?: string | null;
  tecnico?: ReclamoListadoUsuarioRef | null;
  fechaAsignacion?: ReclamoDateValue | null;
  fechaAtencion?: ReclamoDateValue | null;
  horaAtencion?: string | null;
  fallaEncontrada?: string | null;
  createdAt: ReclamoDateValue;
  updatedAt: ReclamoDateValue;
}

// DTOs for API communication
export interface CreateReclamoDto {
  telefono: string;
  nombre: string;
  direccion: string;
  motivo: string;
  servicioAfectado: ServicioAfectado;
  horaRecepcion?: string;
}

export interface UpdateReclamoDto {
  estado?: EstadoReclamo;
  tecnicoId?: string;
  fallaEncontrada?: string;
  horaAtencion?: string;
}

export interface AddMaterialDto {
  descripcion: string;
  cantidad: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: Omit<Usuario, 'createdAt' | 'updatedAt'>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type ReclamoMutacionBase = Omit<ReclamoResumen, 'operador' | 'tecnico'>;

export type GetReclamosResponse = PaginatedResponse<ReclamoResumen>;

export type GetReclamosStatsResponse = Partial<Record<EstadoReclamo, number>>;

export interface ExportFilter {
  desde: Date;
  hasta: Date;
  tipo: 'semana' | 'mes';
}

export interface ReclamoDetalle extends Omit<ReclamoResumen, 'operador' | 'tecnico'> {
  operador: ReclamoUsuarioRef;
  tecnico?: ReclamoUsuarioRef | null;
  materiales: MaterialUsado[];
}

export type GetReclamoDetalleResponse = ReclamoDetalle;

export type CreateReclamoResponse = ReclamoDetalle;

export interface AsignarReclamoResponse extends ReclamoMutacionBase {
  tecnico: ReclamoListadoUsuarioRef;
  materiales: MaterialUsado[];
}

export type UpdateReclamoResponse = ReclamoMutacionBase;

export interface ResolverReclamoResponse extends ReclamoMutacionBase {
  materiales: MaterialUsado[];
}

export type CancelReclamoResponse = ReclamoMutacionBase;

export type AddMaterialResponse = MaterialUsado;
