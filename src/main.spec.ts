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

describe('main.ts', () => {
  let app: {
    setGlobalPrefix: jest.Mock;
    useGlobalPipes: jest.Mock;
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

  beforeEach(() => {
    jest.clearAllMocks();

    app = {
      setGlobalPrefix: jest.fn(),
      useGlobalPipes: jest.fn(),
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
  }

  it('deve criar a aplicação NestJS', async () => {
    await runBootstrap();

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(expect.any(Function));
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

  it('deve usar a porta 3000 quando PORT não estiver definida', async () => {
    const originalPort = process.env.PORT;
    delete process.env.PORT;

    try {
      await runBootstrap();

      expect(app.listen).toHaveBeenCalledWith('3000');
    } finally {
      if (originalPort === undefined) {
        delete process.env.PORT;
      } else {
        process.env.PORT = originalPort;
      }
    }
  });
});
