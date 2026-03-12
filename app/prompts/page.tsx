import { PromptLibraryClient } from "./prompt-library-client";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PromptsPage() {
  const user = await getCurrentUser();

  const [prompts, agents, packs] = await Promise.all([
    prisma.promptTemplate.findMany({
      include: {
        creator: { select: { name: true } },
        agent: { select: { id: true, name: true } },
        pack: { select: { id: true, name: true } },
        _count: { select: { votes: true } },
        votes: user ? { where: { userId: user.id }, select: { id: true } } : false,
      },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.agent.findMany({ select: { id: true, name: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.agentPack.findMany({ where: { isPublic: true }, select: { id: true, name: true }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Community Prompt Library</h1>
      <p className="mt-2 text-slate-600">Save working prompts, attach them to agents or packs, and let the community surface the best starters.</p>

      <div className="mt-6">
        <PromptLibraryClient
          initialPrompts={prompts.map((prompt) => ({
            id: prompt.id,
            title: prompt.title,
            goal: prompt.goal,
            prompt: prompt.prompt,
            description: prompt.description,
            createdAt: prompt.createdAt.toISOString(),
            creator: prompt.creator,
            agent: prompt.agent,
            pack: prompt.pack,
            voteCount: prompt._count.votes,
            hasVoted: Array.isArray(prompt.votes) && prompt.votes.length > 0,
          }))}
          isLoggedIn={Boolean(user)}
          agents={agents}
          packs={packs}
        />
      </div>
    </main>
  );
}