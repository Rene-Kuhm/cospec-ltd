import type {
  GetReclamoChatResponse,
  PrioridadReclamo,
  ReclamoDetalle as ReclamoDetalleType,
  ReclamoEventoTipo,
  ReclamoTimelineItem,
  TecnicoActivo,
} from '@cospec/shared-types';
import { SERVICIO_LABELS, formatFecha } from '@cospec/shared-utils';
import { EstadoBadge } from './EstadoBadge';
import { ReclamoAssignmentPanel } from './ReclamoAssignmentPanel';
import { ReclamoChatPanel } from './ReclamoChatPanel';

const PRIORIDAD_LABELS: Record<PrioridadReclamo, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  CRITICA: 'Critica',
};

interface ReclamoDetailProps {
  reclamo: ReclamoDetalleType;
  tecnicos: TecnicoActivo[];
  timeline: ReclamoTimelineItem[];
  chat: GetReclamoChatResponse;
  currentUserId: string;
}

const EVENTO_TIPO_LABELS: Record<ReclamoEventoTipo, string> = {
  CREADO: 'Alta',
  ASIGNACION_ADMINISTRATIVA: 'Asignacion',
  TOMADO: 'Toma',
  ESTADO_CAMBIADO: 'Estado',
  RESUELTO: 'Resolucion',
  CANCELADO: 'Cancelacion',
  MATERIAL_AGREGADO: 'Material',
};

function formatTimelineDate(value: string | Date) {
  const date = new Date(value);

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function ReclamoDetail({ reclamo, tecnicos, timeline, chat, currentUserId }: ReclamoDetailProps) {
  return (
    <div className="space-y-6">
      <div className="app-shell-card p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-500">{reclamo.numeroReclamo}</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-50">{reclamo.nombre}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{reclamo.telefono} · {reclamo.direccion}</p>
          </div>
          <EstadoBadge estado={reclamo.estado} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Servicio" value={SERVICIO_LABELS[reclamo.servicioAfectado as keyof typeof SERVICIO_LABELS] ?? reclamo.servicioAfectado} />
          <MetricCard label="Prioridad" value={PRIORIDAD_LABELS[reclamo.prioridad]} />
          <MetricCard label="Tecnico" value={reclamo.tecnico?.nombre ?? 'Sin asignar'} />
          <MetricCard label="Operador" value={reclamo.operador?.nombre ?? 'Sin registrar'} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InfoCard label="Servicio afectado">
          {SERVICIO_LABELS[reclamo.servicioAfectado as keyof typeof SERVICIO_LABELS] ?? reclamo.servicioAfectado}
        </InfoCard>
        <InfoCard label="Categoria">{reclamo.categoria ?? 'Sin definir'}</InfoCard>
        <InfoCard label="Subcategoria">{reclamo.subcategoria ?? 'Sin definir'}</InfoCard>
        <InfoCard label="Motivo">{reclamo.motivo}</InfoCard>
        <InfoCard label="Recibido">
          {formatFecha(new Date(reclamo.fechaRecepcion))} a las {reclamo.horaRecepcion}
        </InfoCard>
        <InfoCard label="Operador">{reclamo.operador?.nombre ?? '—'}</InfoCard>
        <InfoCard label="Técnico asignado">{reclamo.tecnico?.nombre ?? 'Sin asignar'}</InfoCard>
        <InfoCard label="Asignado por">{reclamo.asignadoPor?.nombre ?? 'Sin registrar'}</InfoCard>
        <InfoCard label="Ultima actualizacion por">{reclamo.updatedBy?.nombre ?? 'Sin registrar'}</InfoCard>
        {reclamo.fechaAtencion && (
          <InfoCard label="Atendido">
            {formatFecha(new Date(reclamo.fechaAtencion))}
            {reclamo.horaAtencion ? ` a las ${reclamo.horaAtencion}` : ''}
          </InfoCard>
        )}
      </div>

      <ReclamoAssignmentPanel
        reclamoId={reclamo.id}
        estado={reclamo.estado}
        tecnicoId={reclamo.tecnicoId}
        tecnicos={tecnicos}
      />

      <ReclamoChatPanel
        reclamoId={reclamo.id}
        currentUserId={currentUserId}
        initialChat={chat}
      />

      {reclamo.fallaEncontrada && (
        <div className="app-shell-panel p-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
            Falla encontrada
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-200">{reclamo.fallaEncontrada}</p>
        </div>
      )}

      {reclamo.materiales && reclamo.materiales.length > 0 && (
        <div className="app-shell-panel p-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
            Materiales utilizados
          </p>
          <div className="mt-4 divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            {reclamo.materiales.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-4 text-sm">
                <span className="text-slate-200">{m.descripcion}</span>
                <span className="font-medium text-slate-400">x{m.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="app-shell-panel p-5">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
            Timeline auditable
          </p>
          <p className="text-sm text-slate-400">
            Secuencia cronologica de decisiones y movimientos reales del reclamo.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {timeline.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-slate-400">
              Este reclamo todavia no tiene eventos auditables registrados.
            </div>
          ) : (
            timeline.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_40px_rgba(3,7,18,0.2)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
                        {EVENTO_TIPO_LABELS[item.tipo]}
                      </span>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {item.actor?.nombre ?? 'Sistema'}
                      </span>
                    </div>
                    <p className="mt-3 text-base font-semibold text-slate-100">{item.titulo}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{item.descripcion}</p>
                  </div>

                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {formatTimelineDate(item.fecha)}
                  </p>
                </div>

                {item.payload.materiales && item.payload.materiales.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.payload.materiales.map((material) => (
                      <span
                        key={`${item.id}-${material.descripcion}-${material.cantidad}`}
                        className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200"
                      >
                        {material.cantidad}x {material.descripcion}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="app-shell-panel p-5">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-sm leading-7 text-slate-200">{children}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}
