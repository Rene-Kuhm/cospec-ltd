CREATE TYPE "ReclamoEventoTipo" AS ENUM (
  'CREADO',
  'ASIGNACION_ADMINISTRATIVA',
  'TOMADO',
  'ESTADO_CAMBIADO',
  'RESUELTO',
  'CANCELADO',
  'MATERIAL_AGREGADO'
);

CREATE TABLE "reclamo_eventos" (
  "id" TEXT NOT NULL,
  "reclamoId" TEXT NOT NULL,
  "tipo" "ReclamoEventoTipo" NOT NULL,
  "actorId" TEXT,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "reclamo_eventos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reclamo_eventos_reclamoId_createdAt_idx"
ON "reclamo_eventos"("reclamoId", "createdAt");

CREATE INDEX "reclamo_eventos_actorId_idx"
ON "reclamo_eventos"("actorId");

ALTER TABLE "reclamo_eventos"
ADD CONSTRAINT "reclamo_eventos_reclamoId_fkey"
FOREIGN KEY ("reclamoId") REFERENCES "reclamos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reclamo_eventos"
ADD CONSTRAINT "reclamo_eventos_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
