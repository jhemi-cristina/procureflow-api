
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/entities/user.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const usersService = {
    findByEmailForAuthentication: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  const configService = {
    get: jest.fn(),
  };

  const activeUser = {
    id: 'user-123',
    name: 'Maria Silva',
    email: 'maria@empresa.com',
    role: UserRole.REQUESTER,
    isActive: true,
    passwordHash: 'hashed-password',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    configService.get.mockReturnValue('15m');
    jwtService.signAsync.mockResolvedValue('fake-jwt-token');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  it('deve autenticar um usuário ativo e retornar o token e os dados públicos', async () => {
    usersService.findByEmailForAuthentication.mockResolvedValue(activeUser);

    const result = await service.login({
      email: activeUser.email,
      password: 'SenhaSegura123',
    });

    expect(usersService.findByEmailForAuthentication).toHaveBeenCalledWith(
      activeUser.email,
    );
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'SenhaSegura123',
      activeUser.passwordHash,
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: activeUser.id,
      email: activeUser.email,
      role: activeUser.role,
    });

    expect(result).toEqual({
      access_token: 'fake-jwt-token',
      token_type: 'Bearer',
      expires_in: '15m',
      user: {
        id: activeUser.id,
        name: activeUser.name,
        email: activeUser.email,
        role: activeUser.role,
      },
    });

    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('deve rejeitar um e-mail inexistente', async () => {
    usersService.findByEmailForAuthentication.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'inexistente@empresa.com',
        password: 'SenhaSegura123',
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('deve rejeitar uma senha incorreta', async () => {
    usersService.findByEmailForAuthentication.mockResolvedValue(activeUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({
        email: activeUser.email,
        password: 'senha-incorreta',
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('deve rejeitar um usuário inativo', async () => {
    usersService.findByEmailForAuthentication.mockResolvedValue({
      ...activeUser,
      isActive: false,
    });

    await expect(
      service.login({
        email: activeUser.email,
        password: 'SenhaSegura123',
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('deve usar o tempo de expiração padrão quando não estiver configurado', async () => {
    usersService.findByEmailForAuthentication.mockResolvedValue(activeUser);
    configService.get.mockReturnValue('15m');

    const result = await service.login({
      email: activeUser.email,
      password: 'SenhaSegura123',
    });

    expect(configService.get).toHaveBeenCalledWith('JWT_EXPIRES_IN', '15m');
    expect(result.expires_in).toBe('15m');
  });
});
