import { api } from '../lib/api';
import type { ReclamoRow } from '../db/reclamos.db';

export interface ResolverDto {
  fallaEncontrada: string;
  horaAtencion: string;
  materiales?: { descripcion: string; cantidad: number }[];
}

export const reclamosService = {
  async getReclamos(): Promise<ReclamoRow[]> {
    const res = await api.get<{ data: ReclamoRow[] }>('/reclamos');
    return res.data.data;
  },

  async tomarReclamo(id: string): Promise<ReclamoRow> {
    const res = await api.patch<ReclamoRow>(`/reclamos/${id}/asignar`);
    return res.data;
  },

  async iniciarTrabajo(id: string): Promise<ReclamoRow> {
    const res = await api.patch<ReclamoRow>(`/reclamos/${id}/estado`, {
      estado: 'EN_PROGRESO',
    });
    return res.data;
  },

  async resolverReclamo(id: string, dto: ResolverDto): Promise<ReclamoRow> {
    const res = await api.patch<ReclamoRow>(`/reclamos/${id}/resolver`, dto);
    return res.data;
  },
};
