import type { ProfileRow } from "@/lib/supabase/profile";

/** Perfil empresarial incompleto tras OAuth o registro parcial */
export function needsCompanyProfileCompletion(profile: ProfileRow | null): boolean {
  if (!profile) return true;
  if (profile.role !== "company") return true;
  return !profile.organization_name || !profile.tax_id;
}

export function dashboardPathForRole(role: ProfileRow["role"]): string {
  if (role === "admin") return "/dashboard";
  if (role === "company") return "/dashboard/empresa";
  return "/dashboard";
}
