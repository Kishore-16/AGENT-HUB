import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AnalyticsPageProps = { params: Promise<{ id: string }> };

export default async function AgentAnalyticsPage({ params }: AnalyticsPageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const agent = await prisma.agent.findUnique({
    where: { id },
    select: { name: true, creatorId: true },
  });
  if (!agent || agent.creatorId !== user.id) notFound();

  const [stats, failedRuns, recentRuns, recentRatings, workflowRuns] = await prisma.$transaction([
    prisma.agentRun.aggregate({
      where: { agentId: id },
      _count: true,
      _avg: { responseTime: true },
    }),
    prisma.agentRun.count({ where: { agentId: id, status: { in: ["ERROR", "EMPTY"] } } }),
    prisma.agentRun.findMany({
      where: { agentId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        input: true,
        output: true,
        responseTime: true,
        status: true,
        createdAt: true,
        workflowRun: { select: { mode: true, input: true } },
      },
    }),
    prisma.rating.findMany({
      where: { agentId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { score: true, createdAt: true },
    }),
    prisma.agentRun.findMany({
      where: { agentId: id },
      take: 100,
      select: {
        stepIndex: true,
        workflowRun: { select: { mode: true, input: true } },
      },
    }),
  ]);

  const totalRuns = stats._count;
  const avgResponseTime = Math.round(stats._avg.responseTime ?? 0);
  const failureRate = totalRuns === 0 ? 0 : failedRuns / totalRuns;

  const topGoals = Object.entries(
    workflowRuns.reduce<Record<string, number>>((accumulator, run) => {
      const goal = (run.workflowRun?.input ?? "").trim() || "Untitled goal";
      const shortGoal = goal.length > 80 ? `${goal.slice(0, 80)}…` : goal;
      accumulator[shortGoal] = (accumulator[shortGoal] ?? 0) + 1;
      return accumulator;
    }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5);

  const chainPositions = Object.entries(
    workflowRuns.reduce<Record<string, number>>((accumulator, run) => {
      if (run.workflowRun?.mode !== "PACK" || run.stepIndex === null) {
        return accumulator;
      }

      const key = `Step ${run.stepIndex + 1}`;
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    }, {}),
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/developer-dashboard"
            className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            ← Developer Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
          <p className="text-slate-500">Private analytics</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-medium text-slate-500">Total Runs</p>
          <p className="mt-1 text-4xl font-bold text-slate-900">{totalRuns}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-medium text-slate-500">Avg Response Time</p>
          <p className="mt-1 text-4xl font-bold text-slate-900">
            {avgResponseTime}
            <span className="ml-1 text-lg font-normal text-slate-500">ms</span>
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-medium text-slate-500">Failure Rate</p>
          <p className="mt-1 text-4xl font-bold text-slate-900">{(failureRate * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Top Goals</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {topGoals.length === 0 ? <p>No goal data yet.</p> : topGoals.map(([goal, count]) => (
              <div key={goal} className="flex items-start justify-between gap-3">
                <span>{goal}</span>
                <span className="text-slate-400">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Chain Placement</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {chainPositions.length === 0 ? <p>Not used in packs yet.</p> : chainPositions.map(([position, count]) => (
              <div key={position} className="flex items-center justify-between">
                <span>{position}</span>
                <span className="text-slate-400">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Rating Trend</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {recentRatings.length === 0 ? <p>No ratings yet.</p> : recentRatings.map((rating, index) => (
              <div key={`${rating.createdAt.toISOString()}-${index}`} className="flex items-center justify-between">
                <span>{new Date(rating.createdAt).toLocaleDateString()}</span>
                <span className="text-slate-900">{rating.score}/5</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Recent Runs</h2>
        </div>

        {recentRuns.length === 0 ? (
          <p className="px-6 py-10 text-center text-slate-500">No runs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-6 py-3 font-medium">Time</th>
                  <th className="px-6 py-3 font-medium">Mode</th>
                  <th className="px-6 py-3 font-medium">Input</th>
                  <th className="px-6 py-3 font-medium">Output</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-3 text-slate-500">
                      {new Date(run.createdAt).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-slate-500">
                      {run.workflowRun?.mode ?? "SINGLE"}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      <span title={run.input}>
                        {run.input.length > 120 ? run.input.slice(0, 120) + "…" : run.input}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      <span title={run.output}>
                        {run.output.length > 200 ? run.output.slice(0, 200) + "…" : run.output}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-slate-500">{run.status}</td>
                    <td className="whitespace-nowrap px-6 py-3 text-right text-slate-500">
                      {run.responseTime} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
