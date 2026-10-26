# ProcureFlow API

**REST API for managing purchase requests, built with NestJS, TypeScript and PostgreSQL.**

ProcureFlow is a backend project that demonstrates a modular API with authentication, access control, relational persistence and automated tests. Its goal is to centralize the management of users and purchase requests, including tracking approval and rejection decisions.

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeORM-FE0803?style=for-the-badge&logo=typeorm&logoColor=white" alt="TypeORM" />
</p>

<p align="center">
  <a href="https://github.com/jhemi-cristina/procureflow-api">GitHub Repository</a>
</p>

## ✨ Features

- **Authentication:** JWT-based authentication.
- **Access control:** guards and role-based authorization.
- **User management:** user operations and business rules.
- **Purchase requests:** management of purchase requests and their statuses.
- **Purchase decisions:** support for approval or rejection decisions, with a recorded justification.
- **Data persistence:** PostgreSQL integration using TypeORM.
- **Migrations:** versioned control of database schema changes.
- **Automated tests:** unit tests and E2E integration tests.
- **Quality checks:** linting, compilation and test coverage verification.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| TypeScript | Static typing |
| NestJS | API framework |
| PostgreSQL | Relational database |
| TypeORM | Object-relational mapping and migrations |
| JWT | Token-based authentication |
| Jest | Automated testing |
| Supertest | HTTP E2E testing |
| Oxlint | Static analysis and code quality |
| Docker | Database environment, when used in the local setup |

## 🏗️ Architecture

The project follows NestJS's modular structure, separating responsibilities by domain.

```text
procureflow-api/
├── src/
│   ├── auth/                 # Authentication and authorization
│   │   ├── guards/           # Route protection
│   │   └── strategies/       # Authentication strategies
│   ├── users/                # Users domain
│   ├── purchase-requests/    # Purchase requests
│   ├── database/
│   │   └── migrations/       # Database schema evolution
│   └── main.ts               # Application bootstrap
├── test/                     # E2E tests and configuration
├── typeorm.config.ts         # TypeORM configuration
├── typeorm.e2e.config.ts     # E2E database configuration
└── package.json
```

This structure makes the code easier to maintain, simplifies evolving business rules and allows isolated tests per module.

## ⚙️ Prerequisites

Before you start, make sure you have installed:

- [Node.js](https://nodejs.org/) in a version compatible with the project.
- npm.
- [PostgreSQL](https://www.postgresql.org/) or Docker to run the database.
- Git.

## 🚀 Installation and Running

### 1. Clone the repository

```bash
git clone https://github.com/jhemi-cristina/procureflow-api.git
cd procureflow-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root and set the variables used by the application:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=procureflow
```

Also configure the secrets and any other variables required by authentication and the current application setup.

> **Important:** do not commit `.env` files or share real credentials. Use local, secure values for each environment.

### 4. Set up the database

Create the PostgreSQL database defined in your environment variables and run the project's migrations.

```bash
npm run migration:run
```

### 5. Start the application

```bash
# Development
npm run start:dev

# Standard run
npm run start

# Production build
npm run build

# Run the compiled build
npm run start:prod
```

The API uses the `/api/v1` prefix in the E2E endpoints. Check the project's controllers for the available routes and their contracts.

## 🧪 Testing and Quality

Project quality is verified through automated tests, static analysis and compilation.

### Running tests

```bash
# Unit tests
npm run test

# Unit tests with coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

### Checking code quality

```bash
# Lint
npm run lint

# Build
npm run build
```

### Validation results

From the latest validated run during development:

| Check | Result |
|---|---:|
| Unit test suites | 14 passed |
| Unit tests | 101 passed |
| E2E suites | 1 passed |
| E2E tests | 22 passed |
| Statement coverage | 99% |
| Line coverage | 98.91% |
| Lint | 0 warnings and 0 errors |
| Build | Passed |

*These numbers reflect a test run performed during development and may change as new changes are made.*

**E2E test database:** the tests use the isolated `test/.env.e2e` configuration and require `DB_DATABASE` to be exactly `procureflow_test`. Create this database separately from the development database before running the tests. Do not use important or production data in this environment.

## 🗃️ Migrations

The project uses TypeORM migrations to version structural database changes.

```bash
# Run pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert
```

To create a new migration, use the command for the desired change and review the generated file before running it.

## 🔐 Security

The API includes JWT authentication and role-based authorization. To run the project in a real environment:

- Use strong, unique secrets for each environment.
- Never commit tokens, passwords or environment files to Git.
- Restrict database access.
- Validate permissions for sensitive operations.
- Keep dependencies up to date.
- Use HTTPS and production-appropriate settings.

## 📌 Next Steps

Possible improvements for the project include:

- Interactive API documentation with Swagger/OpenAPI.
- A CI pipeline to run lint, tests and build automatically.
- Structured monitoring and logging.
- Automated deployment to a cloud environment.
- Broader test scenarios and business rules.

---

<p align="center">
  Built with TypeScript and NestJS.
</p>
