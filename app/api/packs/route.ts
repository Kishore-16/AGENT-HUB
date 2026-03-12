import { NextResponse } from "next/server";
import { z } from "zod";

import { describeFormatCompatibility } from "@/lib/agent-formats";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createPackSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(20),
  agentIds: z.array(z.string().uuid()).min(2).max(3),
  isPublic: z.boolean().optional().default(true),
});

export async function GET() {
  const packs = await prisma.agentPack.findMany({
    where: { isPublic: true },
    include: {
      creator: { select: { name: true } },
      items: {
        orderBy: { position: "asc" },
        include: {
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

  return NextResponse.json({ packs });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createPackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid pack payload" }, { status: 400 });
    }

    const agents = await prisma.agent.findMany({
      where: { id: { in: parsed.data.agentIds } },
      select: {
        id: true,
        name: true,
        currentVersionNumber: true,
        inputFormat: true,
        outputFormat: true,
      },
    });

    if (agents.length !== parsed.data.agentIds.length) {
      return NextResponse.json({ error: "One or more selected agents were not found" }, { status: 404 });
    }

    const orderedAgents = parsed.data.agentIds.map((agentId) => agents.find((agent) => agent.id === agentId)!);
    const compatibilityWarnings = orderedAgents.slice(0, -1).flatMap((agent, index) => {
      const nextAgent = orderedAgents[index + 1];
      const warning = describeFormatCompatibility(agent.outputFormat, nextAgent.inputFormat);

      return warning ? [{ from: agent.name, to: nextAgent.name, message: warning }] : [];
    });

    if (compatibilityWarnings.length > 0) {
      return NextResponse.json(
        { error: "Selected agents are not chain-compatible", compatibilityWarnings },
        { status: 400 },
      );
    }

    const pack = await prisma.agentPack.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        creatorId: user.id,
        isPublic: parsed.data.isPublic,
        items: {
          create: orderedAgents.map((agent, index) => ({
            agentId: agent.id,
            agentVersionNumber: agent.currentVersionNumber,
            position: index,
          })),
        },
      },
    });

    return NextResponse.json({ pack }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create pack" }, { status: 500 });
  }
}