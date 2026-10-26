import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseRequestsController } from './purchase-requests.controller';
import { PurchaseRequestsService } from './purchase-requests.service';
import { UsersService } from '../users/users.service';

describe('PurchaseRequestsController', () => {
  let controller: PurchaseRequestsController;

  let purchaseRequestsService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findPendingApprovals: jest.Mock;
    findTeam: jest.Mock;
    findRecent: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    submit: jest.Mock;
    decide: jest.Mock;
  };

  let usersService: {
    findById: jest.Mock;
  };

  const user = {
    id: 'user-123',
    name: 'Usuário de teste',
    email: 'teste@example.com',
    role: 'requester',
    isActive: true,
  };

  const request = {
    id: 'request-123',
    title: 'Compra de notebook',
    description: 'Notebook para a equipe',
    status: 'draft',
  };

  const authenticatedRequest = {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };

  beforeEach(async () => {
    purchaseRequestsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findPendingApprovals: jest.fn(),
      findTeam: jest.fn(),
      findRecent: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      submit: jest.fn(),
      decide: jest.fn(),
    };

    usersService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseRequestsController],
      providers: [
        {
          provide: PurchaseRequestsService,
          useValue: purchaseRequestsService,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<PurchaseRequestsController>(
      PurchaseRequestsController,
    );
  });

  it('deve definir o controller', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('deve buscar o usuário autenticado e criar uma solicitação', async () => {
      const dto = {
        title: 'Compra de notebook',
        description: 'Notebook para a equipe',
        estimatedAmount: 5000,
      };

      usersService.findById.mockResolvedValue(user);
      purchaseRequestsService.create.mockResolvedValue(request);

      await expect(
        controller.create(dto, authenticatedRequest as any),
      ).resolves.toEqual(request);

      expect(usersService.findById).toHaveBeenCalledWith(user.id);
      expect(purchaseRequestsService.create).toHaveBeenCalledWith(dto, user);
    });
  });

  describe('findAll', () => {
    it('deve listar as solicitações do usuário autenticado', async () => {
      purchaseRequestsService.findAll.mockResolvedValue([request]);

      await expect(
        controller.findAll(authenticatedRequest as any),
      ).resolves.toEqual([request]);

      expect(purchaseRequestsService.findAll).toHaveBeenCalledWith(user.id);
    });
  });

  describe('findPendingApprovals', () => {
    it('deve retornar a fila de aprovação', async () => {
      purchaseRequestsService.findPendingApprovals.mockResolvedValue([request]);

      await expect(controller.findPendingApprovals()).resolves.toEqual([request]);

      expect(purchaseRequestsService.findPendingApprovals).toHaveBeenCalledTimes(1);
    });
  });

  describe('findTeam', () => {
    it('deve listar as solicitações da equipe para o usuário autenticado', async () => {
      purchaseRequestsService.findTeam.mockResolvedValue([request]);

      await expect(
        controller.findTeam(authenticatedRequest as any),
      ).resolves.toEqual([request]);

      expect(purchaseRequestsService.findTeam).toHaveBeenCalledWith(user.id);
    });
  });

  describe('findRecent', () => {
    it('deve listar as recentes da equipe para o usuário autenticado', async () => {
      purchaseRequestsService.findRecent.mockResolvedValue([request]);

      await expect(
        controller.findRecent(authenticatedRequest as any, 5),
      ).resolves.toEqual([request]);

      expect(purchaseRequestsService.findRecent).toHaveBeenCalledWith(user.id, 5);
    });
  });

  describe('findOne', () => {
    it('deve consultar uma solicitação pelo ID e usuário', async () => {
      purchaseRequestsService.findOne.mockResolvedValue(request);

      await expect(
        controller.findOne('request-123', authenticatedRequest as any),
      ).resolves.toEqual(request);

      expect(purchaseRequestsService.findOne).toHaveBeenCalledWith(
        'request-123',
        user.id,
        { canViewAll: false },
      );
    });

    it.each(['admin', 'approver'])(
      'deve permitir que o perfil %s consulte solicitações de outros usuários',
      async (role) => {
        purchaseRequestsService.findOne.mockResolvedValue(request);

        await controller.findOne('request-123', {
          user: { ...authenticatedRequest.user, role },
        } as any);

        expect(purchaseRequestsService.findOne).toHaveBeenCalledWith(
          'request-123',
          user.id,
          { canViewAll: true },
        );
      },
    );
  });

  describe('update', () => {
    it('deve atualizar uma solicitação usando o ID, usuário e DTO', async () => {
      const dto = {
        title: 'Notebook atualizado',
      };

      const updatedRequest = {
        ...request,
        title: dto.title,
      };

      purchaseRequestsService.update.mockResolvedValue(updatedRequest);

      await expect(
        controller.update(
          'request-123',
          dto,
          authenticatedRequest as any,
        ),
      ).resolves.toEqual(updatedRequest);

      expect(purchaseRequestsService.update).toHaveBeenCalledWith(
        'request-123',
        user.id,
        dto,
      );
    });
  });

  describe('submit', () => {
    it('deve enviar a solicitação para aprovação', async () => {
      const submittedRequest = {
        ...request,
        status: 'pending',
      };

      purchaseRequestsService.submit.mockResolvedValue(submittedRequest);

      await expect(
        controller.submit('request-123', authenticatedRequest as any),
      ).resolves.toEqual(submittedRequest);

      expect(purchaseRequestsService.submit).toHaveBeenCalledWith(
        'request-123',
        user.id,
      );
    });
  });

  describe('decide', () => {
    it('deve buscar o aprovador e registrar a decisão', async () => {
      const dto = {
        status: 'approved',
        reason: 'Compra autorizada',
      };

      const decidedRequest = {
        ...request,
        status: 'approved',
        decidedBy: user.id,
      };

      usersService.findById.mockResolvedValue(user);
      purchaseRequestsService.decide.mockResolvedValue(decidedRequest);

      await expect(
        controller.decide(
          'request-123',
          dto,
          authenticatedRequest as any,
        ),
      ).resolves.toEqual(decidedRequest);

      expect(usersService.findById).toHaveBeenCalledWith(user.id);
      expect(purchaseRequestsService.decide).toHaveBeenCalledWith(
        'request-123',
        user,
        dto,
      );
    });
  });
});
