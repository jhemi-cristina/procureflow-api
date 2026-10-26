import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmailForAuthentication(
  email: string,
): Promise<User | null> {
  return this.usersRepository
    .createQueryBuilder('user')
    .addSelect('user.passwordHash')
    .where('user.email = :email', {
      email: email.trim().toLowerCase(),
    })
    .getOne();
}

  async create(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.usersRepository.findOneBy({
      email,
    });

    if (existingUser) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.usersRepository.create({
      name: dto.name.trim(),
      email,
      passwordHash,
    });

    const savedUser = await this.usersRepository.save(user);

    return {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      isActive: savedUser.isActive,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };
  }
  
    async findActiveById(id: string): Promise<User | null> {
        return this.usersRepository.findOneBy({
        id,
        isActive: true,
      });
    }

    
  async findAll(page = 1, limit = 10) {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(
      100,
      Math.max(1, Math.floor(limit)),
    );

    const [users, total] = await this.usersRepository.findAndCount({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      data: users,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }


  async findById(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }
  async update(id: string, dto: UpdateUserDto) {
  if (dto.name === undefined && dto.email === undefined) {
    throw new BadRequestException(
      'Informe ao menos um campo para atualizar.',
    );
  }

  const user = await this.usersRepository.findOneBy({ id });

  if (!user) {
    throw new NotFoundException('Usuário não encontrado.');
  }

  const updates: Partial<User> = {};

  if (dto.name !== undefined) {
    const name = dto.name.trim();

    if (name.length < 2) {
      throw new BadRequestException(
        'O nome deve ter pelo menos 2 caracteres.',
      );
    }

    updates.name = name;
  }

  if (dto.email !== undefined) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.usersRepository.findOneBy({ email });

    if (existingUser && existingUser.id !== id) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    updates.email = email;
  }

  await this.usersRepository.update(id, updates);

  return this.findById(id);
}
  async deactivate(id: string) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (!user.isActive) {
      throw new ConflictException('Este usuário já está desativado.');
    }

    await this.usersRepository.update(id, {
      isActive: false,
    });

    return this.findById(id);
  }
    async activate(id: string) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (user.isActive) {
      throw new ConflictException('Este usuário já está ativo.');
    }

    await this.usersRepository.update(id, {
      isActive: true,
    });

    return this.findById(id);
  }

  async updateRole(id: string, role: UserRole) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (user.role !== role) {
      await this.usersRepository.update(id, { role });
    }

    return this.findById(id);
  }
}