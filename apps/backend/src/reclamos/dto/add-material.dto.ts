import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class AddMaterialDto {
  @IsString()
  @IsNotEmpty({ message: 'La descripción es requerida' })
  descripcion!: string;

  @IsInt()
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad!: number;
}
