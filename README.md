# ProcureFlow API

**API REST para gerenciamento de solicitações de compra, desenvolvida com NestJS, TypeScript e PostgreSQL.**

O ProcureFlow é um projeto de backend que demonstra a implementação de uma API organizada em módulos, com autenticação, controle de acesso, persistência relacional e testes automatizados. O objetivo é centralizar o gerenciamento de usuários e solicitações de compra, incluindo o acompanhamento de decisões de aprovação ou rejeição.

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeORM-FE0803?style=for-the-badge&logo=typeorm&logoColor=white" alt="TypeORM" />
</p>

<p align="center">
  <a href="https://github.com/jhemi-cristina/procureflow-api">Repositório no GitHub</a>
</p>

## ✨ Funcionalidades

- **Autenticação:** estrutura de autenticação baseada em JWT.
- **Controle de acesso:** guards e autorização baseada em papéis (*roles*).
- **Gerenciamento de usuários:** operações e regras de negócio para usuários.
- **Solicitações de compra:** gerenciamento de solicitações e seus estados.
- **Decisões de compra:** suporte a decisões de aprovação ou rejeição, com registro de justificativa.
- **Persistência de dados:** integração com PostgreSQL utilizando TypeORM.
- **Migrations:** controle versionado da evolução do banco de dados.
- **Testes automatizados:** testes unitários e testes de integração E2E.
- **Validação de qualidade:** lint, compilação e verificação de cobertura de testes.

## 🛠️ Tecnologias

| Tecnologia | Utilização |
|---|---|
| Node.js | Ambiente de execução |
| TypeScript | Tipagem estática |
| NestJS | Framework para desenvolvimento da API |
| PostgreSQL | Banco de dados relacional |
| TypeORM | Mapeamento objeto-relacional e migrations |
| JWT | Autenticação baseada em tokens |
| Jest | Testes automatizados |
| Supertest | Testes HTTP E2E |
| Oxlint | Análise estática e qualidade do código |
| Docker | Ambiente de banco de dados, quando utilizado na configuração local |

## 🏗️ Arquitetura

O projeto utiliza a organização modular do NestJS, separando responsabilidades por domínio.

```text
procureflow-api/
├── src/
│   ├── auth/                 # Autenticação e autorização
│   │   ├── guards/           # Proteção de rotas
│   │   └── strategies/       # Estratégias de autenticação
│   ├── users/                # Domínio de usuários
│   ├── purchase-requests/    # Solicitações de compra
│   ├── database/
│   │   └── migrations/       # Evolução do banco de dados
│   └── main.ts               # Inicialização da aplicação
├── test/                     # Testes E2E e configuração
├── typeorm.config.ts         # Configuração do TypeORM
├── typeorm.e2e.config.ts     # Configuração do banco para E2E
└── package.json
```

Essa estrutura facilita a manutenção, a evolução das regras de negócio e a criação de testes isolados por módulo.

## ⚙️ Pré-requisitos

Antes de começar, você precisa ter instalado:

- [Node.js](https://nodejs.org/) em uma versão compatível com o projeto.
- npm.
- [PostgreSQL](https://www.postgresql.org/)  ou Docker para executar o banco de dados.
- Git.

## 🚀 Instalação e execução

### 1. Clone o repositório

```bash
git clone https://github.com/jhemi-cristina/procureflow-api.git
cd procureflow-api
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto e configure as variáveis utilizadas pela aplicação:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
DB_DATABASE=procureflow
```

Configure também os segredos e demais variáveis exigidos pela autenticação e pela configuração atual da aplicação.

> **Importante:** não versione arquivos `.env` nem compartilhe credenciais reais. Utilize valores locais e seguros para cada ambiente.

### 4. Prepare o banco de dados

Crie o banco PostgreSQL configurado nas variáveis de ambiente e aplique as migrations disponíveis no projeto.

```bash
npm run migration:run
```

### 5. Inicie a aplicação

```bash
# Desenvolvimento
npm run start:dev

# Execução convencional
npm run start

# Compilação para produção
npm run build

# Execução da versão compilada
npm run start:prod
```

A API utiliza o prefixo `/api/v1` nos endpoints E2E. Consulte os controllers do projeto para verificar as rotas disponíveis e os respectivos contratos.

## 🧪 Testes e qualidade

A qualidade do projeto é verificada com testes automatizados, análise estática e compilação.

### Executar os testes

```bash
# Testes unitários
npm run test

# Testes unitários com cobertura
npm run test:cov

# Testes E2E
npm run test:e2e
```

### Verificar a qualidade do código

```bash
# Lint
npm run lint

# Build
npm run build
```

### Resultados de validação

Na última execução validada durante o desenvolvimento:

| Verificação | Resultado |
|---|---:|
| Suítes de testes unitários | 14 aprovadas |
| Testes unitários | 101 aprovados |
| Suítes E2E | 1 aprovada |
| Testes E2E | 22 aprovados |
| Cobertura de statements | 99% |
| Cobertura de linhas | 98,91% |
| Lint | 0 warnings e 0 erros |
| Build | Aprovado |

*Os números representam a execução de testes realizada durante o desenvolvimento e podem variar conforme novas alterações forem feitas.*

**Banco de dados dos testes E2E:** os testes utilizam a configuração isolada `test/.env.e2e` e exigem que `DB_DATABASE` seja exatamente `procureflow_test`. Crie esse banco separadamente do banco de desenvolvimento antes de executar os testes. Não utilize dados importantes ou de produção nesse ambiente.

## 🗃️ Migrations

O projeto utiliza migrations do TypeORM para versionar as alterações estruturais do banco de dados.

```bash
# Executar migrations pendentes
npm run migration:run

# Reverter a última migration
npm run migration:revert
```

Para gerar uma nova migration, utilize o comando correspondente à alteração desejada e revise o arquivo gerado antes de executá-lo.

## 🔐 Segurança

A API possui uma estrutura de autenticação JWT e mecanismos de autorização por papéis. Para executar o projeto em um ambiente real:

- Utilize segredos fortes e exclusivos por ambiente.
- Nunca envie tokens, senhas ou arquivos de ambiente para o Git.
- Restrinja o acesso ao banco de dados.
- Valide as permissões das operações sensíveis.
- Mantenha as dependências atualizadas.
- Utilize HTTPS e configurações adequadas ao ambiente de produção.

## 📌 Próximos passos

Possíveis evoluções para o projeto incluem:

- Documentação interativa da API com Swagger/OpenAPI.
- Pipeline de CI para executar lint, testes e build automaticamente.
- Monitoramento e logging estruturados.
- Deploy automatizado em um ambiente de nuvem.
- Ampliação dos cenários de teste e das regras de negócio.

---

<p align="center">
  Desenvolvido com TypeScript e NestJS.
</p>
