"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function SubmitAgentForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

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
      tags: tagsRaw
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      inputFormat: String(formData.get("inputFormat") ?? ""),
      outputFormat: String(formData.get("outputFormat") ?? ""),
      systemPrompt: String(formData.get("systemPrompt") ?? ""),
    };

    const response = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Unable to submit agent");
      return;
    }

    const data = (await response.json()) as { agent: { id: string } };
    setSuccessId(data.agent.id);
  }

  if (successId) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <svg
          className="mx-auto mb-3 h-12 w-12 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-semibold text-green-800">Agent submitted successfully!</h2>
        <p className="mt-1 text-sm text-green-700">Your agent has been published and is now discoverable.</p>
        <div className="mt-4 flex justify-center gap-3">
          <Link
            href={`/agents/${successId}`}
            className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-800"
          >
            View Agent
          </Link>
          <Link
            href="/agents"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Browse Agents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">Agent Name</label>
          <input
            id="name"
            name="name"
            required
            placeholder="e.g. Research Assistant"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="category" className="text-sm font-medium text-slate-700">Category</label>
          <input
            id="category"
            name="category"
            required
            placeholder="e.g. Productivity"
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
          placeholder="Describe what your agent does (at least 20 characters)"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="systemPrompt" className="text-sm font-medium text-slate-700">
          System Prompt <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="systemPrompt"
          name="systemPrompt"
          rows={5}
          placeholder="Provide the system prompt that instructs your agent how to behave..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <p className="text-xs text-slate-500">This prompt will be sent to the agent on every run to set its behaviour.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tags" className="text-sm font-medium text-slate-700">Tags</label>
        <input
          id="tags"
          name="tags"
          required
          placeholder="research, productivity, summarization"
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
          placeholder="https://your-agent-api.com/run"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="inputFormat" className="text-sm font-medium text-slate-700">Input Format</label>
          <input
            id="inputFormat"
            name="inputFormat"
            placeholder="e.g. Plain text prompt"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="outputFormat" className="text-sm font-medium text-slate-700">Output Format</label>
          <input
            id="outputFormat"
            name="outputFormat"
            placeholder="e.g. JSON / Plain text"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-cyan-700 px-4 py-2 font-medium text-white hover:bg-cyan-800 disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Submit Agent"}
      </button>
    </form>
  );
}
