-- Datos comerciales de empresas + registro mejorado
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tax_id TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS business_sector TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_company_org;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_company_commercial CHECK (
  role <> 'company'
  OR (
    organization_name IS NOT NULL
    AND tax_id IS NOT NULL
    AND phone IS NOT NULL
    AND address IS NOT NULL
  )
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  assigned_role public.user_role;
  meta jsonb;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);

  assigned_role := COALESCE(
    (NEW.raw_app_meta_data->>'role')::public.user_role,
    CASE
      WHEN lower(NEW.email) = 'admin@unl.edu.ec' THEN 'admin'::public.user_role
      WHEN meta->>'registration_type' = 'company' THEN 'company'::public.user_role
      ELSE 'academic'::public.user_role
    END
  );

  INSERT INTO public.profiles (
    id,
    role,
    full_name,
    organization_name,
    tax_id,
    phone,
    address,
    website,
    business_sector,
    contact_email
  )
  VALUES (
    NEW.id,
    assigned_role,
    COALESCE(meta->>'full_name', NEW.email),
    meta->>'organization_name',
    meta->>'tax_id',
    meta->>'phone',
    meta->>'address',
    NULLIF(meta->>'website', ''),
    meta->>'business_sector',
    COALESCE(meta->>'contact_email', NEW.email)
  );

  RETURN NEW;
END;
$$;
