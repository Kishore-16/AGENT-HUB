import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createAgentSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(20),
  category: z.string().min(2),
  apiUrl: z.string().url(),
  tags: z.array(z.string().min(1)).min(1),
  inputFormat: z.string().optional().default(""),
  outputFormat: z.string().optional().default(""),
  systemPrompt: z.string().optional().default(""),
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
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({ agents });
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

    const agent = await prisma.agent.create({
      data: {
        ...parsed.data,
        creatorId: user.id,
      },
      include: {
        creator: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to submit agent" }, { status: 500 });
  }
}
