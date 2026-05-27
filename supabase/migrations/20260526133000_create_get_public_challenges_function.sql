
CREATE OR REPLACE FUNCTION public.get_public_challenges()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  privacy_mode text,
  organization_name text,
  full_name text,
  business_sector text,
  status text,
  environmental_impact jsonb,
  deadline date,
  published_at timestamptz
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    c.id,
    c.title,
    c.description,
    c.privacy_mode,
    p.organization_name,
    p.full_name,
    p.business_sector,
    c.status,
    c.environmental_impact,
    c.deadline,
    c.published_at
  FROM public.challenges c
  JOIN public.profiles p ON p.id = c.company_id
  WHERE c.status = 'open' AND c.published_at IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_challenges() TO anon;
