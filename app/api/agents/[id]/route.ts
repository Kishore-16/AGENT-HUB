import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Context) {
  const { id } = await params;

  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      creator: {
        select: { name: true, email: true },
      },
      _count: { select: { runs: true, ratings: true } },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json({ agent });
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

  const existing = await prisma.agent.findUnique({ where: { id }, select: { creatorId: true } });
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

  const agent = await prisma.agent.update({
    where: { id },
    data: parsed.data,
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
