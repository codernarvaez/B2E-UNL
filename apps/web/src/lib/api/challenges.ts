import type { SustainabilityCategory } from "@/lib/api/client";
import { fetchWithAuth } from "@/lib/api/client";

const API_BASE = import.meta.env.PUBLIC_API_URL ?? "http://localhost:8000";

export interface EnvironmentalImpactInput {
  summary: string;
  expected_metric: string;
  metric_unit: string;
  baseline_situation?: string | null;
  success_criteria?: string | null;
  technical_scope?: string | null;
}

export interface ChallengeMine {
  id: string;
  company_id: string;
  title: string;
  description: string;
  status: string;
  environmental_impact: EnvironmentalImpactInput;
  deadline: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  categories: SustainabilityCategory[];
}

export interface ProposalSummary {
  id: string;
  challenge_id: string;
  title: string;
  status: string;
  created_at: string;
}

export interface ChallengeCreateBody {
  title: string;
  description: string;
  environmental_impact: EnvironmentalImpactInput;
  category_ids: string[];
  deadline?: string | null;
  privacy_mode?: "original" | "pseudonymized" | "anonymous";
}

export async function fetchCategories(): Promise<SustainabilityCategory[]> {
  const res = await fetch(`${API_BASE}/api/v1/challenges/categories`);
  if (!res.ok) {
    throw new Error("No se pudieron cargar las categorías Green Tech");
  }
  return res.json() as Promise<SustainabilityCategory[]>;
}

export async function fetchMyChallenges(token: string): Promise<ChallengeMine[]> {
  return fetchWithAuth<ChallengeMine[]>("/api/v1/challenges/mine", token);
}

export async function fetchChallenge(token: string, id: string): Promise<ChallengeMine> {
  return fetchWithAuth<ChallengeMine>(`/api/v1/challenges/${id}`, token);
}

export async function createChallenge(
  token: string,
  body: ChallengeCreateBody,
): Promise<ChallengeMine> {
  return fetchWithAuth<ChallengeMine>("/api/v1/challenges", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateChallenge(
  token: string,
  id: string,
  body: Partial<ChallengeCreateBody>,
): Promise<ChallengeMine> {
  return fetchWithAuth<ChallengeMine>(`/api/v1/challenges/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function publishChallenge(token: string, id: string): Promise<ChallengeMine> {
  return fetchWithAuth<ChallengeMine>(`/api/v1/challenges/${id}/publish`, token, {
    method: "POST",
  });
}

export async function updateChallengeStatus(
  token: string,
  id: string,
  status: string,
): Promise<ChallengeMine> {
  return fetchWithAuth<ChallengeMine>(`/api/v1/challenges/${id}/status`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchProposalsForChallenge(
  token: string,
  challengeId: string,
): Promise<ProposalSummary[]> {
  return fetchWithAuth<ProposalSummary[]>(
    `/api/v1/proposals/by-challenge/${challengeId}`,
    token,
  );
}
