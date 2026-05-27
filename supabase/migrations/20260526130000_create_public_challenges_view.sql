
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
  CASE 
    WHEN c.privacy_mode = 'original' THEN p.organization_name 
    ELSE NULL 
  END AS organization_name,
  CASE 
    WHEN c.privacy_mode = 'original' THEN p.full_name 
    ELSE NULL 
  END AS full_name,
  p.business_sector
FROM public.challenges c
JOIN public.profiles p ON p.id = c.company_id
WHERE c.status = 'open' AND c.published_at IS NOT NULL;