/** Proyectos galardonados — datos de ejemplo; luego se alimentará desde CMS/BD */
export interface AwardedProject {
  id: string;
  company: string;
  title: string;
  award: string;
  year: number;
  category: string;
  impactSummary: string;
  partnerUniversity?: string;
}

export const awardedProjects: AwardedProject[] = [
  {
    id: "1",
    company: "AgroLoja Export",
    title: "Trazabilidad blockchain para cadena fría orgánica",
    award: "Premio Innovación Sustentable CADECOL",
    year: 2025,
    category: "Green Tech",
    impactSummary:
      "Reducción estimada del 18% en mermas post-cosecha y certificación digital para mercados europeos.",
    partnerUniversity: "Carrera de Ingeniería en Sistemas / Computación — UNL",
  },
  {
    id: "2",
    company: "Industrias del Sur Cía. Ltda.",
    title: "Optimización energética en línea de envasado",
    award: "Reconocimiento Eficiencia Industrial Loja",
    year: 2024,
    category: "Energía",
    impactSummary:
      "Ahorro del 22% en consumo eléctrico anual mediante sensores IoT y modelo predictivo desarrollado con estudiantes UNL.",
    partnerUniversity: "Centro de Investigación en Tecnologías — CIT",
  },
  {
    id: "3",
    company: "EcoTextiles Andinos",
    title: "Tintes naturales a escala piloto con cero vertidos",
    award: "Mención Honorífica — Reto B2E Sustentabilidad",
    year: 2024,
    category: "Economía circular",
    impactSummary:
      "Prototipo validado en planta piloto; eliminación de 2 toneladas/año de efluentes químicos en fase de prueba.",
    partnerUniversity: "Universidad Nacional de Loja",
  },
];
