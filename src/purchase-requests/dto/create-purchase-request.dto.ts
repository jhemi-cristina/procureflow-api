
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreatePurchaseRequestDto {
  @IsString()
  @Length(3, 180)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @Matches(/^\d{1,10}(\.\d{1,2})?$/, {
    message:
      'estimatedAmount deve ser um valor positivo com até duas casas decimais',
  })
  estimatedAmount: string;
}
