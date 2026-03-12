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
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 md:p-8">
        <p className="text-[0.68rem] uppercase tracking-[0.34em] text-emerald-200/55">Signal board</p>
        <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">Leaderboard</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
          The most-used and highest-rated agents on the platform.
        </p>

        <div className="mt-6">
          <LeaderboardTabs trending={trending} topRated={topRated} />
        </div>
      </div>
    </main>
  );
}
