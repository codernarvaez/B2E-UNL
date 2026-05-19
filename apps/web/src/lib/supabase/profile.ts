import type { SupabaseClient } from "@supabase/supabase-js";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ProfileRow {
  id: string;
  role: "company" | "academic" | "admin";
  full_name: string;
  organization_name: string | null;
  tax_id: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  business_sector: string | null;
  contact_email: string | null;
  bio: string | null;
  approval_status: ApprovalStatus;
  created_at?: string;
}

export async function fetchMyProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, role, full_name, organization_name, tax_id, phone, address, website, business_sector, contact_email, bio, approval_status, created_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data as ProfileRow | null;
}
