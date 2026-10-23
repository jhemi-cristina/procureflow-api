
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { PurchaseRequestsService } from './purchase-requests.service';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';
import { DecidePurchaseRequestDto } from './dto/decide-purchase-request.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

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
  
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.purchaseRequestsService.update(
      id,
      req.user.id,
      dto,
    );
  }
  
  @Patch(':id/submit')
  submit(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.purchaseRequestsService.submit(
      id,
      req.user.id,
    );
  }

  @Patch(':id/decision')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.APPROVER)
  async decide(
    @Param('id') id: string,
    @Body() dto: DecidePurchaseRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const approver = await this.usersService.findById(req.user.id);

    return this.purchaseRequestsService.decide(
      id,
      approver,
      dto,
    );
  }


}
