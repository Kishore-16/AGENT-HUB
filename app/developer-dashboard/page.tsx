import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgentRow } from "./agent-row";

export default async function DeveloperDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [myAgents, packCount, promptCount] = await Promise.all([
    prisma.agent.findMany({
      where: { creatorId: user.id },
      select: {
        id: true,
        name: true,
        category: true,
        version: true,
        rating: true,
        _count: { select: { runs: true, ratings: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.agentPack.count({ where: { creatorId: user.id } }),
    prisma.promptTemplate.count({ where: { creatorId: user.id } }),
  ]);

  const failureCounts = await prisma.agentRun.groupBy({
    by: ["agentId", "status"],
    where: {
      agent: { creatorId: user.id },
    },
    _count: true,
  });

  const failuresByAgent = failureCounts.reduce<Record<string, number>>((accumulator, row) => {
    if (row.status === "ERROR" || row.status === "EMPTY") {
      accumulator[row.agentId] = (accumulator[row.agentId] ?? 0) + row._count;
    }
    return accumulator;
  }, {});

  const totalRuns = myAgents.reduce((sum, a) => sum + a._count.runs, 0);
  const avgRating =
    myAgents.length > 0
      ? myAgents.reduce((sum, a) => sum + a.rating, 0) / myAgents.length
      : 0;
  const totalFailures = Object.values(failuresByAgent).reduce((sum, count) => sum + count, 0);
  const failureRate = totalRuns === 0 ? 0 : totalFailures / totalRuns;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Developer Dashboard</h1>
      <p className="mt-2 text-slate-600">Welcome back, {user.name}. Manage versioned agents, packs, prompts, and production run quality.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{myAgents.length}</p>
          <p className="mt-1 text-sm text-slate-500">Published Agents</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{packCount}</p>
          <p className="mt-1 text-sm text-slate-500">Agent Packs</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{promptCount}</p>
          <p className="mt-1 text-sm text-slate-500">Prompt Assets</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{totalRuns}</p>
          <p className="mt-1 text-sm text-slate-500">Total Runs</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{(failureRate * 100).toFixed(0)}%</p>
          <p className="mt-1 text-sm text-slate-500">Failure Rate</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_auto_auto]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-700">
          Average rating across your catalog: <span className="font-semibold text-slate-900">{avgRating.toFixed(1)}</span>
        </div>
        <Link href="/submit-agent" className="rounded-md bg-cyan-700 px-4 py-2 text-center text-white hover:bg-cyan-800">
          Submit New Agent
        </Link>
        <Link href="/packs/create" className="rounded-md border border-slate-300 px-4 py-2 text-center text-slate-700 hover:bg-slate-50">
          Create Pack
        </Link>
        <Link href="/prompts" className="rounded-md border border-slate-300 px-4 py-2 text-center text-slate-700 hover:bg-slate-50">
          Prompt Library
        </Link>
      </div>

      <section className="mt-5 space-y-3">
        {myAgents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-slate-600">
            No agents submitted yet.
          </p>
        ) : (
          myAgents.map((agent) => (
            <AgentRow
              key={agent.id}
              id={agent.id}
              name={agent.name}
              category={agent.category}
              version={agent.version}
              rating={agent.rating}
              runCount={agent._count.runs}
              ratingCount={agent._count.ratings}
              failureRate={agent._count.runs === 0 ? 0 : (failuresByAgent[agent.id] ?? 0) / agent._count.runs}
            />
          ))
        )}
      </section>
    </main>
  );
}
