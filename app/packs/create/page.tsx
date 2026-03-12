import { redirect } from "next/navigation";

import { CreatePackForm } from "./create-pack-form";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CreatePackPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const agents = await prisma.agent.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      inputFormat: true,
      outputFormat: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Create Agent Pack</h1>
      <p className="mt-2 text-slate-600">Bundle 2-3 compatible agents into one installable workflow.</p>

      <div className="mt-6">
        <CreatePackForm agents={agents} />
      </div>
    </main>
  );
}