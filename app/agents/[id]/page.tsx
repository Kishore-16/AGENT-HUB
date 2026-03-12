import Link from "next/link";
import { notFound } from "next/navigation";

import { getAgentFormatLabel } from "@/lib/agent-formats";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RatingWidget } from "@/components/agents/rating-widget";

type AgentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { id } = await params;

  const [agent, user, failedRuns] = await Promise.all([
    prisma.agent.findUnique({
      where: { id },
      include: {
        creator: { select: { name: true, email: true } },
        remixedFromAgent: { select: { id: true, name: true } },
        versions: {
          select: {
            versionNumber: true,
            versionLabel: true,
            createdAt: true,
          },
          orderBy: { versionNumber: "desc" },
        },
        _count: { select: { ratings: true, runs: true, remixes: true } },
      },
    }),
    getCurrentUser(),
    prisma.agentRun.count({ where: { agentId: id, status: { in: ["ERROR", "EMPTY"] } } }),
  ]);

  if (!agent) {
    notFound();
  }

  const userRating = user
    ? await prisma.rating.findUnique({
        where: { agentId_userId: { agentId: id, userId: user.id } },
        select: { score: true },
      })
    : null;

  const failureRate = agent._count.runs === 0 ? 0 : failedRuns / agent._count.runs;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.32)] md:p-8">
        <p className="text-[0.68rem] uppercase tracking-[0.34em] text-emerald-200/55">Agent detail</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-white">{agent.name}</h1>
          <span className="rounded-full border border-white/10 bg-indigo-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-indigo-700">
            {agent.version}
          </span>
          <span className="rounded-full border border-white/10 bg-slate-100 px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">
            {agent._count.runs} run{agent._count.runs !== 1 ? "s" : ""}
          </span>
          <span className="rounded-full border border-white/10 bg-rose-50 px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-rose-700">
            {(failureRate * 100).toFixed(1)}% failure rate
          </span>
        </div>
        <div className="mt-6 grid gap-4 rounded-[26px] border border-white/10 bg-black/20 p-5 text-sm text-slate-700">
          <div>
            <p className="font-semibold text-white">Description</p>
            <p className="mt-1 leading-6 text-slate-300">{agent.description}</p>
          </div>

          <div>
            <p className="font-semibold text-white">Category</p>
            <p className="mt-1 text-slate-300">{agent.category}</p>
          </div>

          <div>
            <p className="font-semibold text-white">Tags</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {agent.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-slate-400">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold text-white">API Endpoint</p>
            <p className="mt-1 break-all text-slate-300">{agent.apiUrl}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="font-semibold text-white">Input Type</p>
              <p className="mt-1 text-slate-300">{getAgentFormatLabel(agent.inputFormat)}</p>
            </div>
            <div>
              <p className="font-semibold text-white">Output Type</p>
              <p className="mt-1 text-slate-300">{getAgentFormatLabel(agent.outputFormat)}</p>
            </div>
          </div>

          <div>
            <p className="font-semibold text-white">Developer Name</p>
            <p className="mt-1 text-slate-300">{agent.creator.name}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="font-semibold text-white">Remixes</p>
              <p className="mt-1 text-slate-300">{agent._count.remixes}</p>
            </div>
            <div>
              <p className="font-semibold text-white">Source</p>
              <p className="mt-1 text-slate-300">
                {agent.remixedFromAgent ? (
                  <Link href={`/agents/${agent.remixedFromAgent.id}`} className="text-cyan-700 hover:underline">
                    {agent.remixedFromAgent.name}
                  </Link>
                ) : (
                  "Original agent"
                )}
              </p>
            </div>
          </div>

          <div>
            <p className="font-semibold text-white">Version History</p>
            <div className="mt-2 space-y-2">
              {agent.versions.map((version) => (
                <div key={version.versionNumber} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="font-medium text-white">{version.versionLabel}</p>
                    <p className="text-xs text-slate-500">Published {new Date(version.createdAt).toLocaleString()}</p>
                  </div>
                  <Link
                    href={`/playground?agentId=${agent.id}&version=${version.versionNumber}`}
                    className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700 hover:underline"
                  >
                    Run this version
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <RatingWidget
          agentId={agent.id}
          initialRating={agent.rating}
          totalRatings={agent._count.ratings}
          userScore={userRating?.score ?? null}
          isLoggedIn={!!user}
        />

        <div className="mt-6 flex gap-3">
          <Link
            href={`/playground?agentId=${agent.id}`}
            className="rounded-full border border-emerald-300/20 bg-emerald-400/15 px-5 py-3 font-medium text-emerald-100 hover:bg-emerald-400/20"
          >
            Run Agent
          </Link>
          <Link
            href={`/submit-agent?remix=${agent.id}`}
            className="rounded-full border border-amber-300 px-5 py-3 font-medium text-amber-700 hover:bg-white/5"
          >
            Remix Agent
          </Link>
          <Link href="/agents" className="rounded-full border border-white/10 px-5 py-3 text-slate-300 hover:bg-white/5 hover:text-white">
            Back to Listing
          </Link>
        </div>
      </div>
    </main>
  );
}
