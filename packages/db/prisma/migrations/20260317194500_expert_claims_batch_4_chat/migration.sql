CREATE TABLE "reclamo_mensajes" (
  "id" TEXT NOT NULL,
  "reclamoId" TEXT NOT NULL,
  "autorId" TEXT NOT NULL,
  "contenido" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "reclamo_mensajes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reclamo_mensaje_lecturas" (
  "mensajeId" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "reclamo_mensaje_lecturas_pkey" PRIMARY KEY ("mensajeId", "usuarioId")
);

CREATE INDEX "reclamo_mensajes_reclamoId_createdAt_idx"
ON "reclamo_mensajes"("reclamoId", "createdAt");

CREATE INDEX "reclamo_mensajes_autorId_idx"
ON "reclamo_mensajes"("autorId");

CREATE INDEX "reclamo_mensaje_lecturas_usuarioId_readAt_idx"
ON "reclamo_mensaje_lecturas"("usuarioId", "readAt");

ALTER TABLE "reclamo_mensajes"
ADD CONSTRAINT "reclamo_mensajes_reclamoId_fkey"
FOREIGN KEY ("reclamoId") REFERENCES "reclamos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reclamo_mensajes"
ADD CONSTRAINT "reclamo_mensajes_autorId_fkey"
FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reclamo_mensaje_lecturas"
ADD CONSTRAINT "reclamo_mensaje_lecturas_mensajeId_fkey"
FOREIGN KEY ("mensajeId") REFERENCES "reclamo_mensajes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reclamo_mensaje_lecturas"
ADD CONSTRAINT "reclamo_mensaje_lecturas_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
