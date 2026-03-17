import { apiFetch } from './api';
import type {
  AddMaterialResponse,
  AsignarReclamoResponse,
  AsignarTecnicoDto,
  CancelReclamoResponse,
  CreateReclamoDto,
  CreateReclamoResponse,
  EstadoReclamo,
  GetCategoriasReclamoResponse,
  GetOperadoresActivosResponse,
  GetReclamoDetalleResponse,
  GetReclamoTimelineResponse,
  GetReclamosResponse,
  GetReclamosStatsResponse,
  GetTecnicosActivosResponse,
  AddMaterialDto,
  PrioridadReclamo,
  ResolverReclamoResponse,
  UpdateReclamoResponse,
} from '@cospec/shared-types';

export interface ReclamosFilter {
  search?: string;
  estado?: string;
  prioridad?: PrioridadReclamo;
  categoria?: string;
  servicioAfectado?: string;
  tecnicoId?: string;
  operadorId?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  limit?: number;
}

export async function getReclamos(
  filters: ReclamosFilter = {},
): Promise<GetReclamosResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v));
  });
  const query = params.toString();
  return apiFetch(`/reclamos${query ? `?${query}` : ''}`);
}

export async function getReclamoById(id: string): Promise<GetReclamoDetalleResponse> {
  return apiFetch(`/reclamos/${id}`);
}

export async function getReclamoTimeline(id: string): Promise<GetReclamoTimelineResponse> {
  return apiFetch(`/reclamos/${id}/timeline`);
}

export async function createReclamo(dto: CreateReclamoDto): Promise<CreateReclamoResponse> {
  return apiFetch('/reclamos', { method: 'POST', body: JSON.stringify(dto) });
}

export async function asignarReclamo(
  id: string,
  dto: AsignarTecnicoDto,
): Promise<AsignarReclamoResponse> {
  return apiFetch(`/reclamos/${id}/asignacion`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function getTecnicosActivos(): Promise<GetTecnicosActivosResponse> {
  return apiFetch('/reclamos/tecnicos/activos');
}

export async function getOperadoresActivos(): Promise<GetOperadoresActivosResponse> {
  return apiFetch('/reclamos/operadores/activos');
}

export async function getCategoriasReclamo(): Promise<GetCategoriasReclamoResponse> {
  return apiFetch('/reclamos/categorias');
}

export async function updateEstado(
  id: string,
  estado: EstadoReclamo,
): Promise<UpdateReclamoResponse> {
  return apiFetch(`/reclamos/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
}

export async function resolverReclamo(
  id: string,
  dto: { fallaEncontrada: string; horaAtencion?: string; materiales?: AddMaterialDto[] },
): Promise<ResolverReclamoResponse> {
  return apiFetch(`/reclamos/${id}/resolver`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function cancelarReclamo(id: string): Promise<CancelReclamoResponse> {
  return apiFetch(`/reclamos/${id}/cancelar`, { method: 'DELETE' });
}

export async function addMaterial(
  id: string,
  dto: AddMaterialDto,
): Promise<AddMaterialResponse> {
  return apiFetch(`/reclamos/${id}/materiales`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function getStatsByEstado(): Promise<GetReclamosStatsResponse> {
  return apiFetch('/reclamos/stats');
}
