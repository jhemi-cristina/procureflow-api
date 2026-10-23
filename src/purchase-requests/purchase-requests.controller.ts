
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { PurchaseRequestsService } from './purchase-requests.service';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('purchase-requests')
@UseGuards(JwtAuthGuard)
export class PurchaseRequestsController {
  constructor(
  private readonly purchaseRequestsService: PurchaseRequestsService,
  private readonly usersService: UsersService,
) {}

    @Post()
    async create(
    @Body() dto: CreatePurchaseRequestDto,
    @Req() req: AuthenticatedRequest,
    ) {
    const requester = await this.usersService.findById(req.user.id);

    return this.purchaseRequestsService.create(dto, requester);
    }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.purchaseRequestsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.purchaseRequestsService.findOne(id, req.user.id);
  }
}
