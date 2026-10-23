
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'E-mail cadastrado do usuário',
    example: 'usuario@exemplo.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Senha da conta',
    example: 'SenhaSegura123',
    minLength: 6,
    writeOnly: true,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
