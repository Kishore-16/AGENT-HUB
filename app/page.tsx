import Link from "next/link";

import { prisma } from "@/lib/prisma";

export default async function Home() {
  const [agentCount, totalRuns, workflowCount, responseStats] = await Promise.all([
    prisma.agent.count(),
    prisma.agentRun.count(),
    prisma.workflowRun.count(),
    prisma.agentRun.aggregate({ _avg: { responseTime: true } }),
  ]);

  const avgLatency = responseStats._avg.responseTime
    ? `${Math.round(responseStats._avg.responseTime)} ms`
    : "n/a";

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 lg:py-14">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(7,16,31,0.96),rgba(4,11,22,0.88))] p-6 shadow-[0_32px_120px_rgba(0,0,0,0.45)] md:p-8 lg:p-10">
        <div className="flex flex-wrap items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.3em] text-emerald-200/60">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2">Marketplace</span>
          <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-slate-400">Playground</span>
          <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-slate-400">Docs</span>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_0.95fr] lg:items-end">
          <div>
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.34em] text-emerald-200/55">
              Agent registry
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-white md:text-5xl lg:text-6xl">
              Discover, test, and ship AI agents through one neon control surface.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              Compare live agents, benchmark workflow packs, and move from prototype to production without leaving the marketplace.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/agents"
                className="rounded-full border border-emerald-300/20 bg-emerald-400/15 px-5 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/20"
              >
                Browse agents
              </Link>
              <Link
                href="/submit-agent"
                className="rounded-full border border-white/10 bg-black/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5"
              >
                Publish your agent
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.32em] text-slate-400">System log</p>
            <div className="mt-6 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2">
              <div className="bg-black/30 p-4">
                <p className="text-3xl font-semibold text-emerald-200">{totalRuns.toLocaleString()}</p>
                <p className="mt-2 text-[0.68rem] uppercase tracking-[0.26em] text-slate-500">Total runs</p>
              </div>
              <div className="bg-black/30 p-4">
                <p className="text-3xl font-semibold text-emerald-200">{agentCount}</p>
                <p className="mt-2 text-[0.68rem] uppercase tracking-[0.26em] text-slate-500">Agents</p>
              </div>
              <div className="bg-black/30 p-4">
                <p className="text-3xl font-semibold text-emerald-200">{workflowCount}</p>
                <p className="mt-2 text-[0.68rem] uppercase tracking-[0.26em] text-slate-500">Chains run</p>
              </div>
              <div className="bg-black/30 p-4">
                <p className="text-3xl font-semibold text-emerald-200">{avgLatency}</p>
                <p className="mt-2 text-[0.68rem] uppercase tracking-[0.26em] text-slate-500">Avg latency</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-emerald-200/55">Versioned marketplace</p>
          <h2 className="mt-4 text-xl font-semibold text-white">Inspect behavior before you wire it in.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Search by category, tags, version lineage, and failure rate before you commit to an agent in production.</p>
        </article>
        <article className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-emerald-200/55">Benchmark + packs</p>
          <h2 className="mt-4 text-xl font-semibold text-white">Chain agents without improvising your stack.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Run curated packs, compare agents in the playground, and move successful chains into repeatable workflows.</p>
        </article>
        <article className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-emerald-200/55">Prompt network</p>
          <h2 className="mt-4 text-xl font-semibold text-white">Keep prompts, runs, and remixes attached to the work.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Track experiments, publish prompt assets, and remix proven agents instead of starting from zero every time.</p>
        </article>
      </section>
    </main>
  );
}
