import { NextResponse } from "next/server";
import { z } from "zod";

import { buildVersionSnapshot, getVersionLabel } from "@/lib/agent-versioning";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Context) {
  const { id } = await params;

  const [agent, totalRuns, failedRuns] = await prisma.$transaction([
    prisma.agent.findUnique({
      where: { id },
      include: {
        creator: {
          select: { name: true, email: true },
        },
        versions: {
          select: {
            id: true,
            versionNumber: true,
            versionLabel: true,
            createdAt: true,
            createdBy: { select: { name: true } },
          },
          orderBy: { versionNumber: "desc" },
        },
        _count: { select: { runs: true, ratings: true, remixes: true } },
      },
    }),
    prisma.agentRun.count({ where: { agentId: id } }),
    prisma.agentRun.count({ where: { agentId: id, status: { in: ["ERROR", "EMPTY"] } } }),
  ]);

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json({
    agent: {
      ...agent,
      failureRate: totalRuns === 0 ? 0 : failedRuns / totalRuns,
      successRate: totalRuns === 0 ? 1 : (totalRuns - failedRuns) / totalRuns,
    },
  });
}

const updateAgentSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(20).optional(),
  category: z.string().min(2).optional(),
  apiUrl: z.string().url().optional(),
  tags: z.array(z.string().min(1)).min(1).optional(),
  inputFormat: z.string().optional(),
  outputFormat: z.string().optional(),
  systemPrompt: z.string().optional(),
});

export async function PATCH(req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.agent.findUnique({
    where: { id },
    include: {
      versions: {
        select: { id: true, versionNumber: true },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  if (existing.creatorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
  }

  const nextVersionNumber = existing.currentVersionNumber + 1;
  const nextVersionLabel = getVersionLabel(nextVersionNumber);
  const mergedAgent = {
    name: parsed.data.name ?? existing.name,
    description: parsed.data.description ?? existing.description,
    category: parsed.data.category ?? existing.category,
    apiUrl: parsed.data.apiUrl ?? existing.apiUrl,
    tags: parsed.data.tags ?? existing.tags,
    inputFormat: parsed.data.inputFormat ?? existing.inputFormat,
    outputFormat: parsed.data.outputFormat ?? existing.outputFormat,
    systemPrompt: parsed.data.systemPrompt ?? existing.systemPrompt,
  };

  const hasCurrentSnapshot = existing.versions.some(
    (version) => version.versionNumber === existing.currentVersionNumber,
  );

  const agent = await prisma.$transaction(async (tx) => {
    if (!hasCurrentSnapshot) {
      await tx.agentVersion.create({
        data: {
          agentId: existing.id,
          versionNumber: existing.currentVersionNumber,
          versionLabel: existing.version,
          ...buildVersionSnapshot(existing, user.id),
        },
      });
    }

    const updatedAgent = await tx.agent.update({
      where: { id },
      data: {
        ...mergedAgent,
        version: nextVersionLabel,
        currentVersionNumber: nextVersionNumber,
      },
    });

    await tx.agentVersion.create({
      data: {
        agentId: existing.id,
        versionNumber: nextVersionNumber,
        versionLabel: nextVersionLabel,
        ...buildVersionSnapshot(mergedAgent, user.id),
      },
    });

    return updatedAgent;
  });

  return NextResponse.json({ agent });
}

export async function DELETE(_: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.agent.findUnique({ where: { id }, select: { creatorId: true } });
  if (!existing) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  if (existing.creatorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.agent.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
