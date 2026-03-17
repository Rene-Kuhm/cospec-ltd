import { api } from '../lib/api';
import type { ReclamoRow } from '../db/reclamos.db';
import type {
  CreateReclamoMensajeDto,
  CreateReclamoMensajeResponse,
  GetReclamoChatResponse,
  GetReclamoTimelineResponse,
  MarkReclamoChatReadResponse,
} from '@cospec/shared-types';

export interface ResolverDto {
  fallaEncontrada: string;
  horaAtencion: string;
  materiales?: { descripcion: string; cantidad: number }[];
}

function normalizeReclamo(reclamo: ReclamoRow): ReclamoRow {
  return {
    ...reclamo,
    pendingSync: reclamo.pendingSync ?? 0,
    prioridad: reclamo.prioridad ?? 'MEDIA',
    categoria: reclamo.categoria ?? null,
    subcategoria: reclamo.subcategoria ?? null,
    asignadoPorId: reclamo.asignadoPorId ?? null,
    updatedById: reclamo.updatedById ?? null,
  };
}

export const reclamosService = {
  async getReclamos(): Promise<ReclamoRow[]> {
    const res = await api.get<{ data: ReclamoRow[] }>('/reclamos');
    return res.data.data.map(normalizeReclamo);
  },

  async tomarReclamo(id: string): Promise<ReclamoRow> {
    const res = await api.patch<ReclamoRow>(`/reclamos/${id}/tomar`);
    return normalizeReclamo(res.data);
  },

  async iniciarTrabajo(id: string): Promise<ReclamoRow> {
    const res = await api.patch<ReclamoRow>(`/reclamos/${id}/estado`, {
      estado: 'EN_PROGRESO',
    });
    return normalizeReclamo(res.data);
  },

  async resolverReclamo(id: string, dto: ResolverDto): Promise<ReclamoRow> {
    const res = await api.patch<ReclamoRow>(`/reclamos/${id}/resolver`, dto);
    return normalizeReclamo(res.data);
  },

  async getTimeline(id: string): Promise<GetReclamoTimelineResponse> {
    const res = await api.get<GetReclamoTimelineResponse>(`/reclamos/${id}/timeline`);
    return res.data;
  },

  async getChat(id: string): Promise<GetReclamoChatResponse> {
    const res = await api.get<GetReclamoChatResponse>(`/reclamos/${id}/chat`);
    return res.data;
  },

  async sendChatMessage(
    id: string,
    dto: CreateReclamoMensajeDto,
  ): Promise<CreateReclamoMensajeResponse> {
    const res = await api.post<CreateReclamoMensajeResponse>(`/reclamos/${id}/chat`, dto);
    return res.data;
  },

  async markChatRead(id: string): Promise<MarkReclamoChatReadResponse> {
    const res = await api.post<MarkReclamoChatReadResponse>(`/reclamos/${id}/chat/read`, {});
    return res.data;
  },
};
