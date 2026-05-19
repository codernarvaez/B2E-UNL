import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChallengePublic, SustainabilityCategory } from "@/lib/api/client";

type CategoryRow = {
  id: string;
  slug: string;
  name_es: string;
  description_es: string | null;
};

type ChallengeCategoryRow = {
  sustainability_categories: CategoryRow | null;
};

type ChallengeRow = {
  id: string;
  title: string;
  description: string;
  status: string;
  environmental_impact: Record<string, string>;
  deadline: string | null;
  published_at: string | null;
  challenge_categories: ChallengeCategoryRow[] | null;
};

/** Tablero público vía PostgREST + RLS (no requiere API FastAPI). */
export async function fetchPublicChallengesFromSupabase(
  supabase: SupabaseClient,
): Promise<ChallengePublic[]> {
  const { data, error } = await supabase
    .from("challenges")
    .select(
      `
      id,
      title,
      description,
      status,
      environmental_impact,
      deadline,
      published_at,
      challenge_categories (
        sustainability_categories (
          id,
          slug,
          name_es,
          description_es
        )
      )
    `,
    )
    .eq("status", "open")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ChallengeRow[];

  return rows.map((row) => {
    const categories: SustainabilityCategory[] = (row.challenge_categories ?? [])
      .map((link) => link.sustainability_categories)
      .filter((cat): cat is CategoryRow => cat !== null);

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      environmental_impact: row.environmental_impact,
      deadline: row.deadline,
      published_at: row.published_at,
      categories,
    };
  });
}

export async function fetchPublicChallengeFromSupabase(
  supabase: SupabaseClient,
  id: string,
): Promise<ChallengePublic> {
  const { data, error } = await supabase
    .from("challenges")
    .select(
      `
      id,
      title,
      description,
      status,
      environmental_impact,
      deadline,
      published_at,
      challenge_categories (
        sustainability_categories (
          id,
          slug,
          name_es,
          description_es
        )
      )
    `,
    )
    .eq("id", id)
    .eq("status", "open")
    .not("published_at", "is", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("Reto no encontrado");
  }

  const row = data as ChallengeRow;
  const categories: SustainabilityCategory[] = (row.challenge_categories ?? [])
    .map((link) => link.sustainability_categories)
    .filter((cat): cat is CategoryRow => cat !== null);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    environmental_impact: row.environmental_impact,
    deadline: row.deadline,
    published_at: row.published_at,
    categories,
  };
}
