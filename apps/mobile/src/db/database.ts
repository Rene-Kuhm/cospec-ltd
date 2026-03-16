import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function initDB(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync('cospec.db');

    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS reclamos_local (
        id TEXT PRIMARY KEY,
        numeroReclamo TEXT NOT NULL,
        nombre TEXT NOT NULL,
        telefono TEXT NOT NULL,
        direccion TEXT NOT NULL,
        motivo TEXT NOT NULL,
        servicioAfectado TEXT NOT NULL,
        estado TEXT NOT NULL,
        horaRecepcion TEXT NOT NULL,
        fechaRecepcion TEXT NOT NULL,
        tecnicoId TEXT,
        fallaEncontrada TEXT,
        pendingSync INTEGER DEFAULT 0,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reclamoId TEXT NOT NULL,
        accion TEXT NOT NULL,
        payload TEXT NOT NULL,
        capturedAt TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        errorMsg TEXT
      );
    `);

    dbInstance = db;
    return db;
  })();

  return initPromise;
}

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  return initDB();
}
