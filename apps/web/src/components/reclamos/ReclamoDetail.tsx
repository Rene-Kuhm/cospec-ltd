import type { ReclamoDetalle as ReclamoDetalleType } from '@cospec/shared-types';
import { SERVICIO_LABELS, formatFecha } from '@cospec/shared-utils';
import { EstadoBadge } from './EstadoBadge';

interface ReclamoDetailProps {
  reclamo: ReclamoDetalleType;
}

export function ReclamoDetail({ reclamo }: ReclamoDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-mono text-slate-400">{reclamo.numeroReclamo}</p>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">{reclamo.nombre}</h2>
          <p className="text-slate-500">{reclamo.telefono} · {reclamo.direccion}</p>
        </div>
        <EstadoBadge estado={reclamo.estado} />
      </div>

      {/* Grid info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard label="Servicio afectado">
          {SERVICIO_LABELS[reclamo.servicioAfectado as keyof typeof SERVICIO_LABELS] ?? reclamo.servicioAfectado}
        </InfoCard>
        <InfoCard label="Motivo">{reclamo.motivo}</InfoCard>
        <InfoCard label="Recibido">
          {formatFecha(new Date(reclamo.fechaRecepcion))} a las {reclamo.horaRecepcion}
        </InfoCard>
        <InfoCard label="Operador">{reclamo.operador?.nombre ?? '—'}</InfoCard>
        <InfoCard label="Técnico asignado">{reclamo.tecnico?.nombre ?? 'Sin asignar'}</InfoCard>
        {reclamo.fechaAtencion && (
          <InfoCard label="Atendido">
            {formatFecha(new Date(reclamo.fechaAtencion))}
            {reclamo.horaAtencion ? ` a las ${reclamo.horaAtencion}` : ''}
          </InfoCard>
        )}
      </div>

      {/* Falla encontrada */}
      {reclamo.fallaEncontrada && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Falla encontrada
          </p>
          <p className="text-slate-800">{reclamo.fallaEncontrada}</p>
        </div>
      )}

      {/* Materiales */}
      {reclamo.materiales && reclamo.materiales.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Materiales utilizados
          </p>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {reclamo.materiales.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-slate-800">{m.descripcion}</span>
                <span className="text-slate-500 font-medium">x{m.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-slate-800 text-sm">{children}</p>
    </div>
  );
}
