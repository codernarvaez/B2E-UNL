export type PrivacyMode = "original" | "pseudonymized" | "anonymous";

export interface PrivacyIdentity {
  organizationName: string | null;
  fullName: string | null;
  businessSector: string | null;
}

function normalizeText(value: string): string {
  return value.trim();
}

function sectorCode(sector: string): string {
  const letters = sector.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return (letters.slice(0, 3) || "TEC").padEnd(3, "X");
}

function hashLabel(input: string): string {
  let hash = 0;
  for (const ch of input) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  const number = String(hash % 10000).padStart(4, "0");
  const suffix = String.fromCharCode(65 + (hash % 26));
  return `${number}-${suffix}`;
}

export function privacyLabel(mode: PrivacyMode): string {
  if (mode === "anonymous") return "Totalmente anónimo";
  if (mode === "pseudonymized") return "Seudonimizado B2E";
  return "Original (identificable)";
}

export function publicAlias(identity: PrivacyIdentity, mode: PrivacyMode): string {
  const baseName = normalizeText(identity.organizationName ?? identity.fullName ?? "");
  const sector = normalizeText(identity.businessSector ?? "general") || "general";

  if (mode === "original") {
    return baseName || "Entidad registrada";
  }

  if (mode === "pseudonymized") {
    const seed = baseName || sector;
    return `CORP-${sectorCode(sector)}-${hashLabel(seed)}`;
  }

  return `[Entidad del Sector ${sector} - Anónima]`;
}

export function anonymizeText(
  text: string,
  identity: PrivacyIdentity,
  mode: PrivacyMode,
): string {
  if (mode === "original") return text;

  const alias = publicAlias(identity, mode);
  const candidates = [identity.organizationName, identity.fullName].filter(
    (candidate): candidate is string => Boolean(candidate && candidate.trim()),
  );

  let sanitized = text;
  for (const candidate of candidates) {
    sanitized = sanitized.replaceAll(candidate, alias);
    sanitized = sanitized.replaceAll(candidate.toLowerCase(), alias);
  }

  return sanitized;
}
