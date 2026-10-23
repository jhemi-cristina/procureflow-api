
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  PurchaseRequest,
  PurchaseRequestStatus,
} from './entities/purchase-request.entity';
import { User } from '../users/entities/user.entity';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';

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

  async findOne(
    id: string,
    requesterId: string,
  ): Promise<PurchaseRequest> {
    const purchaseRequest = await this.purchaseRequestsRepository.findOne({
      where: {
        id,
        requester: { id: requesterId },
      },
      relations: {
        requester: true,
      },
    });

    if (!purchaseRequest) {
      throw new NotFoundException(
        'Solicitação de compra não encontrada.',
      );
    }

    return purchaseRequest;
  }
}
