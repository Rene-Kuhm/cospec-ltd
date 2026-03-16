import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MaterialDto {
  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @IsInt()
  @Min(1)
  cantidad!: number;
}

export class ResolverReclamoDto {
  @IsString()
  @IsNotEmpty({ message: 'La falla encontrada es requerida para resolver el reclamo' })
  fallaEncontrada!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Hora debe tener formato HH:mm' })
  horaAtencion?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialDto)
  materiales?: MaterialDto[];
}
