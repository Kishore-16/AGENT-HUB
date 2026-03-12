import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createPromptSchema = z.object({
  title: z.string().min(3),
  goal: z.string().min(5),
  prompt: z.string().min(10),
  description: z.string().optional().default(""),
  agentId: z.string().uuid().optional(),
  packId: z.string().uuid().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";

  const prompts = await prisma.promptTemplate.findMany({
    where: query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { goal: { contains: query, mode: "insensitive" } },
            { prompt: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      creator: { select: { name: true } },
      agent: { select: { id: true, name: true } },
      pack: { select: { id: true, name: true } },
      _count: { select: { votes: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({ prompts });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createPromptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid prompt payload" }, { status: 400 });
    }

    const prompt = await prisma.promptTemplate.create({
      data: {
        ...parsed.data,
        creatorId: user.id,
      },
    });

    return NextResponse.json({ prompt }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to publish prompt" }, { status: 500 });
  }
}