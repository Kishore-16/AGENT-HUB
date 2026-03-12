"use client";

import Link from "next/link";
import { useState } from "react";

type NavUser = { name: string; email: string } | null;

const NAV_LINKS = [
  { href: "/agents", label: "Agents" },
  { href: "/packs", label: "Packs" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/playground", label: "Playground" },
  { href: "/prompts", label: "Prompts" },
  { href: "/history", label: "History" },
  { href: "/developer-dashboard", label: "Dashboard" },
  { href: "/submit-agent", label: "Submit" },
];

export function SiteHeaderNav({ user }: { user: NavUser }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="hidden flex-1 items-center justify-end gap-3 lg:flex">
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-slate-400 hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {user ? (
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 hover:border-emerald-300/25 hover:text-white"
            >
              {user.name}
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-full border border-emerald-300/20 bg-emerald-400/15 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-400/20"
              >
                Logout
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-white/20 hover:text-white"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-emerald-300/20 bg-emerald-400/15 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-400/20"
            >
              Sign up
            </Link>
          </div>
        )}
      </nav>

      <button
        onClick={() => setOpen(!open)}
        className="rounded-2xl border border-white/10 bg-white/5 p-2.5 text-slate-200 hover:border-emerald-300/25 hover:bg-white/10 lg:hidden"
        aria-label="Toggle menu"
      >
        {open ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-4 right-4 top-full z-50 mt-3 rounded-3xl border border-white/10 bg-[#050b16]/95 px-4 py-4 shadow-[0_32px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col gap-1 text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-3 py-2.5 text-slate-300 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="rounded-2xl border border-white/10 px-3 py-2.5 text-slate-200 hover:border-emerald-300/25 hover:text-white"
                  >
                    Profile ({user.name})
                  </Link>
                  <form action="/api/auth/logout" method="post">
                    <button
                      type="submit"
                      className="w-full rounded-2xl border border-emerald-300/20 bg-emerald-400/15 px-3 py-2.5 text-left font-medium text-emerald-100 hover:bg-emerald-400/20"
                    >
                      Logout
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-2xl border border-white/10 px-3 py-2.5 text-slate-300 hover:border-white/20 hover:text-white"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="rounded-2xl border border-emerald-300/20 bg-emerald-400/15 px-3 py-2.5 text-center font-medium text-emerald-100 hover:bg-emerald-400/20"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
