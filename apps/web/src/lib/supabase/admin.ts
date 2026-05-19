import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApprovalStatus, ProfileRow } from "@/lib/supabase/profile";

export interface AdminStats {
  companies: number;
  companiesPending: number;
  academics: number;
  admins: number;
  challenges: number;
  challengesOpen: number;
  proposals: number;
}

export interface AdminChallengeRow {
  id: string;
  title: string;
  description: string;
  status: string;
  published_at: string | null;
  company_id: string;
  organization_name: string | null;
  environmental_impact: Record<string, string>;
}

export interface AdminProposalRow {
  id: string;
  title: string;
  status: string;
  challenge_id: string;
  academic_name: string;
  challenge_title: string | null;
}

export async function fetchAdminStats(supabase: SupabaseClient): Promise<AdminStats> {
  const [profilesRes, challengesRes, proposalsRes] = await Promise.all([
    supabase.from("profiles").select("role, approval_status"),
    supabase.from("challenges").select("id, status"),
    supabase.from("proposals").select("id", { count: "exact", head: true }),
  ]);

  if (profilesRes.error) throw new Error(profilesRes.error.message);
  if (challengesRes.error) throw new Error(challengesRes.error.message);

  const profiles = profilesRes.data ?? [];
  const challenges = challengesRes.data ?? [];
  const companies = profiles.filter((p) => p.role === "company");

  return {
    companies: companies.length,
    companiesPending: companies.filter((p) => p.approval_status === "pending").length,
    academics: profiles.filter((p) => p.role === "academic").length,
    admins: profiles.filter((p) => p.role === "admin").length,
    challenges: challenges.length,
    challengesOpen: challenges.filter((c) => c.status === "open").length,
    proposals: proposalsRes.count ?? 0,
  };
}

export async function fetchAdminProfiles(supabase: SupabaseClient): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, role, full_name, organization_name, tax_id, phone, address, website, business_sector, contact_email, bio, approval_status, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProfileRow[];
}

export async function fetchAdminChallenges(
  supabase: SupabaseClient,
): Promise<AdminChallengeRow[]> {
  const { data, error } = await supabase
    .from("challenges")
    .select("id, title, description, status, published_at, company_id, environmental_impact")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const companyIds = [...new Set(rows.map((r) => r.company_id as string))];
  const orgById = new Map<string, string | null>();

  if (companyIds.length > 0) {
    const { data: companies } = await supabase
      .from("profiles")
      .select("id, organization_name")
      .in("id", companyIds);
    for (const c of companies ?? []) {
      orgById.set(c.id as string, (c.organization_name as string | null) ?? null);
    }
  }

  return rows.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    status: row.status as string,
    published_at: row.published_at as string | null,
    company_id: row.company_id as string,
    organization_name: orgById.get(row.company_id as string) ?? null,
    environmental_impact: (row.environmental_impact as Record<string, string>) ?? {},
  }));
}

export async function fetchAdminProposals(
  supabase: SupabaseClient,
): Promise<AdminProposalRow[]> {
  const { data, error } = await supabase
    .from("proposals")
    .select("id, title, status, challenge_id, academic_id")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const academicIds = [...new Set(rows.map((r) => r.academic_id as string))];
  const challengeIds = [...new Set(rows.map((r) => r.challenge_id as string))];

  const nameById = new Map<string, string>();
  const titleByChallenge = new Map<string, string>();

  if (academicIds.length > 0) {
    const { data: academics } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", academicIds);
    for (const a of academics ?? []) {
      nameById.set(a.id as string, a.full_name as string);
    }
  }

  if (challengeIds.length > 0) {
    const { data: ch } = await supabase
      .from("challenges")
      .select("id, title")
      .in("id", challengeIds);
    for (const c of ch ?? []) {
      titleByChallenge.set(c.id as string, c.title as string);
    }
  }

  return rows.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    status: row.status as string,
    challenge_id: row.challenge_id as string,
    academic_name: nameById.get(row.academic_id as string) ?? "—",
    challenge_title: titleByChallenge.get(row.challenge_id as string) ?? null,
  }));
}

export async function updateCompanyApproval(
  supabase: SupabaseClient,
  profileId: string,
  status: ApprovalStatus,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ approval_status: status })
    .eq("id", profileId)
    .eq("role", "company");

  if (error) throw new Error(error.message);
}

export async function updateChallengeStatus(
  supabase: SupabaseClient,
  challengeId: string,
  status: string,
  publish: boolean,
): Promise<void> {
  const payload: Record<string, unknown> = { status };
  if (publish) {
    payload.published_at = new Date().toISOString();
  }
  const { error } = await supabase.from("challenges").update(payload).eq("id", challengeId);
  if (error) throw new Error(error.message);
}
