CREATE VIEW public.public_challenges AS
SELECT
  c.id,
  c.title,
  c.description,
  c.status,
  c.environmental_impact,
  c.deadline,
  c.published_at,
  c.privacy_mode,
  p.id AS company_id,
  p.organization_name,
  p.full_name,
  p.business_sector
FROM public.challenges c
JOIN public.profiles p ON p.id = c.company_id
WHERE c.status = 'open' AND c.published_at IS NOT NULL;

-- Enable RLS on the view and allow anon select
ALTER VIEW public.public_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_challenges_select ON public.public_challenges
  FOR SELECT TO anon USING (true);
