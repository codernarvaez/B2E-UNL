-- RPC para completar registro empresarial tras OAuth (evita que queden como academic)
CREATE OR REPLACE FUNCTION public.register_company_profile(
  p_full_name text,
  p_organization_name text,
  p_tax_id text,
  p_phone text,
  p_address text,
  p_website text DEFAULT NULL,
  p_business_sector text DEFAULT NULL,
  p_contact_email text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para completar el registro';
  END IF;

  UPDATE public.profiles
  SET
    role = 'company',
    approval_status = 'pending',
    full_name = p_full_name,
    organization_name = p_organization_name,
    tax_id = p_tax_id,
    phone = p_phone,
    address = p_address,
    website = NULLIF(p_website, ''),
    business_sector = p_business_sector,
    contact_email = COALESCE(NULLIF(p_contact_email, ''), contact_email)
  WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.register_company_profile(text, text, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_company_profile(text, text, text, text, text, text, text, text) TO authenticated;
