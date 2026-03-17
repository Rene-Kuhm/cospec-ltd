import { getDB } from './database';
import type { PrioridadReclamo } from '@cospec/shared-types';

export interface ReclamoRow {
  id: string;
  numeroReclamo: string;
  nombre: string;
  telefono: string;
  direccion: string;
  motivo: string;
  servicioAfectado: string;
  prioridad: PrioridadReclamo;
  categoria: string | null;
  subcategoria: string | null;
  estado: string;
  horaRecepcion: string;
  fechaRecepcion: string;
  tecnicoId: string | null;
  asignadoPorId: string | null;
  fallaEncontrada: string | null;
  pendingSync: number;
  updatedById: string | null;
  updatedAt: string;
}

export async function saveReclamos(reclamos: ReclamoRow[]): Promise<void> {
  const db = await getDB();
  await db.withTransactionAsync(async () => {
    for (const r of reclamos) {
      await db.runAsync(
        `INSERT OR REPLACE INTO reclamos_local
          (id, numeroReclamo, nombre, telefono, direccion, motivo,
           servicioAfectado, prioridad, categoria, subcategoria, estado,
           horaRecepcion, fechaRecepcion, tecnicoId, asignadoPorId,
           fallaEncontrada, pendingSync, updatedById, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id, r.numeroReclamo, r.nombre, r.telefono, r.direccion,
          r.motivo, r.servicioAfectado, r.prioridad, r.categoria ?? null,
          r.subcategoria ?? null, r.estado, r.horaRecepcion, r.fechaRecepcion,
          r.tecnicoId ?? null, r.asignadoPorId ?? null, r.fallaEncontrada ?? null,
          r.pendingSync ?? 0, r.updatedById ?? null, r.updatedAt,
        ],
      );
    }
  });
}

export async function getReclamosLocales(): Promise<ReclamoRow[]> {
  const db = await getDB();
  return db.getAllAsync<ReclamoRow>(
    'SELECT * FROM reclamos_local ORDER BY fechaRecepcion DESC',
  );
}

export async function updateEstadoLocal(
  id: string,
  estado: string,
  extra?: { fallaEncontrada?: string },
): Promise<void> {
  const db = await getDB();
  const updatedAt = new Date().toISOString();
  if (extra?.fallaEncontrada !== undefined) {
    await db.runAsync(
      'UPDATE reclamos_local SET estado = ?, fallaEncontrada = ?, pendingSync = 1, updatedAt = ? WHERE id = ?',
      [estado, extra.fallaEncontrada, updatedAt, id],
    );
  } else {
    await db.runAsync(
      'UPDATE reclamos_local SET estado = ?, pendingSync = 1, updatedAt = ? WHERE id = ?',
      [estado, updatedAt, id],
    );
  }
}

export async function markSynced(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'UPDATE reclamos_local SET pendingSync = 0 WHERE id = ?',
    [id],
  );
}
