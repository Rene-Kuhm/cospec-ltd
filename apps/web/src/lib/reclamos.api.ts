import { apiFetch } from './api';
import type {
  AddMaterialResponse,
  AsignarReclamoResponse,
  CancelReclamoResponse,
  CreateReclamoDto,
  CreateReclamoResponse,
  EstadoReclamo,
  GetReclamoDetalleResponse,
  GetReclamosResponse,
  GetReclamosStatsResponse,
  AddMaterialDto,
  ResolverReclamoResponse,
  UpdateReclamoResponse,
} from '@cospec/shared-types';

export interface ReclamosFilter {
  estado?: string;
  servicioAfectado?: string;
  tecnicoId?: string;
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

export async function createReclamo(dto: CreateReclamoDto): Promise<CreateReclamoResponse> {
  return apiFetch('/reclamos', { method: 'POST', body: JSON.stringify(dto) });
}

export async function asignarReclamo(id: string): Promise<AsignarReclamoResponse> {
  return apiFetch(`/reclamos/${id}/asignar`, { method: 'PATCH' });
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
