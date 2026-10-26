import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Not } from 'typeorm';

import { PurchaseRequestsService } from './purchase-requests.service';
import {
  PurchaseRequest,
  PurchaseRequestStatus,
} from './entities/purchase-request.entity';
import { User, UserRole } from '../users/entities/user.entity';

describe('PurchaseRequestsService', () => {
  let service: PurchaseRequestsService;

  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };

  const requester = {
    id: 'requester-123',
    name: 'Maria Silva',
    email: 'maria@example.com',
    role: UserRole.REQUESTER,
    isActive: true,
  } as User;

  const approver = {
    id: 'approver-123',
    name: 'João Silva',
    email: 'joao@example.com',
    role: UserRole.APPROVER,
    isActive: true,
  } as User;

  const purchaseRequestData = {
    id: 'request-123',
    title: 'Compra de notebook',
    description: 'Notebook para desenvolvimento',
    estimatedAmount: 5000,
    status: PurchaseRequestStatus.DRAFT,
    requester,
    decidedBy: null,
    decidedAt: null,
    decisionReason: null,
    createdAt: new Date('2026-01-01'),
  };

  const purchaseRequest = purchaseRequestData as PurchaseRequest;

  const buildPurchaseRequest = (
    overrides: Partial<PurchaseRequest> = {},
  ): PurchaseRequest =>
    ({ ...purchaseRequestData, ...overrides }) as PurchaseRequest;

  beforeEach(async () => {
    jest.clearAllMocks();

    repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseRequestsService,
        {
          provide: getRepositoryToken(PurchaseRequest),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<PurchaseRequestsService>(PurchaseRequestsService);
  });

  it('deve criar o serviço', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar uma solicitação em rascunho e normalizar os campos', async () => {
      const dto = {
        title: '  Compra de notebook  ',
        description: '  Para desenvolvimento  ',
        estimatedAmount: 5000,
      };

      repository.create.mockReturnValue(purchaseRequest);
      repository.save.mockResolvedValue(purchaseRequest);

      await service.create(dto, requester);

      expect(repository.create).toHaveBeenCalledWith({
        title: 'Compra de notebook',
        description: 'Para desenvolvimento',
        estimatedAmount: 5000,
        status: PurchaseRequestStatus.DRAFT,
        requester,
      });

      expect(repository.save).toHaveBeenCalledWith(purchaseRequest);
    });

    it('deve converter descrição vazia em null', async () => {
      repository.create.mockReturnValue(purchaseRequest);
      repository.save.mockResolvedValue(purchaseRequest);

      await service.create(
        {
          title: 'Compra de notebook',
          description: '   ',
          estimatedAmount: 5000,
        },
        requester,
      );

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ description: null }),
      );
    });
  });

  describe('findAll', () => {
    it('deve listar somente as solicitações do solicitante informado', async () => {
      repository.find.mockResolvedValue([purchaseRequest]);

      const result = await service.findAll(requester.id);

      expect(repository.find).toHaveBeenCalledWith({
        where: { requester: { id: requester.id } },
        relations: { requester: true },
        order: { createdAt: 'DESC' },
      });

      expect(result).toEqual([purchaseRequest]);
    });
  });

  describe('findPendingApprovals', () => {
    it('deve listar as solicitações pendentes de todos os usuários, das mais antigas para as mais novas', async () => {
      repository.find.mockResolvedValue([purchaseRequest]);

      const result = await service.findPendingApprovals();

      expect(repository.find).toHaveBeenCalledWith({
        where: { status: PurchaseRequestStatus.PENDING },
        relations: { requester: true },
        order: { createdAt: 'ASC' },
      });

      expect(result).toEqual([purchaseRequest]);
    });
  });

  describe('findRecent', () => {
    it('deve listar as recentes da equipe, ocultando rascunhos de outros usuários', async () => {
      repository.find.mockResolvedValue([purchaseRequest]);

      const result = await service.findRecent(requester.id, 5);

      expect(repository.find).toHaveBeenCalledWith({
        where: [
          { status: Not(PurchaseRequestStatus.DRAFT) },
          { requester: { id: requester.id } },
        ],
        relations: { requester: true },
        order: { createdAt: 'DESC' },
        take: 5,
      });

      expect(result).toEqual([purchaseRequest]);
    });

    it.each([
      [0, 1],
      [500, 50],
    ])('deve limitar a quantidade %i para %i', async (limit, expected) => {
      repository.find.mockResolvedValue([]);

      await service.findRecent(requester.id, limit);

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: expected }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar uma solicitação pertencente ao solicitante', async () => {
      repository.findOne.mockResolvedValue(purchaseRequest);

      const result = await service.findOne(purchaseRequest.id, requester.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: purchaseRequest.id,
          requester: { id: requester.id },
        },
        relations: { requester: true, decidedBy: true },
      });

      expect(result).toEqual(purchaseRequest);
    });

    it('deve permitir consultar solicitações de outros usuários quando canViewAll for verdadeiro', async () => {
      repository.findOne.mockResolvedValue(purchaseRequest);

      await service.findOne(purchaseRequest.id, 'aprovador-123', { canViewAll: true });

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: purchaseRequest.id },
        relations: { requester: true, decidedBy: true },
      });
    });

    it('deve lançar NotFoundException quando a solicitação não existir ou não pertencer ao solicitante', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('inexistente', requester.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar os campos de uma solicitação em rascunho', async () => {
      const draft = buildPurchaseRequest();

      repository.findOne.mockResolvedValue(draft);
      repository.save.mockImplementation(async (value) => value);

      const result = await service.update(draft.id, requester.id, {
        title: '  Novo título  ',
        description: '  Nova descrição  ',
        estimatedAmount: 6500,
      });

      expect(result.title).toBe('Novo título');
      expect(result.description).toBe('Nova descrição');
      expect(result.estimatedAmount).toBe(6500);
      expect(repository.save).toHaveBeenCalledWith(draft);
    });

    it('deve converter descrição vazia em null', async () => {
      const draft = buildPurchaseRequest();

      repository.findOne.mockResolvedValue(draft);
      repository.save.mockImplementation(async (value) => value);

      const result = await service.update(draft.id, requester.id, {
        description: '   ',
      });

      expect(result.description).toBeNull();
    });

    it('deve permitir atualização parcial sem modificar campos omitidos', async () => {
      const draft = buildPurchaseRequest();

      repository.findOne.mockResolvedValue(draft);
      repository.save.mockImplementation(async (value) => value);

      const result = await service.update(draft.id, requester.id, {
        title: 'Novo título',
      });

      expect(result.title).toBe('Novo título');
      expect(result.description).toBe(purchaseRequest.description);
      expect(result.estimatedAmount).toBe(purchaseRequest.estimatedAmount);
    });

    it('deve impedir a edição de solicitação que não esteja em rascunho', async () => {
      repository.findOne.mockResolvedValue(
        buildPurchaseRequest({ status: PurchaseRequestStatus.PENDING }),
      );

      await expect(
        service.update(purchaseRequest.id, requester.id, {
          title: 'Alteração',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(repository.save).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando a solicitação não existir', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('inexistente', requester.id, {
          title: 'Alteração',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('submit', () => {
    it('deve enviar uma solicitação em rascunho para aprovação', async () => {
      const draft = buildPurchaseRequest();

      repository.findOne.mockResolvedValue(draft);
      repository.save.mockImplementation(async (value) => value);

      const result = await service.submit(draft.id, requester.id);

      expect(result.status).toBe(PurchaseRequestStatus.PENDING);
      expect(repository.save).toHaveBeenCalledWith(draft);
    });

    it('deve impedir o envio de solicitação que não esteja em rascunho', async () => {
      repository.findOne.mockResolvedValue(
        buildPurchaseRequest({ status: PurchaseRequestStatus.PENDING }),
      );

      await expect(
        service.submit(purchaseRequest.id, requester.id),
      ).rejects.toThrow(ForbiddenException);

      expect(repository.save).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando a solicitação não existir', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.submit('inexistente', requester.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('decide', () => {
    it('deve aprovar uma solicitação pendente e registrar a decisão', async () => {
      const pending = buildPurchaseRequest({
        status: PurchaseRequestStatus.PENDING,
      });

      repository.findOne.mockResolvedValue(pending);
      repository.save.mockImplementation(async (value) => value);

      const result = await service.decide(pending.id, approver, {
        decision: 'approved',
        reason: '  Dentro do orçamento  ',
      });

      expect(result.status).toBe(PurchaseRequestStatus.APPROVED);
      expect(result.decidedBy).toBe(approver);
      expect(result.decidedAt).toBeInstanceOf(Date);
      expect(result.decisionReason).toBe('Dentro do orçamento');
    });

    it('deve rejeitar uma solicitação pendente', async () => {
      const pending = buildPurchaseRequest({
        status: PurchaseRequestStatus.PENDING,
      });

      repository.findOne.mockResolvedValue(pending);
      repository.save.mockImplementation(async (value) => value);

      const result = await service.decide(pending.id, approver, {
        decision: 'rejected',
        reason: 'Fora do orçamento',
      });

      expect(result.status).toBe(PurchaseRequestStatus.REJECTED);
      expect(result.decisionReason).toBe('Fora do orçamento');
    });

    it('deve converter motivo vazio em null', async () => {
      const pending = buildPurchaseRequest({
        status: PurchaseRequestStatus.PENDING,
      });

      repository.findOne.mockResolvedValue(pending);
      repository.save.mockImplementation(async (value) => value);

      const result = await service.decide(pending.id, approver, {
        decision: 'approved',
        reason: '   ',
      });

      expect(result.decisionReason).toBeNull();
    });

    it('deve impedir a decisão de uma solicitação que não esteja pendente', async () => {
      repository.findOne.mockResolvedValue(purchaseRequest);

      await expect(
        service.decide(purchaseRequest.id, approver, {
          decision: 'approved',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(repository.save).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando a solicitação não existir', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.decide('inexistente', approver, {
          decision: 'approved',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
