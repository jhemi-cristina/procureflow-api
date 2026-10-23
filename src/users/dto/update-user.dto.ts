
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Novo nome do usuário',
    example: 'Maria Silva',
    minLength: 2,
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @Length(2, 150)
  name?: string;

  @ApiPropertyOptional({
    description: 'Novo e-mail do usuário',
    example: 'maria@empresa.com',
    maxLength: 180,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  email?: string;
}
