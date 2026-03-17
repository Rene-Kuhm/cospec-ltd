import { IsDateString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { EstadoReclamo, ServicioAfectado } from '@cospec/shared-types';

export class ExportReclamosDto {
  @IsNotEmpty({ message: 'Parametros desde y hasta son requeridos' })
  @IsDateString({}, { message: 'Formato de fecha invalido. Usar YYYY-MM-DD' })
  desde!: string;

  @IsNotEmpty({ message: 'Parametros desde y hasta son requeridos' })
  @IsDateString({}, { message: 'Formato de fecha invalido. Usar YYYY-MM-DD' })
  hasta!: string;

  @IsOptional()
  @IsEnum(EstadoReclamo)
  estado?: EstadoReclamo;

  @IsOptional()
  @IsEnum(ServicioAfectado)
  servicioAfectado?: ServicioAfectado;
}
