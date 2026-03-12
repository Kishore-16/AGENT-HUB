import { redirect } from "next/navigation";

import { SubmitAgentForm } from "./submit-agent-form";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SubmitAgentPageProps = {
  searchParams: Promise<{ remix?: string }>;
};

export default async function SubmitAgentPage({ searchParams }: SubmitAgentPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const remixSource = params.remix
    ? await prisma.agent.findUnique({
        where: { id: params.remix },
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
          version: true,
          creator: { select: { name: true } },
        },
      })
    : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">
        {remixSource ? "Remix Agent" : "Submit New Agent"}
      </h1>
      <p className="mt-2 text-slate-600">
        {remixSource
          ? "Fork an existing agent, edit the prompt or endpoint, and publish your own variant."
          : "Publish your AI agent so others can discover and integrate it."}
      </p>

      <div className="mt-6">
        <SubmitAgentForm
          initialValues={remixSource ? {
            name: `${remixSource.name} Remix`,
            description: remixSource.description,
            category: remixSource.category,
            apiUrl: remixSource.apiUrl,
            tags: remixSource.tags,
            inputFormat: remixSource.inputFormat,
            outputFormat: remixSource.outputFormat,
            systemPrompt: remixSource.systemPrompt,
            remixedFromAgentId: remixSource.id,
          } : undefined}
          remixSource={remixSource ? {
            id: remixSource.id,
            name: remixSource.name,
            version: remixSource.version,
            creatorName: remixSource.creator.name,
          } : null}
        />
      </div>
    </main>
  );
}
