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
        _count: { select: { runs: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.agent.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Agent Marketplace</h1>
      <p className="mt-2 text-slate-600">Discover and integrate AI agents by category, tags, and use case.</p>

      <AgentsSearch
        agents={agents.map(({ _count, ...rest }) => ({ ...rest, runCount: _count.runs }))}
        categories={categories.map((c) => c.category)}
      />
    </main>
  );
}
