import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

function isPrivateOrUnsafeUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== "https:") return true;
    const hostname = url.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "0.0.0.0") return true;
    if (/^127\./.test(hostname)) return true;
    if (/^10\./.test(hostname)) return true;
    if (/^192\.168\./.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true;
    if (/^169\.254\./.test(hostname)) return true;
    return false;
  } catch {
    return true;
  }
}

const runAgentSchema = z.object({
  agentId: z.string().min(1),
  input: z.string().min(1),
  userSystemPrompt: z.string().optional().default(""),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = runAgentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid run request" }, { status: 400 });
    }

    const { agentId, input, userSystemPrompt } = parsed.data;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { apiUrl: true, systemPrompt: true },
    });

    const targetApiUrl = agent?.apiUrl;

    if (!targetApiUrl) {
      return NextResponse.json({ error: "Agent API URL not found" }, { status: 404 });
    }

    if (isPrivateOrUnsafeUrl(targetApiUrl)) {
      return NextResponse.json({ error: "Agent API URL is not allowed" }, { status: 400 });
    }

    const startedAt = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const combinedSystemPrompt = [agent?.systemPrompt, userSystemPrompt]
      .map((s) => s?.trim())
      .filter(Boolean)
      .join("\n\n");

    const response = await fetch(targetApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input,
        ...(combinedSystemPrompt ? { system_prompt: combinedSystemPrompt } : {}),
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    const responseTime = Date.now() - startedAt;

    if (!response.ok) {
      return NextResponse.json(
        { error: `Agent API error (${response.status})` },
        { status: 502 },
      );
    }

    let output: string;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      output = data.output ?? JSON.stringify(data);
    } else {
      output = await response.text();
    }

    await prisma.agentRun.create({
      data: { agentId, input, output, responseTime },
    });

    return NextResponse.json({ output });
  } catch {
    return NextResponse.json({ error: "Failed to execute agent" }, { status: 500 });
  }
}
