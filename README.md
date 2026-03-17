# COSPEC LTD — Sistema de Reclamos

Sistema de gestión de reclamos técnicos para COSPEC LTD, empresa de telecomunicaciones de La Pampa, Argentina.

## Stack

- **Monorepo**: Turborepo 2 + pnpm workspaces
- **Backend**: NestJS 11 + Prisma 5 + PostgreSQL
- **Web Admin**: Next.js 15 (App Router) + Tailwind CSS
- **Mobile**: Expo SDK 55 (React Native) — Android + iOS
- **Tipos compartidos**: `@cospec/shared-types`

## Requisitos

- Node.js >= 20
- pnpm >= 9
- PostgreSQL

## Instalación

```bash
pnpm install
```

## Desarrollo

```bash
# Todas las apps en paralelo
pnpm dev

# Solo backend
pnpm dev --filter=@cospec/backend

# Solo web
pnpm dev --filter=@cospec/web

# Solo mobile
pnpm dev --filter=@cospec/mobile
```

## Base de datos

```bash
# Generar cliente Prisma
pnpm db:generate

# Ejecutar migraciones
pnpm db:migrate
```

## Variables de entorno

Cada app tiene su propio `.env.example`. Copiar a `.env` y completar:

### `apps/backend/.env`
```
DATABASE_URL=postgresql://user:password@localhost:5432/cospec
JWT_SECRET=your-secret-here
NODE_ENV=development
PORT=3001
```

### `apps/web/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
API_URL=http://localhost:3001/api/v1
AUTH_SECRET=cospec-web-dev-secret
NODE_ENV=development
```

### `apps/mobile/.env`
```
EXPO_PUBLIC_API_URL=http://localhost:3001/api/v1
```

> `DATABASE_URL` solo existe en `apps/backend`. Web y mobile nunca conectan directo a PostgreSQL.

## Estructura del monorepo

```
cospec-reclamos/
├── apps/
│   ├── backend/     # NestJS 11 — API REST
│   ├── web/         # Next.js 15 — Panel admin
│   └── mobile/      # Expo SDK 52 — App técnicos (Android)
├── packages/
│   ├── shared-types/  # @cospec/shared-types — interfaces y enums
│   ├── shared-utils/  # @cospec/shared-utils — funciones puras
│   └── db/           # @cospec/db — Prisma client + schema
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Servicios soportados

- Internet Fibra Óptica
- Internet ADSL
- Telefonía Línea Fija
- TV Sensa

## Estados de reclamo

`PENDIENTE` → `ASIGNADO` → `EN_PROGRESO` → `RESUELTO`  
`ASIGNADO` / `EN_PROGRESO` → `CANCELADO` (cliente avisa que ya funciona)
