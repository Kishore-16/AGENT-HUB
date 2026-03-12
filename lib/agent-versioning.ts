type VersionableAgent = {
  name: string;
  description: string;
  category: string;
  apiUrl: string;
  tags: string[];
  inputFormat: string;
  outputFormat: string;
  systemPrompt: string;
};

export function getVersionLabel(versionNumber: number): string {
  return `v${versionNumber}`;
}

export function buildVersionSnapshot(agent: VersionableAgent, createdById?: string | null) {
  return {
    name: agent.name,
    description: agent.description,
    category: agent.category,
    apiUrl: agent.apiUrl,
    tags: agent.tags,
    inputFormat: agent.inputFormat,
    outputFormat: agent.outputFormat,
    systemPrompt: agent.systemPrompt,
    ...(createdById ? { createdById } : {}),
  };
}