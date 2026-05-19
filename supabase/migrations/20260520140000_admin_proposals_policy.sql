-- Admin puede leer todas las propuestas
CREATE POLICY proposals_select_admin ON public.proposals
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
