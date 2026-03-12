import Link from "next/link";

import { PackActions } from "./pack-actions";

import { getCurrentUser } from "@/lib/auth";
import { getAgentFormatLabel } from "@/lib/agent-formats";
import { prisma } from "@/lib/prisma";

export default async function PacksPage() {
  const user = await getCurrentUser();

  const packs = await prisma.agentPack.findMany({
    where: { isPublic: true },
    include: {
      creator: { select: { name: true } },
      installs: user ? { where: { userId: user.id }, select: { id: true } } : false,
      items: {
        orderBy: { position: "asc" },
        select: {
          id: true,
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
      _count: { select: { installs: true, workflowRuns: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Agent Packs</h1>
          <p className="mt-2 text-slate-600">Install curated chains instead of stitching every workflow together by hand.</p>
        </div>
        {user ? (
          <Link href="/packs/create" className="rounded-md bg-cyan-700 px-4 py-2 font-medium text-white hover:bg-cyan-800">
            Create Pack
          </Link>
        ) : null}
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {packs.map((pack) => (
          <article key={pack.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{pack.name}</h2>
                <p className="mt-1 text-sm text-slate-500">by {pack.creator.name}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>{pack._count.installs} installs</p>
                <p>{pack._count.workflowRuns} runs</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-600">{pack.description}</p>

            <div className="mt-5 space-y-3">
              {pack.items.map((item, index) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">Step {index + 1}: {item.agent.name} · v{item.agentVersionNumber}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {getAgentFormatLabel(item.agent.inputFormat)} in {"->"} {getAgentFormatLabel(item.agent.outputFormat)} out
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <PackActions
                packId={pack.id}
                initiallyInstalled={Array.isArray(pack.installs) && pack.installs.length > 0}
                canInstall={Boolean(user)}
              />
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}