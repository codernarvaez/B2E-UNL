const API_BASE = import.meta.env.PUBLIC_API_URL ?? "http://localhost:8000";

export interface SustainabilityCategory {
  id: string;
  slug: string;
  name_es: string;
  description_es: string | null;
}

export interface ChallengePublic {
  id: string;
  title: string;
  description: string;
  status: string;
  environmental_impact: Record<string, string>;
  deadline: string | null;
  published_at: string | null;
  categories: SustainabilityCategory[];
}

export async function fetchPublicChallenges(): Promise<ChallengePublic[]> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1/challenges/public`);
  } catch {
    throw new Error("fetch failed");
  }
  if (!res.ok) {
    throw new Error(`API respondió ${res.status}`);
  }
  return res.json() as Promise<ChallengePublic[]>;
}

export async function fetchPublicChallenge(id: string): Promise<ChallengePublic> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1/challenges/public/${id}`);
  } catch {
    throw new Error("fetch failed");
  }
  if (!res.ok) {
    throw new Error("Reto no encontrado");
  }
  return res.json() as Promise<ChallengePublic>;
}

export async function fetchWithAuth<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error("fetch failed");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail ?? "Error en la solicitud");
  }
  return res.json() as Promise<T>;
}
