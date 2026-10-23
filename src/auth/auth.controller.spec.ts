import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  let authService: {
    login: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('deve definir o controller', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('deve encaminhar as credenciais para o AuthService', async () => {
      const dto = {
        email: 'teste@example.com',
        password: 'SenhaSegura123!',
      };

      const authResponse = {
        access_token: 'fake-jwt-token',
        token_type: 'Bearer',
        expires_in: '15m',
        user: {
          id: 'user-123',
          name: 'Usuário de teste',
          email: 'teste@example.com',
          role: 'requester',
        },
      };

      authService.login.mockResolvedValue(authResponse);

      await expect(controller.login(dto)).resolves.toEqual(authResponse);

      expect(authService.login).toHaveBeenCalledTimes(1);
      expect(authService.login).toHaveBeenCalledWith(dto);
    });

    it('deve propagar erros do AuthService', async () => {
      const dto = {
        email: 'teste@example.com',
        password: 'senha-incorreta',
      };

      const error = new Error('Credenciais inválidas');

      authService.login.mockRejectedValue(error);

      await expect(controller.login(dto)).rejects.toThrow(error);
      expect(authService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('getProfile', () => {
    it('deve retornar os dados do usuário autenticado', () => {
      const request = {
        user: {
          id: 'user-123',
          email: 'teste@example.com',
          role: 'requester',
        },
      };

      expect(controller.getProfile(request as any)).toEqual(request.user);
    });
  });

  describe('adminTest', () => {
    it('deve retornar a mensagem de acesso administrativo autorizado', () => {
      expect(controller.adminTest()).toEqual({
        message: 'Acesso administrativo autorizado.',
      });
    });
  });
});
