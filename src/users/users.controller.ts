
import {
  Body,
  Controller,
  DefaultValuePipe,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

function assertNotSelf(targetId: string, req: AuthenticatedRequest, message: string) {
  if (targetId === req.user.id) {
    throw new ForbiddenException(message);
  }
}

@ApiTags('Usuários')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastrar usuário',
    description: 'Cria uma nova conta de usuário.',
  })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado, caso essa seja a resposta implementada pelo serviço.' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar usuários',
    description: 'Lista usuários com paginação. Restrito a administradores.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página.' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Quantidade de usuários por página.' })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Apenas administradores podem listar usuários.' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
  ) {
    return this.usersService.findAll(page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar usuário por ID' })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado.' })
  @ApiResponse({ status: 400, description: 'UUID inválido.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Apenas administradores podem consultar usuários.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado.' })
  @ApiResponse({ status: 400, description: 'Dados ou UUID inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Apenas administradores podem atualizar usuários.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desativar usuário' })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário desativado.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Apenas administradores podem desativar usuários, e não é possível desativar a própria conta.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    assertNotSelf(id, req, 'Você não pode desativar a própria conta.');
    return this.usersService.deactivate(id);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Alterar perfil do usuário',
    description: 'Define o perfil de acesso (admin, approver ou requester). Restrito a administradores.',
  })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado.' })
  @ApiResponse({ status: 400, description: 'Perfil ou UUID inválido.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Apenas administradores podem alterar perfis, e não é possível alterar o próprio.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    assertNotSelf(id, req, 'Você não pode alterar o próprio perfil.');
    return this.usersService.updateRole(id, dto.role);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ativar usuário' })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário ativado.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Apenas administradores podem ativar usuários.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  activate(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.activate(id);
  }
}
