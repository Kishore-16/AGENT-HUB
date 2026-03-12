import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { SiteHeaderNav } from "./site-header-nav";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const navUser = user ? { name: user.name, email: user.email } : null;

  return (
    <header className="relative border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
          AgentHub
        </Link>

        <SiteHeaderNav user={navUser} />
      </div>
    </header>
  );
}

