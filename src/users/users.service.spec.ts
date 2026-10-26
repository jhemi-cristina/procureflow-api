import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;

  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    findOneBy: jest.Mock;
    findAndCount: jest.Mock;
    update: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  const userData = {
    id: 'user-123',
    name: 'Maria Silva',
    email: 'maria@example.com',
    passwordHash: 'hashed-password',
    role: UserRole.REQUESTER,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const user = userData as User;

  const buildUser = (overrides: Partial<User> = {}): User =>
    ({ ...userData, ...overrides }) as User;

  beforeEach(async () => {
    jest.clearAllMocks();

    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('deve criar o serviço', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmailForAuthentication', () => {
    it('deve normalizar o e-mail e buscar a senha para autenticação', async () => {
      const queryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };

      repository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findByEmailForAuthentication(
        '  MARIA@EXAMPLE.COM  ',
      );

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(queryBuilder.addSelect).toHaveBeenCalledWith('user.passwordHash');
      expect(queryBuilder.where).toHaveBeenCalledWith('user.email = :email', {
        email: 'maria@example.com',
      });
      expect(result).toEqual(user);
    });
    it('deve retornar null quando o e-mail não existir', async () => {
      const queryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      repository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findByEmailForAuthentication(
        'inexistente@example.com',
      );

      expect(result).toBeNull();
      expect(queryBuilder.getOne).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('deve criar um usuário com e-mail normalizado e senha criptografada', async () => {
      const dto = {
        name: ' Maria Silva ',
        email: ' MARIA@EXAMPLE.COM ',
        password: 'StrongPassword123',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      repository.findOneBy.mockResolvedValue(null);
      repository.create.mockReturnValue(user);
      repository.save.mockResolvedValue(user);

      const result = await service.create(dto);

      expect(repository.findOneBy).toHaveBeenCalledWith({
        email: 'maria@example.com',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('StrongPassword123', 12);
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Maria Silva',
        email: 'maria@example.com',
        passwordHash: 'hashed-password',
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('maria@example.com');
    });

    it('deve impedir o cadastro de um e-mail já existente', async () => {
      repository.findOneBy.mockResolvedValue(user);

      await expect(
        service.create({
          name: 'Maria Silva',
          email: 'maria@example.com',
          password: 'StrongPassword123',
        }),
      ).rejects.toThrow(ConflictException);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findActiveById', () => {
    it('deve buscar um usuário ativo pelo ID', async () => {
      repository.findOneBy.mockResolvedValue(user);

      const result = await service.findActiveById('user-123');

      expect(repository.findOneBy).toHaveBeenCalledWith({
        id: 'user-123',
        isActive: true,
      });
      expect(result).toEqual(user);
    });
    it('deve retornar null quando não encontrar um usuário ativo', async () => {
      repository.findOneBy.mockResolvedValue(null);

      const result = await service.findActiveById('user-inactive');

      expect(repository.findOneBy).toHaveBeenCalledWith({
        id: 'user-inactive',
        isActive: true,
      });
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('deve retornar usuários com metadados de paginação', async () => {
      repository.findAndCount.mockResolvedValue([[user], 1]);

      const result = await service.findAll(1, 10);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          order: { createdAt: 'DESC' },
        }),
      );

      expect(result).toEqual({
        data: [user],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('deve corrigir valores inválidos de página e limite', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(0, 500);

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(100);
      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 100,
        }),
      );
    });
  });

  describe('findById', () => {
    it('deve retornar um usuário existente', async () => {
      repository.findOne.mockResolvedValue(user);

      const result = await service.findById('user-123');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: expect.objectContaining({
          id: true,
          email: true,
          name: true,
        }),
      });
      expect(result).toEqual(user);
    });

    it('deve lançar NotFoundException quando o usuário não existir', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('deve atualizar e normalizar o nome', async () => {
      repository.findOneBy.mockResolvedValue(user);
      repository.update.mockResolvedValue({ affected: 1 });
      repository.findOne.mockResolvedValue(buildUser({ name: 'Maria Souza' }));

      const result = await service.update('user-123', {
        name: ' Maria Souza ',
      });

      expect(repository.update).toHaveBeenCalledWith('user-123', {
        name: 'Maria Souza',
      });
      expect(result.name).toBe('Maria Souza');
    });

    it('deve rejeitar uma atualização sem campos', async () => {
      await expect(service.update('user-123', {})).rejects.toThrow(
        BadRequestException,
      );

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('deve rejeitar um nome com menos de dois caracteres', async () => {
      repository.findOneBy.mockResolvedValue(user);

      await expect(service.update('user-123', { name: ' A ' })).rejects.toThrow(
        BadRequestException,
      );

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('deve impedir a utilização de e-mail de outro usuário', async () => {
      repository.findOneBy
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(
          buildUser({ id: 'outro-usuario', email: 'outro@example.com' }),
        );

      await expect(
        service.update('user-123', {
          email: 'outro@example.com',
        }),
      ).rejects.toThrow(ConflictException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException ao atualizar usuário inexistente', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('inexistente', { name: 'Maria Souza' }),
      ).rejects.toThrow(NotFoundException);
    });
    it('deve permitir manter o próprio e-mail normalizado', async () => {
      repository.findOneBy
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(user);

      repository.update.mockResolvedValue({ affected: 1 });
      repository.findOne.mockResolvedValue(
        buildUser({ email: 'maria@example.com' }),
      );

      const result = await service.update('user-123', {
        email: ' MARIA@EXAMPLE.COM ',
      });

      expect(repository.update).toHaveBeenCalledWith('user-123', {
        email: 'maria@example.com',
      });
      expect(result.email).toBe('maria@example.com');
    });
  });

  describe('deactivate', () => {
    it('deve desativar um usuário ativo', async () => {
      repository.findOneBy.mockResolvedValue(user);
      repository.update.mockResolvedValue({ affected: 1 });
      repository.findOne.mockResolvedValue(buildUser({ isActive: false }));

      const result = await service.deactivate('user-123');

      expect(repository.update).toHaveBeenCalledWith('user-123', {
        isActive: false,
      });
      expect(result.isActive).toBe(false);
    });

    it('deve impedir a desativação de usuário já inativo', async () => {
      repository.findOneBy.mockResolvedValue(buildUser({ isActive: false }));

      await expect(service.deactivate('user-123')).rejects.toThrow(
        ConflictException,
      );

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException ao desativar usuário inexistente', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.deactivate('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('activate', () => {
    it('deve ativar um usuário inativo', async () => {
      repository.findOneBy.mockResolvedValue(buildUser({ isActive: false }));
      repository.update.mockResolvedValue({ affected: 1 });
      repository.findOne.mockResolvedValue(buildUser({ isActive: true }));

      const result = await service.activate('user-123');

      expect(repository.update).toHaveBeenCalledWith('user-123', {
        isActive: true,
      });
      expect(result.isActive).toBe(true);
    });

    it('deve impedir a ativação de usuário já ativo', async () => {
      repository.findOneBy.mockResolvedValue(user);

      await expect(service.activate('user-123')).rejects.toThrow(
        ConflictException,
      );

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException ao ativar usuário inexistente', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.activate('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateRole', () => {
    it('deve alterar o perfil do usuário', async () => {
      repository.findOneBy.mockResolvedValue(user);
      repository.update.mockResolvedValue({ affected: 1 });
      repository.findOne.mockResolvedValue(buildUser({ role: UserRole.APPROVER }));

      const result = await service.updateRole('user-123', UserRole.APPROVER);

      expect(repository.update).toHaveBeenCalledWith('user-123', {
        role: UserRole.APPROVER,
      });
      expect(result.role).toBe(UserRole.APPROVER);
    });

    it('não deve atualizar quando o perfil já é o informado', async () => {
      repository.findOneBy.mockResolvedValue(user);
      repository.findOne.mockResolvedValue(user);

      await service.updateRole('user-123', UserRole.REQUESTER);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException ao alterar perfil de usuário inexistente', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateRole('inexistente', UserRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
