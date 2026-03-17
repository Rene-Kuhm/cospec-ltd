import axios from 'axios';
import { getQueue, markDone, markError } from '../db/sync-queue.db';
import { markSynced } from '../db/reclamos.db';
import { reclamosService } from './reclamos.service';

const RETRY_DELAYS_MS = [1000, 2000, 4000];

export interface SyncFailedItem {
  reclamoId: string;
  accion: string;
  error: string;
}

export interface SyncResult {
  failed: SyncFailedItem[];
}

function isBizError(err: unknown): boolean {
  return (
    axios.isAxiosError(err) &&
    err.response !== undefined &&
    (err.response.status === 400 || err.response.status === 409)
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callApiWithRetry(
  fn: () => Promise<unknown>,
): Promise<void> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      await fn();
      return;
    } catch (err) {
      lastErr = err;
      // Business errors (400/409) → no retry, re-throw immediately
      if (isBizError(err)) throw err;
      // If we still have retries left, wait and try again
      if (attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]!);
      }
    }
  }
  throw lastErr;
}

export async function processSyncQueue(): Promise<SyncResult> {
  const queue = await getQueue();
  const failed: SyncFailedItem[] = [];

  if (queue.length === 0) return { failed };

  console.log(`[Sync] Processing ${queue.length} pending actions...`);

  for (const item of queue) {
    try {
      const payload = JSON.parse(item.payload) as Record<string, unknown>;

      await callApiWithRetry(async () => {
        if (item.accion === 'EN_PROGRESO') {
          await reclamosService.iniciarTrabajo(item.reclamoId);
        } else if (item.accion === 'RESOLVER') {
          await reclamosService.resolverReclamo(item.reclamoId, {
            fallaEncontrada: payload['fallaEncontrada'] as string,
            horaAtencion: payload['horaAtencion'] as string,
            materiales: payload['materiales'] as
              | { descripcion: string; cantidad: number }[]
              | undefined,
          });
        }
      });

      await markDone(item.id);
      await markSynced(item.reclamoId);
      console.log(`[Sync] ✅ ${item.accion} for ${item.reclamoId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      await markError(item.id, msg);
      console.warn(`[Sync] ❌ ${item.accion} for ${item.reclamoId}: ${msg}`);
      failed.push({ reclamoId: item.reclamoId, accion: item.accion, error: msg });
      // Continue FIFO — skip this item, process next
    }
  }

  return { failed };
}
