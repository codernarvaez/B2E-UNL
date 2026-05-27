ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS privacy_mode TEXT NOT NULL DEFAULT 'pseudonymized';
SELECT column_name
FROM information_schema.columns
WHERE table_schema='public' AND table_name='challenges' AND column_name='privacy_mode';