export interface Project {
  id: string;
  area: string;       // Ej: Finanzas, Data Science, Backend
  estate: string;     // Ej: Nuevo, En curso, Resuelto
  title: string;
  datePublish: string; // Fecha de publicación
  description: string;
}

export const projects: Project[] = [
  {
    id: "1",
    area: "Finanzas",
    estate: "Nuevo",
    title: "Sistema de Automatización de Conciliación Bancaria",
    datePublish: "17/5/2026",
    description: "Desarrollar una solución que automatice el proceso de conciliación entre registros contables internos y extractos bancarios. Debe incluir reconciliación automática de transacciones,..."
  },
  {
    id: "2",
    area: "Data Science",
    estate: "En curso",
    title: "Plataforma de Análisis Predictivo de Inventario",
    datePublish: "9/5/2026",
    description: "Sistema de machine learning para predecir demanda de productos basándose en datos históricos de ventas, estacionalidad y tendencias del mercado. Incluir dashboard interactivo con..."
  },
  {
    id: "3",
    area: "Backend",
    estate: "Nuevo",
    title: "API REST para Gestión de Recursos Humanos",
    datePublish: "14/5/2026",
    description: "Diseñar e implementar una API RESTful para gestionar empleados, nóminas, vacaciones y evaluaciones de desempeño. Debe incluir autenticación JWT, documentación..."
  },
  {
    id: "4",
    area: "Mobile",
    estate: "Resuelto",
    title: "App Móvil de Tracking de Entregas en Tiempo Real",
    datePublish: "19/4/2026",
    description: "Aplicación móvil cross-platform (React Native/Flutter) que permita rastrear entregas en tiempo real usando geolocalización. Incluir notificaciones push, mapas interactivos y..."
  },
  {
    id: "5",
    area: "Frontend",
    estate: "En curso",
    title: "Dashboard de Métricas de Marketing Digital",
    datePublish: "4/5/2026",
    description: "Interfaz web para consolidar métricas de múltiples plataformas (Google Analytics, Facebook Ads, LinkedIn). Visualización de KPIs, ROI, conversiones y comparativas temporales..."
  },
  {
    id: "6",
    area: "Seguridad",
    estate: "Nuevo",
    title: "Sistema de Autenticación Biométrica para Acceso Seguro",
    datePublish: "16/5/2026",
    description: "Implementar sistema de autenticación multifactor que incluya reconocimiento facial o huella digital. Debe integrarse con sistemas existentes vía OAuth 2.0 y cumplir con..."
  }
];
