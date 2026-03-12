import { PlaygroundForm } from "./playground-form";

import { prisma } from "@/lib/prisma";

type PlaygroundPageProps = {
  searchParams: Promise<{ agentId?: string }>;
};

export default async function PlaygroundPage({ searchParams }: PlaygroundPageProps) {
  const params = await searchParams;

  const [agents, initialAgent] = await Promise.all([
    prisma.agent.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    params.agentId
      ? prisma.agent.findUnique({
          where: { id: params.agentId },
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            tags: true,
            rating: true,
            _count: { select: { runs: true, ratings: true } },
          },
        })
      : Promise.resolve(null),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Agent Playground</h1>
      <p className="mt-2 text-slate-600">Run live prompts against agent APIs before integrating them.</p>

      <div className="mt-6">
        <PlaygroundForm agents={agents} defaultAgentId={params.agentId ?? ""} initialAgent={initialAgent} />
      </div>
    </main>
  );
}
