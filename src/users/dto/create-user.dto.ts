
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'Maria Silva',
    minLength: 2,
    maxLength: 150,
  })
  @IsString()
  @Length(2, 150)
  name: string;

  @ApiProperty({
    description: 'E-mail utilizado para acessar a plataforma',
    example: 'maria@empresa.com',
    maxLength: 180,
  })
  @IsEmail()
  @MaxLength(180)
  email: string;

  @ApiProperty({
    description: 'Senha da conta, com no mínimo 8 e no máximo 72 caracteres',
    example: 'SenhaSegura123',
    minLength: 8,
    maxLength: 72,
    writeOnly: true,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
