
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class DecidePurchaseRequestDto {
  @ApiProperty({
    description: 'Decisão do aprovador sobre a solicitação',
    enum: ['approved', 'rejected'],
    example: 'approved',
  })
  @IsIn(['approved', 'rejected'])
  decision: 'approved' | 'rejected';

  @ApiPropertyOptional({
    description: 'Justificativa da aprovação ou rejeição',
    example: 'Solicitação aprovada conforme o orçamento disponível.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
