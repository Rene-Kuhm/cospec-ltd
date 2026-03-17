import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ServicioAfectado } from '@cospec/shared-types';

const SERVICIO_AFECTADO_VALUES = ['FIBRA_OPTICA', 'ADSL', 'TELEFONIA', 'TV_SENSA'] as const;
const PRIORIDAD_RECLAMO_VALUES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'] as const;

export class CreateReclamoDto {
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  telefono!: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre!: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección es requerida' })
  direccion!: string;

  @IsString()
  @IsNotEmpty({ message: 'El motivo es requerido' })
  motivo!: string;

  @IsIn(SERVICIO_AFECTADO_VALUES, { message: 'Servicio afectado inválido' })
  servicioAfectado!: ServicioAfectado;

  @IsOptional()
  @IsIn(PRIORIDAD_RECLAMO_VALUES, { message: 'Prioridad inválida' })
  prioridad?: (typeof PRIORIDAD_RECLAMO_VALUES)[number];

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  subcategoria?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Hora debe tener formato HH:mm' })
  horaRecepcion?: string;
}
