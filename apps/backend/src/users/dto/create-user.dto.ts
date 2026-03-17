import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Rol } from '@cospec/shared-types';

export class CreateUserDto {
  @IsString()
  nombre!: string;

  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;

  @IsEnum(Rol, { message: 'Rol inválido' })
  rol!: Rol;
}
