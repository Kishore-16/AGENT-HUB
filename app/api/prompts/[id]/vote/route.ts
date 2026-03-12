import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const prompt = await prisma.promptTemplate.findUnique({ where: { id }, select: { id: true } });
  if (!prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const vote = await prisma.promptVote.upsert({
    where: {
      promptTemplateId_userId: {
        promptTemplateId: id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      promptTemplateId: id,
      userId: user.id,
    },
  });

  return NextResponse.json({ vote }, { status: 201 });
}

export async function DELETE(_: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.promptVote.deleteMany({
    where: {
      promptTemplateId: id,
      userId: user.id,
    },
  });

  return new NextResponse(null, { status: 204 });
}