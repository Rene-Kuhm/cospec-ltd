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

export enum ReclamoEventoTipo {
  CREADO = 'CREADO',
  ASIGNACION_ADMINISTRATIVA = 'ASIGNACION_ADMINISTRATIVA',
  TOMADO = 'TOMADO',
  ESTADO_CAMBIADO = 'ESTADO_CAMBIADO',
  RESUELTO = 'RESUELTO',
  CANCELADO = 'CANCELADO',
  MATERIAL_AGREGADO = 'MATERIAL_AGREGADO',
}

export enum NotificationType {
  RECLAMO_ASIGNADO = 'RECLAMO_ASIGNADO',
  MENSAJE_INTERNO = 'MENSAJE_INTERNO',
  RECLAMO_RESUELTO = 'RECLAMO_RESUELTO',
  RECLAMO_CANCELADO = 'RECLAMO_CANCELADO',
  CAMBIO_OPERATIVO = 'CAMBIO_OPERATIVO',
}

export enum ServicioAfectado {
  FIBRA_OPTICA = 'FIBRA_OPTICA',
  ADSL = 'ADSL',
  TELEFONIA = 'TELEFONIA',
  TV_SENSA = 'TV_SENSA',
}

export type PrioridadReclamo = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

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

export interface ReclamoEventoMaterialPayload {
  descripcion: string;
  cantidad: number;
}

export interface ReclamoEventoPayload {
  estadoAnterior?: EstadoReclamo;
  estadoNuevo?: EstadoReclamo;
  tecnico?: ReclamoListadoUsuarioRef | null;
  materiales?: ReclamoEventoMaterialPayload[];
  fallaEncontrada?: string;
}

export interface ReclamoEvento {
  id: string;
  reclamoId: string;
  tipo: ReclamoEventoTipo;
  actorId?: string | null;
  actor?: ReclamoUsuarioRef | null;
  payload: ReclamoEventoPayload;
  createdAt: ReclamoDateValue;
}

export interface ReclamoTimelineItem {
  id: string;
  tipo: ReclamoEventoTipo;
  fecha: ReclamoDateValue;
  actor?: ReclamoUsuarioRef | null;
  titulo: string;
  descripcion: string;
  payload: ReclamoEventoPayload;
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
  prioridad: PrioridadReclamo;
  categoria?: string | null;
  subcategoria?: string | null;
  estado: EstadoReclamo;
  fechaRecepcion: ReclamoDateValue;
  horaRecepcion: string;
  operadorId: string;
  operador?: ReclamoListadoUsuarioRef | null;
  tecnicoId?: string | null;
  tecnico?: ReclamoListadoUsuarioRef | null;
  asignadoPorId?: string | null;
  asignadoPor?: ReclamoListadoUsuarioRef | null;
  fechaAsignacion?: ReclamoDateValue | null;
  fechaAtencion?: ReclamoDateValue | null;
  horaAtencion?: string | null;
  fallaEncontrada?: string | null;
  updatedById?: string | null;
  updatedBy?: ReclamoListadoUsuarioRef | null;
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
  prioridad?: PrioridadReclamo;
  categoria?: string;
  subcategoria?: string;
  horaRecepcion?: string;
}

export interface UpdateReclamoDto {
  estado?: EstadoReclamo;
  tecnicoId?: string;
  fallaEncontrada?: string;
  horaAtencion?: string;
}

export interface AsignarTecnicoDto {
  tecnicoId: string;
}

export interface TecnicoActivo {
  id: string;
  nombre: string;
}

export interface OperadorActivo {
  id: string;
  nombre: string;
  rol: Rol;
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

export interface GetReclamosResponse extends PaginatedResponse<ReclamoResumen> {
  stats: GetReclamosStatsResponse;
}

export type GetReclamosStatsResponse = Partial<Record<EstadoReclamo, number>>;

export interface ExportFilter {
  desde: Date;
  hasta: Date;
  tipo: 'semana' | 'mes';
}

export interface ReclamoDetalle extends Omit<ReclamoResumen, 'operador' | 'tecnico'> {
  operador: ReclamoUsuarioRef;
  tecnico?: ReclamoUsuarioRef | null;
  asignadoPor?: ReclamoUsuarioRef | null;
  updatedBy?: ReclamoUsuarioRef | null;
  materiales: MaterialUsado[];
}

export type GetReclamoDetalleResponse = ReclamoDetalle;

export type GetReclamoTimelineResponse = ReclamoTimelineItem[];

export interface ReclamoMensajeAutor {
  id: string;
  nombre: string;
  rol: Rol;
}

export interface ReclamoMensaje {
  id: string;
  reclamoId: string;
  autorId: string;
  autor: ReclamoMensajeAutor;
  contenido: string;
  createdAt: ReclamoDateValue;
  isRead: boolean;
  readAt?: ReclamoDateValue | null;
}

export interface CreateReclamoMensajeDto {
  contenido: string;
}

export interface GetReclamoChatResponse {
  reclamoId: string;
  messages: ReclamoMensaje[];
  unreadCount: number;
  canWrite: boolean;
}

export interface MarkReclamoChatReadResponse {
  reclamoId: string;
  markedCount: number;
  readAt: ReclamoDateValue;
}

export interface NotificationClaimRef {
  id: string;
  numeroReclamo: string;
  estado?: EstadoReclamo;
}

export interface NotificationMetadata {
  reclamo?: NotificationClaimRef | null;
  actor?: ReclamoUsuarioRef | null;
  motivo?: string | null;
  tecnico?: ReclamoListadoUsuarioRef | null;
  estadoAnterior?: EstadoReclamo;
  estadoNuevo?: EstadoReclamo;
}

export interface Notificacion {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: 'RECLAMO';
  entityId?: string | null;
  metadata?: NotificationMetadata | null;
  readAt?: ReclamoDateValue | null;
  createdAt: ReclamoDateValue;
}

export interface NotificationItem extends Omit<Notificacion, 'userId'> {
  claim?: NotificationClaimRef | null;
  actor?: ReclamoUsuarioRef | null;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface MarkNotificationReadResponse {
  id: string;
  readAt: ReclamoDateValue;
}

export interface MarkAllNotificationsReadResponse {
  updatedCount: number;
  readAt: ReclamoDateValue;
}

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

export type GetTecnicosActivosResponse = TecnicoActivo[];

export type GetOperadoresActivosResponse = OperadorActivo[];

export type GetCategoriasReclamoResponse = string[];

export type CreateReclamoMensajeResponse = ReclamoMensaje;

export type GetNotificationsResponse = NotificationItem[];
