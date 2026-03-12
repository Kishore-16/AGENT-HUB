# AgentHub - AI Agents Marketplace

Full-stack Next.js App Router project for discovering, testing, and publishing AI agents.

## Stack

- Next.js (App Router)
- Tailwind CSS
- REST API routes (`app/api/*`)
- PostgreSQL
- Prisma ORM
- Simple JWT cookie authentication

## Features Implemented

- Homepage
- Agents listing page
- Agent details page
- Submit agent page (auth protected)
- Agent playground page
- Developer dashboard (auth protected)
- Signup/login/logout flows

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
copy .env.example .env
```

3. Update `DATABASE_URL` and `JWT_SECRET` in `.env`.

4. Generate Prisma client and run migration:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

5. Start development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Useful Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:studio`
