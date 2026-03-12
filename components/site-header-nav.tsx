"use client";

import Link from "next/link";
import { useState } from "react";

type NavUser = { name: string; email: string } | null;

const NAV_LINKS = [
  { href: "/agents", label: "Agents" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/playground", label: "Playground" },
  { href: "/developer-dashboard", label: "Dashboard" },
  { href: "/submit-agent", label: "Submit" },
];

export function SiteHeaderNav({ user }: { user: NavUser }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden items-center gap-4 text-sm text-slate-700 md:flex">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-slate-900">
            {link.label}
          </Link>
        ))}

        {user ? (
          <>
            <Link href="/profile" className="font-medium hover:text-slate-900">
              {user.name}
            </Link>
            <form action="/api/auth/logout" method="post" className="ml-1">
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800"
              >
                Logout
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
              Login
            </Link>
            <Link href="/signup" className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800">
              Sign up
            </Link>
          </>
        )}
      </nav>

      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="rounded-md p-2 text-slate-700 hover:bg-slate-100 md:hidden"
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

      {/* Mobile drawer */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 border-b border-slate-200 bg-white px-4 py-3 shadow-md md:hidden">
          <nav className="flex flex-col gap-1 text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-2 flex flex-col gap-1 border-t border-slate-100 pt-2">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"
                  >
                    Profile ({user.name})
                  </Link>
                  <form action="/api/auth/logout" method="post">
                    <button
                      type="submit"
                      className="w-full rounded-md bg-slate-900 px-3 py-2 text-left text-white hover:bg-slate-800"
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
                    className="rounded-md border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="rounded-md bg-slate-900 px-3 py-2 text-center text-white hover:bg-slate-800"
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
