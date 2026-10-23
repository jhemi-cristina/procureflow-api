
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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { PurchaseRequestsService } from './purchase-requests.service';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';
import { DecidePurchaseRequestDto } from './dto/decide-purchase-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Solicitações de compra')
@ApiBearerAuth()
@Controller('purchase-requests')
@UseGuards(JwtAuthGuard)
export class PurchaseRequestsController {
  constructor(
    private readonly purchaseRequestsService: PurchaseRequestsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Criar solicitação de compra',
    description: 'Cria uma solicitação em estado de rascunho para o usuário autenticado.',
  })
  @ApiResponse({ status: 201, description: 'Solicitação criada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  async create(
    @Body() dto: CreatePurchaseRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const requester = await this.usersService.findById(req.user.id);
    return this.purchaseRequestsService.create(dto, requester);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar minhas solicitações',
    description: 'Retorna somente as solicitações do usuário autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Solicitações retornadas com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.purchaseRequestsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar uma solicitação' })
  @ApiParam({ name: 'id', description: 'UUID da solicitação de compra' })
  @ApiResponse({ status: 200, description: 'Solicitação encontrada.' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada ou não pertence ao usuário.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.purchaseRequestsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar uma solicitação',
    description: 'Permite editar uma solicitação própria enquanto estiver em rascunho.',
  })
  @ApiParam({ name: 'id', description: 'UUID da solicitação de compra' })
  @ApiResponse({ status: 200, description: 'Solicitação atualizada.' })
  @ApiResponse({ status: 403, description: 'A solicitação não está em rascunho.' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.purchaseRequestsService.update(id, req.user.id, dto);
  }

  @Patch(':id/submit')
  @ApiOperation({
    summary: 'Enviar solicitação para aprovação',
    description: 'Altera o status de uma solicitação própria de rascunho para pendente.',
  })
  @ApiParam({ name: 'id', description: 'UUID da solicitação de compra' })
  @ApiResponse({ status: 200, description: 'Solicitação enviada para aprovação.' })
  @ApiResponse({ status: 403, description: 'A solicitação não pode ser enviada neste estado.' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  submit(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.purchaseRequestsService.submit(id, req.user.id);
  }

  @Patch(':id/decision')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.APPROVER)
  @ApiOperation({
    summary: 'Aprovar ou rejeitar solicitação',
    description: 'Disponível apenas para usuários com perfil administrador ou aprovador.',
  })
  @ApiParam({ name: 'id', description: 'UUID da solicitação de compra' })
  @ApiResponse({ status: 200, description: 'Decisão registrada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Decisão inválida.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão ou solicitação não pendente.' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada.' })
  async decide(
    @Param('id') id: string,
    @Body() dto: DecidePurchaseRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const approver = await this.usersService.findById(req.user.id);

    return this.purchaseRequestsService.decide(id, approver, dto);
  }
}
