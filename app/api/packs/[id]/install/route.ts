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
  const pack = await prisma.agentPack.findUnique({ where: { id }, select: { id: true, isPublic: true } });

  if (!pack || !pack.isPublic) {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  }

  const install = await prisma.packInstall.upsert({
    where: { packId_userId: { packId: id, userId: user.id } },
    update: {},
    create: { packId: id, userId: user.id },
  });

  return NextResponse.json({ install }, { status: 201 });
}