import { PlaygroundForm } from "./playground-form";

import { prisma } from "@/lib/prisma";

type PlaygroundPageProps = {
  searchParams: Promise<{ agentId?: string; version?: string; packId?: string }>;
};

export default async function PlaygroundPage({ searchParams }: PlaygroundPageProps) {
  const params = await searchParams;

  const [agents, packs, initialAgent] = await Promise.all([
    prisma.agent.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.agentPack.findMany({
      where: { isPublic: true },
      select: {
        id: true,
        name: true,
        description: true,
        items: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            position: true,
            agentVersionNumber: true,
            agent: {
              select: {
                id: true,
                name: true,
                inputFormat: true,
                outputFormat: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
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
            version: true,
            inputFormat: true,
            outputFormat: true,
            versions: {
              select: {
                versionNumber: true,
                versionLabel: true,
                createdAt: true,
              },
              orderBy: { versionNumber: "desc" },
            },
            _count: { select: { runs: true, ratings: true } },
          },
        })
      : Promise.resolve(null),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Agent Playground</h1>
      <p className="mt-2 text-slate-600">Run pinned versions, benchmark agents side by side, execute packs, and ship results to webhooks.</p>

      <div className="mt-6">
        <PlaygroundForm
          agents={agents}
          packs={packs}
          defaultAgentId={params.agentId ?? ""}
          defaultVersionNumber={params.version ? Number(params.version) : null}
          defaultPackId={params.packId ?? ""}
          initialAgent={initialAgent}
        />
      </div>
    </main>
  );
}
