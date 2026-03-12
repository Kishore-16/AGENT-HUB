import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const rateSchema = z.object({
  score: z.int().min(1).max(5),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: agentId } = await params;

  const body = await req.json();
  const parsed = rateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Score must be an integer between 1 and 5" }, { status: 400 });
  }

  const { score } = parsed.data;

  const agent = await prisma.agent.findUnique({ where: { id: agentId }, select: { id: true } });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const [, aggregate] = await prisma.$transaction([
    prisma.rating.upsert({
      where: { agentId_userId: { agentId, userId: user.id } },
      create: { agentId, userId: user.id, score },
      update: { score },
    }),
    prisma.rating.aggregate({
      where: { agentId },
      _avg: { score: true },
      _count: { score: true },
    }),
  ]);

  const newAverage = aggregate._avg.score ?? 0;
  const totalRatings = aggregate._count.score;

  await prisma.agent.update({
    where: { id: agentId },
    data: { rating: newAverage },
  });

  return NextResponse.json({ rating: newAverage, totalRatings });
}
