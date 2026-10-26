import {
  Injectable,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import {
  PurchaseRequest,
  PurchaseRequestStatus,
} from './entities/purchase-request.entity';
import { User } from '../users/entities/user.entity';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';
import { DecidePurchaseRequestDto } from './dto/decide-purchase-request.dto';

@Injectable()
export class PurchaseRequestsService {
  constructor(
    @InjectRepository(PurchaseRequest)
    private readonly purchaseRequestsRepository: Repository<PurchaseRequest>,
  ) {}

  async create(
    dto: CreatePurchaseRequestDto,
    requester: User,
  ): Promise<PurchaseRequest> {
    const purchaseRequest = this.purchaseRequestsRepository.create({
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      estimatedAmount: dto.estimatedAmount,
      status: PurchaseRequestStatus.DRAFT,
      requester,
    });

    return this.purchaseRequestsRepository.save(purchaseRequest);
  }

  async findAll(requesterId: string): Promise<PurchaseRequest[]> {
    return this.purchaseRequestsRepository.find({
      where: {
        requester: { id: requesterId },
      },
      relations: {
        requester: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findPendingApprovals(): Promise<PurchaseRequest[]> {
    return this.purchaseRequestsRepository.find({
      where: {
        status: PurchaseRequestStatus.PENDING,
      },
      relations: {
        requester: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async findRecent(userId: string, limit = 10): Promise<PurchaseRequest[]> {
    const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));

    return this.purchaseRequestsRepository.find({
      where: [
        { status: Not(PurchaseRequestStatus.DRAFT) },
        { requester: { id: userId } },
      ],
      relations: {
        requester: true,
      },
      order: {
        createdAt: 'DESC',
      },
      take: safeLimit,
    });
  }

  async findOne(
    id: string,
    requesterId: string,
    { canViewAll = false }: { canViewAll?: boolean } = {},
  ): Promise<PurchaseRequest> {
    const purchaseRequest = await this.purchaseRequestsRepository.findOne({
      where: canViewAll ? { id } : { id, requester: { id: requesterId } },
      relations: {
        requester: true,
        decidedBy: true,
      },
    });

    if (!purchaseRequest) {
      throw new NotFoundException(
        'Solicitação de compra não encontrada.',
      );
    }

    return purchaseRequest;
  }
  
async update(
  id: string,
  requesterId: string,
  dto: UpdatePurchaseRequestDto,
): Promise<PurchaseRequest> {
  const purchaseRequest = await this.purchaseRequestsRepository.findOne({
    where: {
      id,
      requester: { id: requesterId },
    },
  });

  if (!purchaseRequest) {
    throw new NotFoundException(
      'Solicitação de compra não encontrada.',
    );
  }

  if (purchaseRequest.status !== PurchaseRequestStatus.DRAFT) {
    throw new ForbiddenException(
      'Somente solicitações em rascunho podem ser editadas.',
    );
  }

  if (dto.title !== undefined) {
    purchaseRequest.title = dto.title.trim();
  }

  if (dto.description !== undefined) {
    purchaseRequest.description = dto.description?.trim() || null;
  }

  if (dto.estimatedAmount !== undefined) {
    purchaseRequest.estimatedAmount = dto.estimatedAmount;
  }

  return this.purchaseRequestsRepository.save(purchaseRequest);
}

async submit(
  id: string,
  requesterId: string,
): Promise<PurchaseRequest> {
  const purchaseRequest = await this.purchaseRequestsRepository.findOne({
    where: {
      id,
      requester: { id: requesterId },
    },
  });

  if (!purchaseRequest) {
    throw new NotFoundException(
      'Solicitação de compra não encontrada.',
    );
  }

  if (purchaseRequest.status !== PurchaseRequestStatus.DRAFT) {
    throw new ForbiddenException(
      'Somente solicitações em rascunho podem ser enviadas para aprovação.',
    );
  }

  purchaseRequest.status = PurchaseRequestStatus.PENDING;

  return this.purchaseRequestsRepository.save(purchaseRequest);
}

async decide(
  id: string,
  approver: User,
  dto: DecidePurchaseRequestDto,
): Promise<PurchaseRequest> {
  const purchaseRequest = await this.purchaseRequestsRepository.findOne({
    where: { id },
  });

  if (!purchaseRequest) {
    throw new NotFoundException(
      'Solicitação de compra não encontrada.',
    );
  }

  if (purchaseRequest.status !== PurchaseRequestStatus.PENDING) {
    throw new ForbiddenException(
      'Somente solicitações pendentes podem ser aprovadas ou rejeitadas.',
    );
  }

  purchaseRequest.status =
    dto.decision === 'approved'
      ? PurchaseRequestStatus.APPROVED
      : PurchaseRequestStatus.REJECTED;

  purchaseRequest.decidedBy = approver;
  purchaseRequest.decidedAt = new Date();
  purchaseRequest.decisionReason = dto.reason?.trim() || null;

  return this.purchaseRequestsRepository.save(purchaseRequest);
}

}
