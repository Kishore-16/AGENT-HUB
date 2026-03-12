"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { COMMON_AGENT_FORMATS } from "@/lib/agent-formats";

type EditAgentFormProps = {
  agentId: string;
  currentVersionLabel: string;
  defaultValues: {
    name: string;
    description: string;
    category: string;
    apiUrl: string;
    tags: string[];
    inputFormat: string;
    outputFormat: string;
    systemPrompt: string;
  };
};

export function EditAgentForm({ agentId, currentVersionLabel, defaultValues }: EditAgentFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const tagsRaw = String(formData.get("tags") ?? "");

    const payload = {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      category: String(formData.get("category") ?? ""),
      apiUrl: String(formData.get("apiUrl") ?? ""),
      tags: tagsRaw.split(",").map((t) => t.trim()).filter(Boolean),
      inputFormat: String(formData.get("inputFormat") ?? ""),
      outputFormat: String(formData.get("outputFormat") ?? ""),
      systemPrompt: String(formData.get("systemPrompt") ?? ""),
    };

    const res = await fetch(`/api/agents/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Unable to update agent");
      return;
    }

    router.push("/developer-dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
        Current live version: <span className="font-semibold">{currentVersionLabel}</span>. Saving this form publishes a new version and keeps the old one accessible for existing workflows.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">Agent Name</label>
          <input
            id="name"
            name="name"
            required
            defaultValue={defaultValues.name}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="category" className="text-sm font-medium text-slate-700">Category</label>
          <input
            id="category"
            name="category"
            required
            defaultValue={defaultValues.category}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-slate-700">Description</label>
        <textarea
          id="description"
          name="description"
          required
          minLength={20}
          rows={4}
          defaultValue={defaultValues.description}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tags" className="text-sm font-medium text-slate-700">Tags</label>
        <input
          id="tags"
          name="tags"
          required
          defaultValue={defaultValues.tags.join(", ")}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <p className="text-xs text-slate-500">Separate tags with commas</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="apiUrl" className="text-sm font-medium text-slate-700">API Endpoint URL</label>
        <input
          id="apiUrl"
          name="apiUrl"
          type="url"
          required
          defaultValue={defaultValues.apiUrl}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="inputFormat" className="text-sm font-medium text-slate-700">Input Format</label>
          <input
            id="inputFormat"
            name="inputFormat"
            list="agent-format-options"
            defaultValue={defaultValues.inputFormat}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="outputFormat" className="text-sm font-medium text-slate-700">Output Format</label>
          <input
            id="outputFormat"
            name="outputFormat"
            list="agent-format-options"
            defaultValue={defaultValues.outputFormat}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      <datalist id="agent-format-options">
        {COMMON_AGENT_FORMATS.map((format) => (
          <option key={format.value} value={format.value}>
            {format.label}
          </option>
        ))}
      </datalist>

      <div className="flex flex-col gap-1">
        <label htmlFor="systemPrompt" className="text-sm font-medium text-slate-700">
          System Prompt <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="systemPrompt"
          name="systemPrompt"
          rows={5}
          defaultValue={defaultValues.systemPrompt}
          placeholder="Provide the system prompt that instructs your agent how to behave..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <p className="text-xs text-slate-500">This prompt will be sent to the agent on every run to set its behaviour.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-cyan-700 px-4 py-2 font-medium text-white hover:bg-cyan-800 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/developer-dashboard")}
          className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
