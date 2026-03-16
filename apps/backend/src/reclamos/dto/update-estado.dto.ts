import { IsEnum } from 'class-validator';
import { EstadoReclamo } from '@cospec/shared-types';

export class UpdateEstadoDto {
  @IsEnum(EstadoReclamo, { message: 'Estado inválido' })
  estado!: EstadoReclamo;
}
