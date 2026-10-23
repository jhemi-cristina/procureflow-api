
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole } from './entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    deactivate: jest.Mock;
    activate: jest.Mock;
  };

  const userId = '85610652-bfa8-408f-b27f-5db072bba46b';

  const user = {
    id: userId,
    name: 'Maria Silva',
    email: 'maria@example.com',
    role: UserRole.REQUESTER,
    isActive: true,
  };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      deactivate: jest.fn(),
      activate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('deve criar o controller', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('deve encaminhar os dados para o serviço de criação', async () => {
      const dto = {
        name: 'Maria Silva',
        email: 'maria@example.com',
        password: 'StrongPassword123',
      };

      usersService.create.mockResolvedValue(user);

      await expect(controller.create(dto)).resolves.toEqual(user);
      expect(usersService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('deve listar usuários com os parâmetros de paginação', async () => {
      const result = {
        data: [user],
        meta: { total: 1, page: 2, limit: 5, totalPages: 1 },
      };

      usersService.findAll.mockResolvedValue(result);

      await expect(controller.findAll(2, 5)).resolves.toEqual(result);
      expect(usersService.findAll).toHaveBeenCalledWith(2, 5);
    });
  });

  describe('findOne', () => {
    it('deve buscar um usuário pelo ID', async () => {
      usersService.findById.mockResolvedValue(user);

      await expect(controller.findOne(userId)).resolves.toEqual(user);
      expect(usersService.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('update', () => {
    it('deve encaminhar o ID e os dados de atualização', async () => {
      const dto = { name: 'Maria Souza' };
      const updatedUser = { ...user, name: 'Maria Souza' };

      usersService.update.mockResolvedValue(updatedUser);

      await expect(controller.update(userId, dto)).resolves.toEqual(
        updatedUser,
      );

      expect(usersService.update).toHaveBeenCalledWith(userId, dto);
    });
  });

  describe('deactivate', () => {
    it('deve encaminhar o ID para desativação', async () => {
      const inactiveUser = { ...user, isActive: false };
      usersService.deactivate.mockResolvedValue(inactiveUser);

      await expect(controller.deactivate(userId)).resolves.toEqual(
        inactiveUser,
      );

      expect(usersService.deactivate).toHaveBeenCalledWith(userId);
    });
  });

  describe('activate', () => {
    it('deve encaminhar o ID para ativação', async () => {
      usersService.activate.mockResolvedValue(user);

      await expect(controller.activate(userId)).resolves.toEqual(user);
      expect(usersService.activate).toHaveBeenCalledWith(userId);
    });
  });
});
