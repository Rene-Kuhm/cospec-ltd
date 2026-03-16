import { getDB } from './database';

export interface SyncQueueRow {
  id: number;
  reclamoId: string;
  accion: string;
  payload: string;
  capturedAt: string;
  status: string;
  errorMsg: string | null;
}

export async function enqueue(
  reclamoId: string,
  accion: 'EN_PROGRESO' | 'RESOLVER',
  payload: Record<string, unknown>,
): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO sync_queue (reclamoId, accion, payload, capturedAt, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [reclamoId, accion, JSON.stringify(payload), new Date().toISOString()],
  );
}

export async function getQueue(): Promise<SyncQueueRow[]> {
  const db = await getDB();
  return db.getAllAsync<SyncQueueRow>(
    "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY id ASC",
  );
}

export async function markDone(id: number): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
}

export async function markError(id: number, errorMsg: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    "UPDATE sync_queue SET status = 'error', errorMsg = ? WHERE id = ?",
    [errorMsg, id],
  );
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB();
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'",
  );
  return result?.count ?? 0;
}
