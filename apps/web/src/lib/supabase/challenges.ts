import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChallengePublic, SustainabilityCategory } from "@/lib/api/client";

type CategoryRow = {
  id: string;
  slug: string;
  name_es: string;
  description_es: string | null;
};

type ChallengeCategoryRow = {
  sustainability_categories: CategoryRow | CategoryRow[] | null;
};

function flattenCategories(links: ChallengeCategoryRow[] | null): CategoryRow[] {
  return (links ?? []).flatMap((link) => {
    const raw = link.sustainability_categories;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  });
}

type ChallengeRow = {
  id: string;
  title: string;
  description: string;
  privacy_mode?: string | null;
  company?: {
    id?: string;
    organization_name?: string | null;
    full_name?: string | null;
    business_sector?: string | null;
  } | null;
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
  // Call secure RPC that returns public challenges joined with minimal profile info
  const { data, error } = await supabase.rpc("get_public_challenges");

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ChallengeRow[];

  return rows.map((row) => {
    const categories: SustainabilityCategory[] = flattenCategories(row.challenge_categories);

    // compute public display name based on privacy_mode and company profile
    // the public view flattens some profile fields
    const company = row.company ?? {
      id: row.company?.id ?? undefined,
      organization_name: (row as any).organization_name ?? null,
      full_name: (row as any).full_name ?? null,
      business_sector: (row as any).business_sector ?? null,
    };
    const privacy = row.privacy_mode ?? "pseudonymized";
    let public_display_name: string | null = null;
    if (privacy === "original" && company) {
      public_display_name = company.organization_name ?? company.full_name ?? null;
    } else if (privacy === "pseudonymized" && company) {
      const short = company.id ? company.id.slice(0, 8) : "org";
      public_display_name = `Empresa ${company.organization_name ?? "Anónima"} (${short})`;
    } else if (privacy === "anonymous") {
      const sector = (company?.business_sector ?? "general").trim() || "general";
      public_display_name = `Entidad del Sector ${sector} - Anónima`;
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      public_display_name,
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
      privacy_mode,
      company:profiles(id, organization_name, full_name, business_sector),
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
  const categories: SustainabilityCategory[] = flattenCategories(row.challenge_categories);

  const company = row.company ?? null;
  const privacy = row.privacy_mode ?? "pseudonymized";
  let public_display_name: string | null = null;
  if (privacy === "original" && company) {
    public_display_name = company.organization_name ?? company.full_name ?? null;
  } else if (privacy === "pseudonymized" && company) {
    const short = company.id ? company.id.slice(0, 8) : "org";
    public_display_name = `Empresa ${company.organization_name ?? "Anónima"} (${short})`;
  } else if (privacy === "anonymous") {
    const sector = (company?.business_sector ?? "general").trim() || "general";
    public_display_name = `Entidad del Sector ${sector} - Anónima`;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    public_display_name,
    status: row.status,
    environmental_impact: row.environmental_impact,
    deadline: row.deadline,
    published_at: row.published_at,
    categories,
  };
}
