export const COMMON_AGENT_FORMATS = [
  { value: "plain_text", label: "Plain text" },
  { value: "markdown", label: "Markdown" },
  { value: "json", label: "JSON" },
  { value: "html", label: "HTML" },
  { value: "csv", label: "CSV" },
  { value: "image_url", label: "Image URL" },
  { value: "audio_url", label: "Audio URL" },
  { value: "any", label: "Any" },
] as const;

const FORMAT_ALIASES: Record<string, string> = {
  text: "plain_text",
  plaintext: "plain_text",
  plain_text: "plain_text",
  string: "plain_text",
  md: "markdown",
  markdown: "markdown",
  json: "json",
  object: "json",
  html: "html",
  csv: "csv",
  image: "image_url",
  image_url: "image_url",
  photo_url: "image_url",
  audio: "audio_url",
  audio_url: "audio_url",
  any: "any",
  unknown: "any",
};

const TEXT_TARGETS = new Set(["plain_text", "markdown", "html"]);
const MEDIA_TYPES = new Set(["image_url", "audio_url"]);

export function normalizeAgentFormat(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (!normalized) {
    return "plain_text";
  }

  return FORMAT_ALIASES[normalized] ?? normalized;
}

export function getAgentFormatLabel(value: string): string {
  const normalized = normalizeAgentFormat(value);
  const predefined = COMMON_AGENT_FORMATS.find((format) => format.value === normalized);

  if (predefined) {
    return predefined.label;
  }

  return value.trim() || "Plain text";
}

export function areFormatsCompatible(outputFormat: string, inputFormat: string): boolean {
  const source = normalizeAgentFormat(outputFormat);
  const target = normalizeAgentFormat(inputFormat);

  if (source === "any" || target === "any" || source === target) {
    return true;
  }

  if (TEXT_TARGETS.has(target) && !MEDIA_TYPES.has(source)) {
    return true;
  }

  if (target === "csv" && source === "json") {
    return true;
  }

  return false;
}

export function describeFormatCompatibility(outputFormat: string, inputFormat: string): string | null {
  if (areFormatsCompatible(outputFormat, inputFormat)) {
    return null;
  }

  return `${getAgentFormatLabel(outputFormat)} will not safely feed into ${getAgentFormatLabel(inputFormat)}.`;
}