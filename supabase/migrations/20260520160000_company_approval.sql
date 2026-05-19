-- Estado de aprobación para cuentas (empresas requieren visto bueno del admin)
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approval_status public.approval_status NOT NULL DEFAULT 'approved';

-- Empresas existentes: aprobar; nuevas empresas quedarán pending vía trigger
UPDATE public.profiles SET approval_status = 'approved' WHERE role IN ('admin', 'academic');
UPDATE public.profiles SET approval_status = 'pending' WHERE role = 'company';

-- Trigger: empresas nuevas en pending; admin/academic aprobados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  assigned_role public.user_role;
  assigned_approval public.approval_status;
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

  assigned_approval := CASE
    WHEN assigned_role = 'company' THEN 'pending'::public.approval_status
    ELSE 'approved'::public.approval_status
  END;

  INSERT INTO public.profiles (
    id, role, full_name, organization_name, tax_id, phone, address,
    website, business_sector, contact_email, approval_status
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
    COALESCE(meta->>'contact_email', NEW.email),
    assigned_approval
  );

  RETURN NEW;
END;
$$;

-- Solo empresas aprobadas pueden crear retos
DROP POLICY IF EXISTS challenges_insert_company ON public.challenges;
CREATE POLICY challenges_insert_company ON public.challenges
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'company'
        AND approval_status = 'approved'
    )
  );

-- Admin: actualizar perfiles (aprobación) y retos
CREATE POLICY profiles_admin_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
