import { notFound, redirect } from "next/navigation";
import Link from "next/link";
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

  const [stats, recentRuns] = await prisma.$transaction([
    prisma.agentRun.aggregate({
      where: { agentId: id },
      _count: true,
      _avg: { responseTime: true },
    }),
    prisma.agentRun.findMany({
      where: { agentId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, input: true, output: true, responseTime: true, createdAt: true },
    }),
  ]);

  const totalRuns = stats._count;
  const avgResponseTime = Math.round(stats._avg.responseTime ?? 0);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/developer-dashboard"
            className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            ← Developer Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
          <p className="text-slate-500">Run Analytics</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>

      {/* Recent Runs Table */}
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
                  <th className="px-6 py-3 font-medium">Input</th>
                  <th className="px-6 py-3 font-medium">Output</th>
                  <th className="px-6 py-3 font-medium text-right">Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-3 text-slate-500">
                      {new Date(run.createdAt).toLocaleString()}
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
