
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreatePurchaseRequestDto {
  @ApiProperty({
    description: 'Título da solicitação de compra',
    example: 'Compra de notebooks para a equipe',
    minLength: 3,
    maxLength: 180,
  })
  @IsString()
  @Length(3, 180)
  title: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada da solicitação',
    example: 'Aquisição de 5 notebooks para novos colaboradores.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'Valor estimado da compra, com até duas casas decimais',
    example: '12500.00',
    pattern: '^\\d{1,10}(\\.\\d{1,2})?$',
  })
  @IsString()
  @Matches(/^\d{1,10}(\.\d{1,2})?$/, {
    message:
      'estimatedAmount deve ser um valor positivo com até duas casas decimais',
  })
  estimatedAmount: string;
}
