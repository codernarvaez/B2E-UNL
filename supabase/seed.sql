-- Local seed: idempotent sustainability categories (migration also inserts these)
INSERT INTO public.sustainability_categories (slug, name_es, description_es) VALUES
  ('green_tech', 'Green Tech', 'Tecnologías limpias y soluciones de bajo impacto'),
  ('energy_efficiency', 'Eficiencia Energética', 'Optimización de consumo y fuentes renovables'),
  ('traceability', 'Trazabilidad', 'Cadena de suministro transparente y medible'),
  ('circular_economy', 'Economía Circular', 'Reuso, reciclaje y valorización de residuos'),
  ('water_management', 'Gestión del Agua', 'Conservación y tratamiento sustentable'),
  ('carbon_footprint', 'Huella de Carbono', 'Medición y reducción de emisiones')
ON CONFLICT (slug) DO NOTHING;
