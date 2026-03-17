CREATE TYPE "NotificationType" AS ENUM (
  'RECLAMO_ASIGNADO',
  'MENSAJE_INTERNO',
  'RECLAMO_RESUELTO',
  'RECLAMO_CANCELADO',
  'CAMBIO_OPERATIVO'
);

CREATE TABLE "notificaciones" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "tipo" "NotificationType" NOT NULL,
  "titulo" TEXT NOT NULL,
  "mensaje" TEXT NOT NULL,
  "entidadTipo" TEXT NOT NULL DEFAULT 'RECLAMO',
  "entidadId" TEXT,
  "metadata" JSONB,
  "dedupeKey" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notificaciones_usuarioId_dedupeKey_key"
ON "notificaciones"("usuarioId", "dedupeKey");

CREATE INDEX "notificaciones_usuarioId_createdAt_idx"
ON "notificaciones"("usuarioId", "createdAt");

CREATE INDEX "notificaciones_usuarioId_readAt_createdAt_idx"
ON "notificaciones"("usuarioId", "readAt", "createdAt");

ALTER TABLE "notificaciones"
ADD CONSTRAINT "notificaciones_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
