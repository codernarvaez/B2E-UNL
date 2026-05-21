export const challengeStatusLabels: Record<string, string> = {
  open: "Abierto",
  under_review: "En evaluación",
  in_development: "En desarrollo",
  closed: "Cerrado",
};

export const challengeStatusHelp: Record<string, string> = {
  open: "Visible en el tablero si está publicado; puedes recibir propuestas académicas.",
  under_review: "Propuestas en revisión; prioriza evaluación con la UNL.",
  in_development: "Solución seleccionada o en ejecución con academia.",
  closed: "Reto finalizado; sin nuevas postulaciones.",
};

export function publicationLabel(publishedAt: string | null): string {
  return publishedAt ? "Publicado" : "Borrador";
}
