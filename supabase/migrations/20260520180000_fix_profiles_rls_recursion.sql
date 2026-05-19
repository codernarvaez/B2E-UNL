-- Evita recursión infinita en RLS de profiles: funciones SECURITY DEFINER
-- (las políticas no deben hacer SELECT en profiles dentro de políticas sobre profiles)

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::public.user_role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(check_role public.user_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = check_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_company_approved()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'company'::public.user_role
      AND approval_status = 'approved'::public.approval_status
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(public.user_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_company_approved() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(public.user_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_company_approved() TO authenticated, anon;

-- profiles
DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
CREATE POLICY profiles_admin_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- challenges
DROP POLICY IF EXISTS challenges_insert_company ON public.challenges;
CREATE POLICY challenges_insert_company ON public.challenges
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = auth.uid()
    AND public.is_company_approved()
  );

DROP POLICY IF EXISTS challenges_admin_all ON public.challenges;
CREATE POLICY challenges_admin_all ON public.challenges
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- proposals
DROP POLICY IF EXISTS proposals_select_admin ON public.proposals;
CREATE POLICY proposals_select_admin ON public.proposals
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS proposals_insert_academic ON public.proposals;
CREATE POLICY proposals_insert_academic ON public.proposals
  FOR INSERT TO authenticated
  WITH CHECK (
    academic_id = auth.uid()
    AND public.has_role('academic'::public.user_role)
  );
