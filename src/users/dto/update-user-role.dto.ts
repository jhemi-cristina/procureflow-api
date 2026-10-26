import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'Novo perfil de acesso do usuário',
    enum: UserRole,
    example: UserRole.APPROVER,
  })
  @IsEnum(UserRole, {
    message: `role deve ser um dos valores: ${Object.values(UserRole).join(', ')}`,
  })
  role: UserRole;
}
