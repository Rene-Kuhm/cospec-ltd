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

## Servicios soportados

- Internet Fibra Óptica
- Internet ADSL
- Telefonía Línea Fija
- TV Sensa

## Estados de reclamo

`PENDIENTE` → `ASIGNADO` → `EN_PROGRESO` → `RESUELTO`  
`ASIGNADO` / `EN_PROGRESO` → `CANCELADO` (cliente avisa que ya funciona)
