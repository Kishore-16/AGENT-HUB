import { AgentsSearch } from "@/components/agents/agents-search";
import { prisma } from "@/lib/prisma";

export default async function AgentsPage() {
  const [agents, categories] = await Promise.all([
    prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        tags: true,
        rating: true,
        version: true,
        _count: { select: { runs: true, remixes: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.agent.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  const failureCounts = await prisma.agentRun.groupBy({
    by: ["agentId", "status"],
    where: { agentId: { in: agents.map((agent) => agent.id) } },
    _count: true,
  });

  const failuresByAgent = failureCounts.reduce<Record<string, number>>((accumulator, row) => {
    if (row.status === "ERROR" || row.status === "EMPTY") {
      accumulator[row.agentId] = (accumulator[row.agentId] ?? 0) + row._count;
    }
    return accumulator;
  }, {});

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 md:p-8">
        <p className="text-[0.68rem] uppercase tracking-[0.34em] text-emerald-200/55">Agent registry</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold text-white md:text-4xl">Agent Marketplace</h1>
            <p className="mt-3 text-base leading-7 text-slate-300">
              Discover versioned agents, compare failure rates, and remix proven configs into your own variants.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-2xl font-semibold text-emerald-200">{agents.length}</p>
              <p className="mt-1 text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">Listings</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-2xl font-semibold text-emerald-200">{categories.length}</p>
              <p className="mt-1 text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">Categories</p>
            </div>
          </div>
        </div>

        <AgentsSearch
          agents={agents.map(({ _count, ...rest }) => ({
            ...rest,
            runCount: _count.runs,
            remixCount: _count.remixes,
            failureRate: _count.runs === 0 ? 0 : (failuresByAgent[rest.id] ?? 0) / _count.runs,
          }))}
          categories={categories.map((c) => c.category)}
        />
      </div>
    </main>
  );
}
