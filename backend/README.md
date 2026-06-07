# Backend

Node.js + Express.js API for a small/medium web project.

## Stack

- Express.js
- Prisma
- MySQL
- JWT auth
- Zod validation

## Setup

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Update `.env` before running Prisma:

```txt
DATABASE_URL="mysql://root:password@localhost:3306/chithuy"
JWT_SECRET="change-this-secret"
```

## API

Base URL:

```txt
http://localhost:4000/api
```

Health:

```txt
GET /health
```

Auth:

```txt
POST /auth/register
POST /auth/login
```

Users:

```txt
GET /users
GET /users/me
GET /users/:id
PATCH /users/:id
DELETE /users/:id
```

Protected user routes require:

```txt
Authorization: Bearer <token>
```

Success response format:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```
