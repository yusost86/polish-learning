const SLUG_CHARS = "a-z0-9\\u0100-\\u024f\\u0400-\\u04FF";

export function normalizeWordText(value: string): string {
  return value.trim().normalize("NFC").toLowerCase().replace(/\s+/g, " ");
}

function slugifyText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFC")
    .replace(/\s+/g, "-")
    .replace(new RegExp(`[^${SLUG_CHARS}-]`, "g"), "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugifyTopicId(topic: string): string {
  const trimmed = topic.trim();
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return slugifyText(trimmed);
}

export function slugifyWordId(term: string): string {
  return slugifyText(term);
}

export function buildWordId(topicId: string, polishTerm: string): string | null {
  const termSlug = slugifyWordId(polishTerm);
  if (!termSlug) {
    return null;
  }
  return `${topicId}--${termSlug}`;
}

export function wordDedupKey(topicId: string, polishTerm: string, ukrainianTranslation: string): string {
  return `${topicId}|${normalizeWordText(polishTerm)}|${normalizeWordText(ukrainianTranslation)}`;
}
