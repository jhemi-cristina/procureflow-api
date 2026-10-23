
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PurchaseRequestsService } from './purchase-requests.service';
import {
  PurchaseRequest,
  PurchaseRequestStatus,
} from './entities/purchase-request.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('PurchaseRequestsService', () => {
  let service: PurchaseRequestsService;

  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(async () => {
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

    service = module.get<PurchaseRequestsService>(
      PurchaseRequestsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a purchase request with draft status', async () => {
    const requester = {
      id: 'user-123',
    } as any;

    const dto = {
      title: 'Compra de notebooks',
      description: 'Notebooks para a equipe',
      estimatedAmount: '5000.00',
    };

    const purchaseRequest = {
      ...dto,
      title: dto.title.trim(),
      description: dto.description,
      status: PurchaseRequestStatus.DRAFT,
      requester,
    };

    repository.create.mockReturnValue(purchaseRequest);

    repository.save.mockResolvedValue({
      id: 'request-123',
      ...purchaseRequest,
    });

    const result = await service.create(dto, requester);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Compra de notebooks',
        estimatedAmount: '5000.00',
        status: PurchaseRequestStatus.DRAFT,
        requester,
      }),
    );

    expect(repository.save).toHaveBeenCalled();
    expect(result.status).toBe(PurchaseRequestStatus.DRAFT);
    expect(result.requester).toBe(requester);
  });

  
  it('should not allow editing a purchase request that is not a draft', async () => {
    repository.findOne.mockResolvedValue({
      id: 'request-123',
      title: 'Compra de notebooks',
      estimatedAmount: '5000.00',
      status: PurchaseRequestStatus.PENDING,
      requester: { id: 'user-123' },
    });

    await expect(
      service.update('request-123', 'user-123', {
        title: 'Novo título para a compra',
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should submit a draft purchase request for approval', async () => {
    const draftRequest = {
      id: 'request-123',
      title: 'Compra de notebooks',
      estimatedAmount: '5000.00',
      status: PurchaseRequestStatus.DRAFT,
      requester: { id: 'user-123' },
    };

    repository.findOne.mockResolvedValue(draftRequest);

    repository.save.mockImplementation(async (request) => request);

    const result = await service.submit('request-123', 'user-123');

    expect(result.status).toBe(PurchaseRequestStatus.PENDING);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: PurchaseRequestStatus.PENDING,
      }),
    );
  });

  
  it('should approve a pending purchase request and record the approver', async () => {
    const pendingRequest = {
      id: 'request-123',
      title: 'Compra de notebooks',
      estimatedAmount: '5000.00',
      status: PurchaseRequestStatus.PENDING,
      requester: { id: 'user-123' },
      decidedBy: null,
      decidedAt: null,
      decisionReason: null,
    };

    const approver = {
      id: 'approver-123',
    } as any;

    repository.findOne.mockResolvedValue(pendingRequest);
    repository.save.mockImplementation(async (request) => request);

    const result = await service.decide('request-123', approver, {
      decision: 'approved',
      reason: 'Dentro do orçamento.',
    });

    expect(result.status).toBe(PurchaseRequestStatus.APPROVED);
    expect(result.decidedBy).toBe(approver);
    expect(result.decidedAt).toBeInstanceOf(Date);
    expect(result.decisionReason).toBe('Dentro do orçamento.');
    expect(repository.save).toHaveBeenCalled();
  });

  it('should reject a pending purchase request and record the reason', async () => {
    const pendingRequest = {
      id: 'request-456',
      title: 'Compra de monitores',
      estimatedAmount: '3000.00',
      status: PurchaseRequestStatus.PENDING,
      requester: { id: 'user-123' },
      decidedBy: null,
      decidedAt: null,
      decisionReason: null,
    };

    const approver = {
      id: 'approver-123',
    } as any;

    repository.findOne.mockResolvedValue(pendingRequest);
    repository.save.mockImplementation(async (request) => request);

    const result = await service.decide('request-456', approver, {
      decision: 'rejected',
      reason: 'Valor acima do orçamento disponível.',
    });

    expect(result.status).toBe(PurchaseRequestStatus.REJECTED);
    expect(result.decidedBy).toBe(approver);
    expect(result.decidedAt).toBeInstanceOf(Date);
    expect(result.decisionReason).toBe(
      'Valor acima do orçamento disponível.',
    );
    expect(repository.save).toHaveBeenCalled();
  });

  it('should not allow a requester to access another user purchase request', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.findOne('request-from-another-user', 'user-123'),
    ).rejects.toThrow(NotFoundException);

    expect(repository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'request-from-another-user',
          requester: { id: 'user-123' },
        }),
      }),
    );
  });

});
