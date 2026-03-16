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

export interface Reclamo {
  id: string;
  // Datos del cliente
  telefono: string;
  nombre: string;
  direccion: string;
  motivo: string;
  servicioAfectado: ServicioAfectado;
  // Control de estado
  estado: EstadoReclamo;
  // Recepción (operador)
  fechaRecepcion: Date;
  horaRecepcion: string; // HH:mm format
  operadorId: string;
  // Atención (técnico)
  tecnicoId?: string;
  fechaAsignacion?: Date;
  fechaAtencion?: Date;
  horaAtencion?: string;
  fallaEncontrada?: string;
  materialesUsados?: MaterialUsado[];
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// DTOs for API communication
export interface CreateReclamoDto {
  telefono: string;
  nombre: string;
  direccion: string;
  motivo: string;
  servicioAfectado: ServicioAfectado;
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

export interface ExportFilter {
  desde: Date;
  hasta: Date;
  tipo: 'semana' | 'mes';
}

export interface ReclamoDetalle extends Reclamo {
  numeroReclamo: string;
  operador: Pick<Usuario, 'id' | 'nombre'>;
  tecnico?: Pick<Usuario, 'id' | 'nombre'>;
  materiales: MaterialUsado[];
}
