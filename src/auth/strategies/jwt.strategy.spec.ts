import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  let usersService: {
    findActiveById: jest.Mock;
  };

  let configService: {
    getOrThrow: jest.Mock;
  };

  const user = {
    id: 'user-123',
    name: 'Usuário de teste',
    email: 'teste@example.com',
    role: 'requester',
    isActive: true,
  };

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  beforeEach(async () => {
    usersService = {
      findActiveById: jest.fn(),
    };

    configService = {
      getOrThrow: jest.fn().mockReturnValue('test-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('deve definir a estratégia', () => {
    expect(strategy).toBeDefined();
  });

  it('deve exigir o JWT_SECRET na configuração', () => {
    expect(configService.getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
  });

  describe('validate', () => {
    it('deve retornar os dados públicos do usuário ativo', async () => {
      usersService.findActiveById.mockResolvedValue(user);

      await expect(strategy.validate(payload)).resolves.toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });

      expect(usersService.findActiveById).toHaveBeenCalledWith(user.id);
    });

    it('deve rejeitar payload sem sub', async () => {
      await expect(
        strategy.validate({
          email: user.email,
          role: user.role,
        } as any),
      ).rejects.toThrow(
        new UnauthorizedException('Token inválido.'),
      );

      expect(usersService.findActiveById).not.toHaveBeenCalled();
    });

    it('deve rejeitar usuário inexistente ou inativo', async () => {
      usersService.findActiveById.mockResolvedValue(null);

      await expect(
        strategy.validate(payload),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Usuário não encontrado ou inativo.',
        ),
      );

      expect(usersService.findActiveById).toHaveBeenCalledWith(user.id);
    });

    it('deve propagar erros inesperados do UsersService', async () => {
      usersService.findActiveById.mockRejectedValue(
        new Error('Erro interno'),
      );

      await expect(strategy.validate(payload)).rejects.toThrow(
        'Erro interno',
      );
    });
  });
});
