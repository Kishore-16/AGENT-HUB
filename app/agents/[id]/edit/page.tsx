import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditAgentForm } from "./edit-agent-form";

type EditAgentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAgentPage({ params }: EditAgentPageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const agent = await prisma.agent.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      apiUrl: true,
      tags: true,
      inputFormat: true,
      outputFormat: true,
      systemPrompt: true,
      creatorId: true,
    },
  });

  if (!agent || agent.creatorId !== user.id) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Edit Agent</h1>
      <p className="mt-2 text-slate-600">Update your agent&apos;s details below.</p>

      <div className="mt-6">
        <EditAgentForm
          agentId={agent.id}
          defaultValues={{
            name: agent.name,
            description: agent.description,
            category: agent.category,
            apiUrl: agent.apiUrl,
            tags: agent.tags,
            inputFormat: agent.inputFormat,
            outputFormat: agent.outputFormat,
            systemPrompt: agent.systemPrompt,
          }}
        />
      </div>
    </main>
  );
}
