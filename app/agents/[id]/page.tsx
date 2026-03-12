import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RatingWidget } from "@/components/agents/rating-widget";

type AgentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { id } = await params;

  const [agent, user] = await Promise.all([
    prisma.agent.findUnique({
      where: { id },
      include: {
        creator: { select: { name: true, email: true } },
        _count: { select: { ratings: true, runs: true } },
      },
    }),
    getCurrentUser(),
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

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-slate-900">{agent.name}</h1>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
            {agent._count.runs} run{agent._count.runs !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="mt-5 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <div>
            <p className="font-semibold text-slate-900">Description</p>
            <p className="mt-1">{agent.description}</p>
          </div>

          <div>
            <p className="font-semibold text-slate-900">Category</p>
            <p className="mt-1">{agent.category}</p>
          </div>

          <div>
            <p className="font-semibold text-slate-900">Tags</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {agent.tags.map((tag) => (
                <span key={tag} className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-700">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold text-slate-900">API Endpoint</p>
            <p className="mt-1 break-all">{agent.apiUrl}</p>
          </div>

          <div>
            <p className="font-semibold text-slate-900">Developer Name</p>
            <p className="mt-1">{agent.creator.name}</p>
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
            className="rounded-md bg-cyan-700 px-4 py-2 font-medium text-white hover:bg-cyan-800"
          >
            Run Agent
          </Link>
          <Link href="/agents" className="rounded-md border border-slate-300 px-4 py-2 hover:bg-slate-50">
            Back to Listing
          </Link>
        </div>
      </div>
    </main>
  );
}
