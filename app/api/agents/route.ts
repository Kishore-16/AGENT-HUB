import { NextResponse } from "next/server";
import { z } from "zod";

import { buildVersionSnapshot, getVersionLabel } from "@/lib/agent-versioning";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createAgentSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(20),
  category: z.string().min(2),
  apiUrl: z.string().url(),
  tags: z.array(z.string().min(1)).min(1),
  inputFormat: z.string().optional().default("plain_text"),
  outputFormat: z.string().optional().default("plain_text"),
  systemPrompt: z.string().optional().default(""),
  remixedFromAgentId: z.string().uuid().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";

  const agents = await prisma.agent.findMany({
    where: {
      AND: [
        query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
                { tags: { hasSome: [query] } },
              ],
            }
          : {},
        category
          ? {
              category: { equals: category, mode: "insensitive" },
            }
          : {},
      ],
    },
    include: {
      creator: {
        select: { name: true },
      },
      _count: {
        select: { runs: true, versions: true, remixes: true },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const failureCounts = await prisma.agentRun.groupBy({
    by: ["agentId", "status"],
    where: {
      agentId: { in: agents.map((agent) => agent.id) },
    },
    _count: true,
  });

  const failuresByAgent = failureCounts.reduce<Record<string, number>>((accumulator, row) => {
    if (row.status === "ERROR" || row.status === "EMPTY") {
      accumulator[row.agentId] = (accumulator[row.agentId] ?? 0) + row._count;
    }
    return accumulator;
  }, {});

  return NextResponse.json({
    agents: agents.map((agent) => ({
      ...agent,
      failureRate: agent._count.runs === 0 ? 0 : (failuresByAgent[agent.id] ?? 0) / agent._count.runs,
    })),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createAgentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid agent payload" }, { status: 400 });
    }

    if (parsed.data.remixedFromAgentId) {
      const sourceAgent = await prisma.agent.findUnique({
        where: { id: parsed.data.remixedFromAgentId },
        select: { id: true },
      });

      if (!sourceAgent) {
        return NextResponse.json({ error: "Remix source not found" }, { status: 404 });
      }
    }

    const agent = await prisma.$transaction(async (tx) => {
      const createdAgent = await tx.agent.create({
        data: {
          ...parsed.data,
          version: getVersionLabel(1),
          currentVersionNumber: 1,
          creatorId: user.id,
        },
        include: {
          creator: {
            select: { name: true },
          },
        },
      });

      await tx.agentVersion.create({
        data: {
          agentId: createdAgent.id,
          versionNumber: 1,
          versionLabel: getVersionLabel(1),
          ...buildVersionSnapshot(createdAgent, user.id),
        },
      });

      return createdAgent;
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to submit agent" }, { status: 500 });
  }
}
