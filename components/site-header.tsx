import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeaderNav } from "./site-header-nav";

export async function SiteHeader() {
  const [user, liveAgents] = await Promise.all([getCurrentUser(), prisma.agent.count()]);
  const navUser = user ? { name: user.name, email: user.email } : null;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#030711]/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/25 bg-emerald-400/12 shadow-[0_0_32px_rgba(88,240,190,0.14)]">
            <span className="h-3.5 w-3.5 rounded-md border border-emerald-200/70 bg-emerald-300/80" />
          </span>
          <span>
            <span className="block text-xl font-semibold tracking-tight text-white">AgentHub</span>
            <span className="block text-[0.62rem] uppercase tracking-[0.34em] text-emerald-200/55">
              Operator Marketplace
            </span>
          </span>
        </Link>

        <div className="ml-auto hidden rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-[0.68rem] font-medium uppercase tracking-[0.28em] text-emerald-100/90 xl:flex">
          {liveAgents} agents live
        </div>

        <SiteHeaderNav user={navUser} />
      </div>
    </header>
  );
}

