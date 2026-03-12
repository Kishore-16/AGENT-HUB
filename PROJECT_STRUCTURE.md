# AgentHub Folder Structure

## App Router Pages

- `app/page.tsx` - Homepage
- `app/agents/page.tsx` - Agents listing
- `app/agents/[id]/page.tsx` - Agent details
- `app/submit-agent/page.tsx` - Submit agent
- `app/playground/page.tsx` - Agent playground
- `app/developer-dashboard/page.tsx` - Developer dashboard
- `app/login/page.tsx` - Login
- `app/signup/page.tsx` - Signup

## REST API Routes

- `app/api/auth/signup/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/me/route.ts`
- `app/api/agents/route.ts`
- `app/api/agents/[id]/route.ts`
- `app/api/run-agent/route.ts`

## Shared Modules

- `lib/prisma.ts` - Prisma client singleton
- `lib/auth.ts` - JWT + cookie auth helpers
- `components/site-header.tsx` - Top navigation and auth actions
- `components/agents/agent-card.tsx` - Marketplace card UI

## Database

- `prisma/schema.prisma` - User and Agent models
- `.env.example` - Required environment variables
