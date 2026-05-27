-- B2E MVP: initial schema (profiles, challenges, proposals, sustainability)
-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.user_role AS ENUM ('company', 'academic', 'admin');
CREATE TYPE public.challenge_status AS ENUM (
  'open', 'under_review', 'in_development', 'closed'
);
CREATE TYPE public.proposal_status AS ENUM (
  'draft', 'submitted', 'under_review', 'accepted', 'rejected'
);

-- Profiles (1:1 with auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  full_name TEXT NOT NULL,
  organization_name TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_company_org CHECK (
    role <> 'company' OR organization_name IS NOT NULL
  )
);

-- Sustainability catalog
CREATE TABLE public.sustainability_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_es TEXT NOT NULL,
  description_es TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Challenges
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.challenge_status NOT NULL DEFAULT 'open',
  environmental_impact JSONB NOT NULL DEFAULT '{}'::jsonb,
  privacy_mode TEXT NOT NULL DEFAULT 'pseudonymized',
  deadline DATE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT challenges_environmental_impact_shape CHECK (
    environmental_impact ? 'summary'
    AND environmental_impact ? 'expected_metric'
    AND environmental_impact ? 'metric_unit'
  )
);

CREATE TABLE public.challenge_categories (
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.sustainability_categories(id) ON DELETE RESTRICT,
  PRIMARY KEY (challenge_id, category_id)
);

-- Proposals
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  academic_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  approach TEXT NOT NULL,
  sustainability_alignment TEXT NOT NULL,
  status public.proposal_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, academic_id)
);

-- Indexes
CREATE INDEX idx_challenges_status ON public.challenges(status);
CREATE INDEX idx_challenges_company ON public.challenges(company_id);
CREATE INDEX idx_challenges_published ON public.challenges(published_at)
  WHERE status = 'open';
CREATE INDEX idx_proposals_challenge ON public.proposals(challenge_id);
CREATE INDEX idx_proposals_academic ON public.proposals(academic_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER challenges_updated_at BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER proposals_updated_at BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_app_meta_data->>'role')::public.user_role, 'academic'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Require >= 1 sustainability category per challenge
CREATE OR REPLACE FUNCTION public.enforce_challenge_has_category()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.challenge_categories WHERE challenge_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'El reto debe tener al menos una categoría de sustentabilidad';
  END IF;
  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER challenges_require_category
  AFTER INSERT ON public.challenges
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.enforce_challenge_has_category();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sustainability_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Categories
CREATE POLICY sustainability_categories_read ON public.sustainability_categories
  FOR SELECT TO authenticated, anon USING (true);

-- Challenges
CREATE POLICY challenges_select_public_open ON public.challenges
  FOR SELECT TO anon, authenticated
  USING (status = 'open' AND published_at IS NOT NULL);
CREATE POLICY challenges_select_company ON public.challenges
  FOR SELECT TO authenticated
  USING (company_id = auth.uid());
CREATE POLICY challenges_insert_company ON public.challenges
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'company')
  );
CREATE POLICY challenges_update_company ON public.challenges
  FOR UPDATE TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());
CREATE POLICY challenges_admin_all ON public.challenges
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- challenge_categories
CREATE POLICY challenge_categories_select ON public.challenge_categories
  FOR SELECT TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id
        AND (c.status = 'open' OR c.company_id = auth.uid())
    )
  );
CREATE POLICY challenge_categories_modify_company ON public.challenge_categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id AND c.company_id = auth.uid()
    )
  );

-- Proposals
CREATE POLICY proposals_select_academic ON public.proposals
  FOR SELECT TO authenticated USING (academic_id = auth.uid());
CREATE POLICY proposals_select_company ON public.proposals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id AND c.company_id = auth.uid()
    )
  );
CREATE POLICY proposals_insert_academic ON public.proposals
  FOR INSERT TO authenticated
  WITH CHECK (
    academic_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'academic')
  );
CREATE POLICY proposals_update_academic ON public.proposals
  FOR UPDATE TO authenticated
  USING (academic_id = auth.uid())
  WITH CHECK (academic_id = auth.uid());

-- Seed categories (Green Tech MVP)
INSERT INTO public.sustainability_categories (slug, name_es, description_es) VALUES
  ('green_tech', 'Green Tech', 'Tecnologías limpias y soluciones de bajo impacto'),
  ('energy_efficiency', 'Eficiencia Energética', 'Optimización de consumo y fuentes renovables'),
  ('traceability', 'Trazabilidad', 'Cadena de suministro transparente y medible'),
  ('circular_economy', 'Economía Circular', 'Reuso, reciclaje y valorización de residuos'),
  ('water_management', 'Gestión del Agua', 'Conservación y tratamiento sustentable'),
  ('carbon_footprint', 'Huella de Carbono', 'Medición y reducción de emisiones');
