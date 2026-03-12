import { ExecutionStatus, WorkflowMode } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { areFormatsCompatible, describeFormatCompatibility } from "@/lib/agent-formats";
import { deliverWebhook, invokeAgent } from "@/lib/agent-execution";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const workflowSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("PACK"),
    packId: z.string().uuid(),
    input: z.string().min(1),
    webhookUrl: z.string().url().optional(),
  }),
  z.object({
    mode: z.literal("BENCHMARK"),
    agentIds: z.array(z.string().uuid()).min(2).max(3),
    input: z.string().min(1),
    userSystemPrompt: z.string().optional().default(""),
    webhookUrl: z.string().url().optional(),
  }),
]);

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const parsed = workflowSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid workflow payload" }, { status: 400 });
    }

    if (parsed.data.mode === "PACK") {
      const pack = await prisma.agentPack.findUnique({
        where: { id: parsed.data.packId },
        include: {
          items: {
            orderBy: { position: "asc" },
            include: {
              agent: {
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
              },
            },
          },
        },
      });

      if (!pack || (!pack.isPublic && pack.creatorId !== user?.id)) {
        return NextResponse.json({ error: "Pack not found" }, { status: 404 });
      }

      const compatibilityWarnings = pack.items.slice(0, -1).flatMap((item, index) => {
        const nextItem = pack.items[index + 1];
        const warning = describeFormatCompatibility(item.agent.outputFormat, nextItem.agent.inputFormat);
        return warning
          ? [{ from: item.agent.name, to: nextItem.agent.name, message: warning }]
          : [];
      });

      if (compatibilityWarnings.length > 0) {
        return NextResponse.json(
          {
            error: "Pack contains incompatible agent types",
            compatibilityWarnings,
          },
          { status: 400 },
        );
      }

      const stepResults: Array<{
        agentId: string;
        agentName: string;
        versionLabel: string;
        status: ExecutionStatus;
        output: string;
        responseTime: number;
        errorMessage?: string;
        usedVersionId?: string;
      }> = [];

      let currentInput = parsed.data.input;
      let finalStatus: ExecutionStatus = ExecutionStatus.SUCCESS;
      let finalOutput = "";
      let totalDuration = 0;

      for (const [index, item] of pack.items.entries()) {
        const result = await invokeAgent(item.agent, {
          input: currentInput,
          versionNumber: item.agentVersionNumber,
        });
        totalDuration += result.responseTime;
        stepResults.push({
          agentId: item.agent.id,
          agentName: item.agent.name,
          versionLabel: result.usedVersionLabel,
          status: result.status,
          output: result.output,
          responseTime: result.responseTime,
          errorMessage: result.errorMessage,
          usedVersionId: result.usedVersionId,
        });

        finalOutput = result.output;
        finalStatus = result.status;

        if (result.status !== ExecutionStatus.SUCCESS) {
          break;
        }

        currentInput = result.output;

        if (index === pack.items.length - 1) {
          finalStatus = result.status;
        }
      }

      const workflowRun = await prisma.workflowRun.create({
        data: {
          userId: user?.id,
          packId: pack.id,
          mode: WorkflowMode.PACK,
          title: pack.name,
          input: parsed.data.input,
          finalOutput,
          durationMs: totalDuration,
          status: finalStatus,
          errorMessage: stepResults.find((step) => step.status !== ExecutionStatus.SUCCESS)?.errorMessage,
          webhookUrl: parsed.data.webhookUrl,
          metadata: {
            packId: pack.id,
            compatibilityWarnings: [],
          },
        },
      });

      await prisma.agentRun.createMany({
        data: stepResults.map((step, index) => ({
          agentId: step.agentId,
          agentVersionId: step.usedVersionId,
          workflowRunId: workflowRun.id,
          userId: user?.id,
          input: index === 0 ? parsed.data.input : stepResults[index - 1].output,
          output: step.output,
          responseTime: step.responseTime,
          status: step.status,
          errorMessage: step.errorMessage,
          stepIndex: index,
        })),
      });

      const webhookResult = await deliverWebhook(parsed.data.webhookUrl, {
        workflowRunId: workflowRun.id,
        mode: "pack",
        status: finalStatus,
        input: parsed.data.input,
        output: finalOutput,
        pack: { id: pack.id, name: pack.name },
        steps: stepResults,
      });

      if (webhookResult.webhookStatus !== "NOT_REQUESTED") {
        await prisma.workflowRun.update({ where: { id: workflowRun.id }, data: webhookResult });
      }

      return NextResponse.json({
        workflowRunId: workflowRun.id,
        status: finalStatus,
        finalOutput,
        steps: stepResults,
      });
    }

    const benchmarkData = parsed.data;

    const agents = await prisma.agent.findMany({
      where: { id: { in: benchmarkData.agentIds } },
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

    if (agents.length !== benchmarkData.agentIds.length) {
      return NextResponse.json({ error: "One or more agents were not found" }, { status: 404 });
    }

    const orderedAgents = benchmarkData.agentIds.map((agentId) => agents.find((agent) => agent.id === agentId)!);
    const results = await Promise.all(
      orderedAgents.map((agent) =>
        invokeAgent(agent, {
          input: benchmarkData.input,
          userSystemPrompt: benchmarkData.userSystemPrompt,
        }),
      ),
    );

    const durationMs = results.reduce((sum, result) => sum + result.responseTime, 0);
    const finalStatus = results.every((result) => result.status === ExecutionStatus.SUCCESS)
      ? ExecutionStatus.SUCCESS
      : results.some((result) => result.status === ExecutionStatus.ERROR)
        ? ExecutionStatus.ERROR
        : ExecutionStatus.EMPTY;

    const workflowRun = await prisma.workflowRun.create({
      data: {
        userId: user?.id,
        mode: WorkflowMode.BENCHMARK,
        title: "Benchmark",
        input: benchmarkData.input,
        finalOutput: JSON.stringify(
          orderedAgents.map((agent, index) => ({
            agentId: agent.id,
            agentName: agent.name,
            output: results[index].output,
            status: results[index].status,
          })),
        ),
        durationMs,
        status: finalStatus,
        errorMessage: results.find((result) => result.status !== ExecutionStatus.SUCCESS)?.errorMessage,
        webhookUrl: benchmarkData.webhookUrl,
      },
    });

    await prisma.agentRun.createMany({
      data: orderedAgents.map((agent, index) => ({
        agentId: agent.id,
        agentVersionId: results[index].usedVersionId,
        workflowRunId: workflowRun.id,
        userId: user?.id,
        input: benchmarkData.input,
        output: results[index].output,
        responseTime: results[index].responseTime,
        status: results[index].status,
        errorMessage: results[index].errorMessage,
        stepIndex: index,
      })),
    });

    const formattedResults = orderedAgents.map((agent, index) => ({
      agentId: agent.id,
      agentName: agent.name,
      versionLabel: results[index].usedVersionLabel,
      output: results[index].output,
      responseTime: results[index].responseTime,
      status: results[index].status,
      errorMessage: results[index].errorMessage,
    }));

    const webhookResult = await deliverWebhook(benchmarkData.webhookUrl, {
      workflowRunId: workflowRun.id,
      mode: "benchmark",
      status: finalStatus,
      input: benchmarkData.input,
      results: formattedResults,
    });

    if (webhookResult.webhookStatus !== "NOT_REQUESTED") {
      await prisma.workflowRun.update({ where: { id: workflowRun.id }, data: webhookResult });
    }

    return NextResponse.json({
      workflowRunId: workflowRun.id,
      status: finalStatus,
      results: formattedResults,
      compatibility: orderedAgents.slice(0, -1).map((agent, index) => ({
        from: agent.name,
        to: orderedAgents[index + 1].name,
        compatible: areFormatsCompatible(agent.outputFormat, orderedAgents[index + 1].inputFormat),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to execute workflow" }, { status: 500 });
  }
}