import { ExecutionStatus, WebhookStatus } from "@prisma/client";

type VersionSnapshot = {
  id: string;
  versionNumber: number;
  versionLabel: string;
  apiUrl: string;
  systemPrompt: string;
  inputFormat: string;
  outputFormat: string;
};

type ExecutableAgent = {
  id: string;
  name: string;
  apiUrl: string;
  systemPrompt: string;
  inputFormat: string;
  outputFormat: string;
  version: string;
  currentVersionNumber: number;
  versions?: VersionSnapshot[];
};

export type AgentInvocationResult = {
  status: ExecutionStatus;
  output: string;
  responseTime: number;
  errorMessage?: string;
  usedVersionId?: string;
  usedVersionNumber: number;
  usedVersionLabel: string;
  inputFormat: string;
  outputFormat: string;
};

type DeliverWebhookResult = {
  webhookStatus: WebhookStatus;
  webhookResponseCode?: number;
  webhookError?: string;
};

export function isPrivateOrUnsafeUrl(urlString: string): boolean {
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

function resolveVersion(agent: ExecutableAgent, versionNumber?: number) {
  if (!versionNumber || versionNumber === agent.currentVersionNumber) {
    const currentVersion = agent.versions?.find((version) => version.versionNumber === agent.currentVersionNumber);

    return {
      apiUrl: agent.apiUrl,
      systemPrompt: agent.systemPrompt,
      inputFormat: agent.inputFormat,
      outputFormat: agent.outputFormat,
      usedVersionId: currentVersion?.id,
      usedVersionNumber: agent.currentVersionNumber,
      usedVersionLabel: agent.version,
    };
  }

  const selectedVersion = agent.versions?.find((version) => version.versionNumber === versionNumber);
  if (!selectedVersion) {
    return null;
  }

  return {
    apiUrl: selectedVersion.apiUrl,
    systemPrompt: selectedVersion.systemPrompt,
    inputFormat: selectedVersion.inputFormat,
    outputFormat: selectedVersion.outputFormat,
    usedVersionId: selectedVersion.id,
    usedVersionNumber: selectedVersion.versionNumber,
    usedVersionLabel: selectedVersion.versionLabel,
  };
}

export async function invokeAgent(
  agent: ExecutableAgent,
  options: {
    input: string;
    userSystemPrompt?: string;
    versionNumber?: number;
    timeoutMs?: number;
  },
): Promise<AgentInvocationResult> {
  const resolvedVersion = resolveVersion(agent, options.versionNumber);

  if (!resolvedVersion) {
    return {
      status: ExecutionStatus.ERROR,
      output: "",
      responseTime: 0,
      errorMessage: "Requested agent version was not found.",
      usedVersionNumber: options.versionNumber ?? agent.currentVersionNumber,
      usedVersionLabel: `v${options.versionNumber ?? agent.currentVersionNumber}`,
      inputFormat: agent.inputFormat,
      outputFormat: agent.outputFormat,
    };
  }

  if (isPrivateOrUnsafeUrl(resolvedVersion.apiUrl)) {
    return {
      status: ExecutionStatus.ERROR,
      output: "",
      responseTime: 0,
      errorMessage: "Agent API URL is not allowed.",
      usedVersionId: resolvedVersion.usedVersionId,
      usedVersionNumber: resolvedVersion.usedVersionNumber,
      usedVersionLabel: resolvedVersion.usedVersionLabel,
      inputFormat: resolvedVersion.inputFormat,
      outputFormat: resolvedVersion.outputFormat,
    };
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);

  const combinedSystemPrompt = [resolvedVersion.systemPrompt, options.userSystemPrompt]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join("\n\n");

  try {
    const response = await fetch(resolvedVersion.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: options.input,
        ...(combinedSystemPrompt ? { system_prompt: combinedSystemPrompt } : {}),
      }),
      signal: controller.signal,
    });

    const responseTime = Date.now() - startedAt;
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        status: ExecutionStatus.ERROR,
        output: "",
        responseTime,
        errorMessage: `Agent API error (${response.status})`,
        usedVersionId: resolvedVersion.usedVersionId,
        usedVersionNumber: resolvedVersion.usedVersionNumber,
        usedVersionLabel: resolvedVersion.usedVersionLabel,
        inputFormat: resolvedVersion.inputFormat,
        outputFormat: resolvedVersion.outputFormat,
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    let output: string;

    if (contentType.includes("application/json")) {
      const data = await response.json();
      output = typeof data.output === "string" ? data.output : JSON.stringify(data);
    } else {
      output = await response.text();
    }

    const status = output.trim() ? ExecutionStatus.SUCCESS : ExecutionStatus.EMPTY;

    return {
      status,
      output,
      responseTime,
      ...(status === ExecutionStatus.EMPTY ? { errorMessage: "Agent returned an empty response." } : {}),
      usedVersionId: resolvedVersion.usedVersionId,
      usedVersionNumber: resolvedVersion.usedVersionNumber,
      usedVersionLabel: resolvedVersion.usedVersionLabel,
      inputFormat: resolvedVersion.inputFormat,
      outputFormat: resolvedVersion.outputFormat,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    return {
      status: ExecutionStatus.ERROR,
      output: "",
      responseTime: Date.now() - startedAt,
      errorMessage: error instanceof Error && error.name === "AbortError"
        ? "Agent request timed out after 5 seconds."
        : "Failed to execute agent.",
      usedVersionId: resolvedVersion.usedVersionId,
      usedVersionNumber: resolvedVersion.usedVersionNumber,
      usedVersionLabel: resolvedVersion.usedVersionLabel,
      inputFormat: resolvedVersion.inputFormat,
      outputFormat: resolvedVersion.outputFormat,
    };
  }
}

export async function deliverWebhook(
  webhookUrl: string | undefined,
  payload: Record<string, unknown>,
): Promise<DeliverWebhookResult> {
  if (!webhookUrl) {
    return { webhookStatus: WebhookStatus.NOT_REQUESTED };
  }

  if (isPrivateOrUnsafeUrl(webhookUrl)) {
    return {
      webhookStatus: WebhookStatus.FAILED,
      webhookError: "Webhook URL must be a public HTTPS endpoint.",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        webhookStatus: WebhookStatus.FAILED,
        webhookResponseCode: response.status,
        webhookError: `Webhook returned ${response.status}.`,
      };
    }

    return {
      webhookStatus: WebhookStatus.SUCCESS,
      webhookResponseCode: response.status,
    };
  } catch {
    return {
      webhookStatus: WebhookStatus.FAILED,
      webhookError: "Webhook delivery failed.",
    };
  }
}