
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdatePurchaseRequestDto {
  @ApiPropertyOptional({
    description: 'Novo título da solicitação de compra',
    example: 'Compra de notebooks para a equipe',
    minLength: 3,
    maxLength: 180,
  })
  @IsOptional()
  @IsString()
  @Length(3, 180)
  title?: string;

  @ApiPropertyOptional({
    description: 'Nova descrição da solicitação. Aceita null para limpar o campo.',
    example: 'Aquisição de 5 notebooks para novos colaboradores.',
    maxLength: 2000,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Novo valor estimado, com até duas casas decimais',
    example: '12500.00',
    pattern: '^\\d{1,10}(\\.\\d{1,2})?$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,10}(\.\d{1,2})?$/, {
    message:
      'estimatedAmount deve ser um valor positivo com até duas casas decimais',
  })
  estimatedAmount?: string;
}
