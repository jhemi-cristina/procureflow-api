
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { AppModule } from './../src/app.module';
import { User, UserRole } from './../src/users/entities/user.entity';
import { PurchaseRequest } from './../src/purchase-requests/entities/purchase-request.entity';

describe('ProcureFlow API (e2e)', () => {
  let app: INestApplication<App>;
  let usersRepository: Repository<User>;
  let purchaseRequestsRepository: Repository<PurchaseRequest>;

  let accessToken: string;
  let approverToken: string;
  let purchaseRequestId: string;
  let rejectionRequestId: string;

  const password = 'SenhaE2E123!';
  const email = `e2e-${Date.now()}@example.com`;
  const approverEmail = `approver-e2e-${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    usersRepository = app.get<Repository<User>>(
      getRepositoryToken(User),
    );
    purchaseRequestsRepository = app.get<Repository<PurchaseRequest>>(
      getRepositoryToken(PurchaseRequest),
    );

    await app.init();
  });

  afterAll(async () => {
    try {
      const userEmails = [email, approverEmail];
      const users = await usersRepository.find({
        where: userEmails.map((userEmail) => ({ email: userEmail })),
      });

      for (const user of users) {
        await purchaseRequestsRepository.delete({
          requester: { id: user.id },
        });

        await purchaseRequestsRepository.delete({
          decidedBy: { id: user.id },
        });
      }

      for (const user of users) {
        await usersRepository.delete({ id: user.id });
      }
    } finally {
      await app?.close();
    }
  });

  it('GET /api/v1 deve retornar Hello World', async () => {
    await request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect('Hello World!');
  });

  it('deve cadastrar um usuário', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send({ name: 'Usuário E2E', email, password })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Usuário E2E',
      email,
      role: UserRole.REQUESTER,
      isActive: true,
    });

    expect(response.body).not.toHaveProperty('password');
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('deve rejeitar o cadastro com e-mail duplicado', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .send({ name: 'Usuário E2E', email, password })
      .expect(409);
  });

  it('deve autenticar com credenciais válidas', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    expect(response.body).toMatchObject({
      access_token: expect.any(String),
      token_type: 'Bearer',
      user: { email, name: 'Usuário E2E' },
    });

    accessToken = response.body.access_token;

    expect(response.body.user).not.toHaveProperty('password');
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('deve rejeitar uma senha incorreta', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'SenhaIncorreta123!' })
      .expect(401);
  });

  it('deve negar acesso ao perfil sem token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/profile')
      .expect(401);
  });

  it('deve negar acesso às solicitações sem token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/purchase-requests')
      .expect(401);
  });

  it('deve criar uma solicitação em rascunho', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/purchase-requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Compra de notebooks',
        description: 'Notebooks para a equipe',
        estimatedAmount: '12500.00',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      title: 'Compra de notebooks',
      description: 'Notebooks para a equipe',
      estimatedAmount: '12500.00',
      status: 'draft',
    });

    expect(response.body.id).toEqual(expect.any(String));
    purchaseRequestId = response.body.id;
  });

  it('deve listar as próprias solicitações', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/purchase-requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: purchaseRequestId,
          title: 'Compra de notebooks',
          status: 'draft',
        }),
      ]),
    );
  });

  it('deve consultar uma solicitação pelo ID', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/purchase-requests/${purchaseRequestId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: purchaseRequestId,
      title: 'Compra de notebooks',
      status: 'draft',
    });
  });

  it('deve editar uma solicitação em rascunho', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/purchase-requests/${purchaseRequestId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Compra de notebooks atualizada' })
      .expect(200);

    expect(response.body).toMatchObject({
      id: purchaseRequestId,
      title: 'Compra de notebooks atualizada',
      status: 'draft',
    });
  });

  it('deve preparar um usuário aprovador no banco de teste', async () => {
    const passwordHash = await bcrypt.hash(password, 12);

    const approver = usersRepository.create({
      name: 'Aprovador E2E',
      email: approverEmail,
      passwordHash,
      role: UserRole.APPROVER,
      isActive: true,
    });

    await usersRepository.save(approver);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: approverEmail, password })
      .expect(200);

    approverToken = loginResponse.body.access_token;
    expect(approverToken).toEqual(expect.any(String));
  });

  it('deve impedir que requester aprove uma solicitação', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/purchase-requests/${purchaseRequestId}/decision`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ decision: 'approved' })
      .expect(403);
  });

  it('deve impedir decisão enquanto a solicitação estiver em rascunho', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/purchase-requests/${purchaseRequestId}/decision`)
      .set('Authorization', `Bearer ${approverToken}`)
      .send({ decision: 'approved' })
      .expect(403);
  });

  it('deve enviar a solicitação para aprovação', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/purchase-requests/${purchaseRequestId}/submit`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: purchaseRequestId,
      status: 'pending',
    });
  });

  it('deve aprovar uma solicitação pendente', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/purchase-requests/${purchaseRequestId}/decision`)
      .set('Authorization', `Bearer ${approverToken}`)
      .send({
        decision: 'approved',
        reason: 'Orçamento aprovado no teste E2E.',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: purchaseRequestId,
      status: 'approved',
      decisionReason: 'Orçamento aprovado no teste E2E.',
    });
  });

  it('deve rejeitar uma nova solicitação pendente', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/purchase-requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Compra para teste de rejeição',
        description: 'Solicitação criada exclusivamente para E2E',
        estimatedAmount: '500.00',
      })
      .expect(201);

    rejectionRequestId = createResponse.body.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/purchase-requests/${rejectionRequestId}/submit`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const decisionResponse = await request(app.getHttpServer())
      .patch(`/api/v1/purchase-requests/${rejectionRequestId}/decision`)
      .set('Authorization', `Bearer ${approverToken}`)
      .send({
        decision: 'rejected',
        reason: 'Valor não aprovado no teste E2E.',
      })
      .expect(200);

    expect(decisionResponse.body).toMatchObject({
      id: rejectionRequestId,
      status: 'rejected',
      decisionReason: 'Valor não aprovado no teste E2E.',
    });
  });

  it('deve rejeitar uma solicitação com título muito curto', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/purchase-requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'AB',
        estimatedAmount: '100.00',
      })
      .expect(400);
  });

  it('deve rejeitar uma solicitação com valor inválido', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/purchase-requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Compra de material',
        estimatedAmount: 'valor-inválido',
      })
      .expect(400);
  });

  it('deve rejeitar campos extras na criação de solicitação', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/purchase-requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Compra de material',
        estimatedAmount: '100.00',
        campoInesperado: true,
      })
      .expect(400);
  });

  it('deve impedir a edição após envio para aprovação', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/purchase-requests/${purchaseRequestId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Tentativa de edição após envio' })
      .expect(403);
  });

  it('deve retornar não encontrado ao consultar solicitação inexistente', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/purchase-requests/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

});
