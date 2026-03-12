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

  const myAgents = await prisma.agent.findMany({
    where: { creatorId: user.id },
    select: {
      id: true,
      name: true,
      category: true,
      rating: true,
      _count: { select: { runs: true, ratings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRuns = myAgents.reduce((sum, a) => sum + a._count.runs, 0);
  const avgRating =
    myAgents.length > 0
      ? myAgents.reduce((sum, a) => sum + a.rating, 0) / myAgents.length
      : 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Developer Dashboard</h1>
      <p className="mt-2 text-slate-600">Welcome back, {user.name}. Manage your published agents.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{myAgents.length}</p>
          <p className="mt-1 text-sm text-slate-500">Published Agents</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{totalRuns}</p>
          <p className="mt-1 text-sm text-slate-500">Total Runs</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{avgRating.toFixed(1)}</p>
          <p className="mt-1 text-sm text-slate-500">Avg Rating</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-slate-700">
          Submit and manage your agents below.
        </p>
        <Link href="/submit-agent" className="rounded-md bg-cyan-700 px-4 py-2 text-white hover:bg-cyan-800">
          Submit New Agent
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
              rating={agent.rating}
              runCount={agent._count.runs}
              ratingCount={agent._count.ratings}
            />
          ))
        )}
      </section>
    </main>
  );
}
