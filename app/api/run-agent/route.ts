import { NextResponse } from "next/server";
import { ExecutionStatus, WorkflowMode } from "@prisma/client";
import { z } from "zod";

import { deliverWebhook, invokeAgent } from "@/lib/agent-execution";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const runAgentSchema = z.object({
  agentId: z.string().min(1),
  input: z.string().min(1),
  userSystemPrompt: z.string().optional().default(""),
  versionNumber: z.number().int().positive().optional(),
  webhookUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const parsed = runAgentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid run request" }, { status: 400 });
    }

    const { agentId, input, userSystemPrompt, versionNumber, webhookUrl } = parsed.data;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        apiUrl: true,
        systemPrompt: true,
        inputFormat: true,
        outputFormat: true,
        version: true,
        currentVersionNumber: true,
        versions: {
          select: {
            id: true,
            versionNumber: true,
            versionLabel: true,
            apiUrl: true,
            systemPrompt: true,
            inputFormat: true,
            outputFormat: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent API URL not found" }, { status: 404 });
    }

    const result = await invokeAgent(agent, {
      input,
      userSystemPrompt,
      versionNumber,
    });

    const workflowRun = await prisma.workflowRun.create({
      data: {
        userId: user?.id,
        mode: WorkflowMode.SINGLE,
        title: agent.name,
        input,
        finalOutput: result.output,
        durationMs: result.responseTime,
        status: result.status,
        errorMessage: result.errorMessage,
        webhookUrl,
        metadata: {
          agentId: agent.id,
          versionNumber: result.usedVersionNumber,
          versionLabel: result.usedVersionLabel,
        },
      },
    });

    const agentRun = await prisma.agentRun.create({
      data: {
        agentId: agent.id,
        agentVersionId: result.usedVersionId,
        workflowRunId: workflowRun.id,
        userId: user?.id,
        input,
        output: result.output,
        responseTime: result.responseTime,
        status: result.status,
        errorMessage: result.errorMessage,
        stepIndex: 0,
      },
    });

    const webhookResult = await deliverWebhook(webhookUrl, {
      workflowRunId: workflowRun.id,
      mode: "single",
      status: result.status,
      input,
      output: result.output,
      agent: {
        id: agent.id,
        name: agent.name,
        version: result.usedVersionLabel,
      },
    });

    if (webhookResult.webhookStatus !== "NOT_REQUESTED") {
      await prisma.workflowRun.update({
        where: { id: workflowRun.id },
        data: webhookResult,
      });
    }

    if (result.status !== ExecutionStatus.SUCCESS) {
      return NextResponse.json(
        {
          error: result.errorMessage ?? "Agent execution failed",
          output: result.output,
          status: result.status,
          runId: agentRun.id,
          workflowRunId: workflowRun.id,
          versionLabel: result.usedVersionLabel,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      output: result.output,
      status: result.status,
      runId: agentRun.id,
      workflowRunId: workflowRun.id,
      versionLabel: result.usedVersionLabel,
    });
  } catch {
    return NextResponse.json({ error: "Failed to execute agent" }, { status: 500 });
  }
}
