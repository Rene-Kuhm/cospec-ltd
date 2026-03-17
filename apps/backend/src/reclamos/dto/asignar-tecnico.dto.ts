import { IsNotEmpty, IsString } from 'class-validator';

export class AsignarTecnicoDto {
  @IsString()
  @IsNotEmpty({ message: 'El tecnicoId es requerido' })
  tecnicoId!: string;
}
