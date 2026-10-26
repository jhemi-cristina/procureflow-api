const mockCreate = jest.fn();
const mockDocumentBuilder = jest.fn();
const mockCreateDocument = jest.fn();
const mockSetup = jest.fn();

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: mockCreate,
  },
}));

jest.mock('@nestjs/swagger', () => {
  const actual = jest.requireActual('@nestjs/swagger');

  return {
    ...actual,
    DocumentBuilder: mockDocumentBuilder,
    SwaggerModule: {
      ...actual.SwaggerModule,
      createDocument: mockCreateDocument,
      setup: mockSetup,
    },
  };
});

const ENV_KEYS = ['PORT', 'CORS_ORIGINS', 'SWAGGER_USER', 'SWAGGER_PASSWORD'] as const;

describe('main.ts', () => {
  let app: {
    enableCors: jest.Mock;
    setGlobalPrefix: jest.Mock;
    useGlobalPipes: jest.Mock;
    use: jest.Mock;
    listen: jest.Mock;
  };

  let documentBuilder: {
    setTitle: jest.Mock;
    setDescription: jest.Mock;
    setVersion: jest.Mock;
    addBearerAuth: jest.Mock;
    build: jest.Mock;
  };

  const document = { openapi: '3.0.0' };
  const originalEnv: Partial<Record<(typeof ENV_KEYS)[number], string>> = {};

  beforeAll(() => {
    for (const key of ENV_KEYS) originalEnv[key] = process.env[key];
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();

    delete process.env.PORT;
    delete process.env.CORS_ORIGINS;
    process.env.SWAGGER_USER = 'admin';
    process.env.SWAGGER_PASSWORD = 'secret';

    app = {
      enableCors: jest.fn(),
      setGlobalPrefix: jest.fn(),
      useGlobalPipes: jest.fn(),
      use: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };

    documentBuilder = {
      setTitle: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      setVersion: jest.fn().mockReturnThis(),
      addBearerAuth: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({}),
    };

    mockCreate.mockResolvedValue(app);
    mockDocumentBuilder.mockImplementation(() => documentBuilder);
    mockCreateDocument.mockReturnValue(document);
  });

  async function runBootstrap() {
    await jest.isolateModulesAsync(async () => {
      await import('./main');
    });
    await new Promise((resolve) => setImmediate(resolve));
  }

  it('deve criar a aplicação NestJS', async () => {
    await runBootstrap();

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(expect.any(Function));
  });

  it('deve liberar no CORS o front web e o app mobile por padrão', async () => {
    await runBootstrap();

    expect(app.enableCors).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: ['http://localhost:3001', 'http://localhost:8081'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      }),
    );
  });

  it('deve ler as origens do CORS da variável CORS_ORIGINS', async () => {
    process.env.CORS_ORIGINS = 'https://app.exemplo.com, https://admin.exemplo.com,';

    await runBootstrap();

    expect(app.enableCors).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: ['https://app.exemplo.com', 'https://admin.exemplo.com'],
      }),
    );
  });

  it('deve configurar o prefixo global da API', async () => {
    await runBootstrap();

    expect(app.setGlobalPrefix).toHaveBeenCalledWith('api/v1');
  });

  it('deve configurar a validação global', async () => {
    await runBootstrap();

    expect(app.useGlobalPipes).toHaveBeenCalledTimes(1);

    const validationPipe = app.useGlobalPipes.mock.calls[0][0];

    expect(validationPipe.constructor.name).toBe('ValidationPipe');

    expect(validationPipe['validatorOptions']).toMatchObject({
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(validationPipe['isTransformEnabled']).toBe(true);
  });

  it('deve proteger a documentação Swagger com basic auth', async () => {
    await runBootstrap();

    expect(app.use).toHaveBeenCalledWith(
      ['/api/docs', '/api/docs-json'],
      expect.any(Function),
    );
  });

  it('deve configurar a documentação Swagger', async () => {
    await runBootstrap();

    expect(documentBuilder.setTitle).toHaveBeenCalledWith('ProcureFlow API');
    expect(documentBuilder.setDescription).toHaveBeenCalledWith(
      'API para gerenciamento de usuários e solicitações de compra, incluindo autenticação JWT e fluxo de aprovação.',
    );
    expect(documentBuilder.setVersion).toHaveBeenCalledWith('1.0');
    expect(documentBuilder.addBearerAuth).toHaveBeenCalledTimes(1);
    expect(mockCreateDocument).toHaveBeenCalledTimes(1);
    expect(mockSetup).toHaveBeenCalledWith('api/docs', app, document);
  });

  it('deve usar a porta 3000 quando PORT não for informada', async () => {
    await runBootstrap();

    expect(app.listen).toHaveBeenCalledTimes(1);
    expect(String(app.listen.mock.calls[0][0])).toBe('3000');
  });

  it('deve usar a porta definida em PORT', async () => {
    process.env.PORT = '4000';

    await runBootstrap();

    expect(app.listen).toHaveBeenCalledWith('4000');
  });
});
