---
name: nest-backend-standard
description: Use this skill for all NestJS backend work, including modules, controllers, services, DTOs, Prisma, auth, validation, API response format, and folder structure.
---

You are working on a NestJS + TypeScript backend.

Always follow these rules:

- Inspect the existing backend structure before adding code.
- Use feature/module-based architecture.
- Do not put business logic inside controllers.
- Controllers only handle routing, guards, params, body, and calling services.
- Services contain business logic.
- Database access should go through PrismaService or repository files.
- Use DTOs for request bodies, params, and query strings.
- Use class-validator and class-transformer for validation.
- Avoid `any`.
- Use NestJS exceptions such as BadRequestException, NotFoundException, UnauthorizedException, ForbiddenException.
- Use ConfigService for environment variables.
- Never hardcode secrets, database URLs, ports, or tokens.
- Keep files small and focused.

Preferred backend folder structure:

src/
  main.ts
  app.module.ts

  config/
    env.validation.ts

  common/
    decorators/
    filters/
    guards/
    interceptors/
    pipes/
    utils/
    constants/

  database/
    prisma.module.ts
    prisma.service.ts

  modules/
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      dto/
      guards/
      strategies/

    users/
      users.module.ts
      users.controller.ts
      users.service.ts
      users.repository.ts
      dto/
      entities/

    <feature>/
      <feature>.module.ts
      <feature>.controller.ts
      <feature>.service.ts
      <feature>.repository.ts
      dto/
      entities/

REST API conventions:

- Use plural nouns for endpoints:
  - GET /products
  - GET /products/:id
  - POST /products
  - PATCH /products/:id
  - DELETE /products/:id

Response format:

{
  "success": true,
  "message": "OK",
  "data": {}
}

Error format:

{
  "success": false,
  "message": "Reason",
  "error": "ERROR_CODE"
}

DTO conventions:

- Put DTO files inside dto/
- Use kebab-case file names:
  - create-product.dto.ts
  - update-product.dto.ts
  - product-query.dto.ts
- Use PartialType for update DTOs when appropriate.
- Validate all input fields.

Naming rules:

- Files: kebab-case
- Classes: PascalCase
- Variables/functions: camelCase
- Modules: ProductsModule, UsersModule, AuthModule
- Services: ProductsService, UsersService
- Controllers: ProductsController, UsersController
- Repositories: ProductsRepository, UsersRepository

Prisma rules:

- Use prisma/schema.prisma as the database source of truth.
- Update Prisma schema before writing database logic.
- Use migrations when schema changes.
- Do not fake Prisma types manually.
- Use transactions for multi-step writes that must be atomic.

Auth/security rules:

- Hash passwords with bcrypt or argon2.
- Never return password hashes.
- Use guards for protected routes.
- Use roles/permissions through decorators and guards.
- Validate all user input.
- Do not expose internal error details to clients.

Before finishing:

- Check imports.
- Check DTO validation.
- Check module providers/controllers/exports.
- Check that the app can build.
- Prefer running lint/build/test if available.