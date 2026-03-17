CREATE TYPE "PrioridadReclamo" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

ALTER TABLE "reclamos"
ADD COLUMN "prioridad" "PrioridadReclamo" NOT NULL DEFAULT 'MEDIA',
ADD COLUMN "categoria" TEXT,
ADD COLUMN "subcategoria" TEXT,
ADD COLUMN "asignadoPorId" TEXT,
ADD COLUMN "updatedById" TEXT;

ALTER TABLE "reclamos"
ADD CONSTRAINT "reclamos_asignadoPorId_fkey"
FOREIGN KEY ("asignadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reclamos"
ADD CONSTRAINT "reclamos_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "reclamos_prioridad_idx" ON "reclamos"("prioridad");
CREATE INDEX "reclamos_categoria_idx" ON "reclamos"("categoria");
CREATE INDEX "reclamos_tecnicoId_idx" ON "reclamos"("tecnicoId");
