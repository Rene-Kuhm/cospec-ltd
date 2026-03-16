import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ServicioAfectado } from '@cospec/shared-types';

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

  @IsEnum(ServicioAfectado, { message: 'Servicio afectado inválido' })
  servicioAfectado!: ServicioAfectado;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Hora debe tener formato HH:mm' })
  horaRecepcion?: string;
}
