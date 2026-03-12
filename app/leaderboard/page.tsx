import { LeaderboardTabs } from "@/components/agents/leaderboard-tabs";
import { prisma } from "@/lib/prisma";

const AGENT_SELECT = {
  id: true,
  name: true,
  description: true,
  category: true,
  tags: true,
  rating: true,
  _count: { select: { runs: true, ratings: true } },
} as const;

export default async function LeaderboardPage() {
  const [trending, topRated] = await Promise.all([
    prisma.agent.findMany({
      select: AGENT_SELECT,
      orderBy: { runs: { _count: "desc" } },
      take: 20,
    }),
    prisma.agent.findMany({
      select: AGENT_SELECT,
      orderBy: { rating: "desc" },
      take: 20,
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Leaderboard</h1>
      <p className="mt-2 text-slate-600">
        The most-used and highest-rated agents on the platform.
      </p>

      <div className="mt-6">
        <LeaderboardTabs trending={trending} topRated={topRated} />
      </div>
    </main>
  );
}
