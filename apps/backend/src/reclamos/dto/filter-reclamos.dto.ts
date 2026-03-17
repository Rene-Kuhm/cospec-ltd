import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EstadoReclamo,
  ServicioAfectado,
} from '@cospec/shared-types';

const PRIORIDAD_RECLAMO_VALUES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'] as const;

export class FilterReclamosDto {
  @IsOptional()
  @IsEnum(EstadoReclamo)
  estado?: EstadoReclamo;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(PRIORIDAD_RECLAMO_VALUES)
  prioridad?: (typeof PRIORIDAD_RECLAMO_VALUES)[number];

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsEnum(ServicioAfectado)
  servicioAfectado?: ServicioAfectado;

  @IsOptional()
  @IsString()
  tecnicoId?: string;

  @IsOptional()
  @IsString()
  operadorId?: string;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
