import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoReclamo, ServicioAfectado } from '@cospec/shared-types';

export class FilterReclamosDto {
  @IsOptional()
  @IsEnum(EstadoReclamo)
  estado?: EstadoReclamo;

  @IsOptional()
  @IsEnum(ServicioAfectado)
  servicioAfectado?: ServicioAfectado;

  @IsOptional()
  @IsString()
  tecnicoId?: string;

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
