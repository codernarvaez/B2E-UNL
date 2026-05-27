import { z } from "zod";

// Patrones de validación para Ecuador
const ECUADORIAN_RUC = /^\d{10,13}$/; // RUC: 10-13 dígitos
const ECUADORIAN_PHONE = /^(\+593|0)9\d{8}$/; // Celular Ecuador
const SAFE_TEXT = /^[\p{L}\p{N}\s.,\-()]+$/u;// Solo letras, números, espacios y algunos símbolos

export const CompanyRegisterSchema = z.object({
  // Datos de empresa
  organization_name: z
    .string()
    .min(3, "Nombre debe tener al menos 3 caracteres")
    .max(100, "Nombre muy largo (máx. 100 caracteres)")
    .regex(SAFE_TEXT, "Nombre contiene caracteres no permitidos"),

  tax_id: z
    .string()
    .regex(ECUADORIAN_RUC, "RUC debe ser 10-13 dígitos (ej: 1791234567001)"),

  business_sector: z
    .string()
    .min(2, "Sector debe tener al menos 2 caracteres")
    .max(50, "Sector muy largo")
    .regex(SAFE_TEXT, "Sector contiene caracteres no permitidos"),

  address: z
    .string()
    .min(5, "Dirección debe tener al menos 5 caracteres")
    .max(150, "Dirección muy larga"),

  phone: z
    .string()
    .regex(ECUADORIAN_PHONE, "Teléfono inválido (ej: 0991234567)"),

  website: z
    .string()
    .url("URL inválida")
    .optional()
    .or(z.literal("")),

  // Representante
  full_name: z
    .string()
    .min(3, "Nombre debe tener al menos 3 caracteres")
    .max(100, "Nombre muy largo")
    .regex(SAFE_TEXT, "Nombre contiene caracteres no permitidos"),

  email: z
    .string()
    .email("Correo electrónico inválido"),

  contact_email: z
    .string()
    .email("Correo de contacto inválido")
    .optional()
    .or(z.literal("")),

  // Acceso
  password: z
    .string()
    .min(8, "Contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
    .regex(/[a-z]/, "La contraseña debe contener al menos una minúscula")
    .regex(/\d/, "La contraseña debe contener al menos un número")
    .regex(/[!@#$%^&*]/, "La contraseña debe contener al menos un símbolo especial (!@#$%^&*)"),

  password_confirm: z.string(),
}).refine((data) => data.password === data.password_confirm, {
  message: "Las contraseñas no coinciden",
  path: ["password_confirm"],
});

export const ChallengeSchema = z.object({
  title: z
    .string()
    .min(5, "El título debe tener al menos 5 caracteres")
    .max(200, "Título muy largo (máx. 200 caracteres)")
    .regex(SAFE_TEXT, "El título contiene caracteres no permitidos"),
  description: z
    .string()
    .min(20, "La descripción debe tener al menos 20 caracteres")
    .max(5000, "Descripción muy larga (máx. 5000 caracteres)"),
  category_ids: z
    .array(z.string().uuid())
    .min(1, "Selecciona al menos una categoría"),
  deadline: z
    .string()
    .nullable()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return date >= now;
    }, "La fecha límite debe ser hoy o una fecha futura"),
  environmental_impact: z.object({
    summary: z
      .string()
      .min(10, "El resumen debe tener al menos 10 caracteres")
      .max(1000, "Resumen muy largo (máx. 1000 caracteres)"),
    expected_metric: z
      .string()
      .min(1, "Indica la métrica objetivo")
      .max(100, "Métrica muy larga (máx. 100 caracteres)"),
    metric_unit: z
      .string()
      .min(1, "Indica la unidad")
      .max(50, "Unidad muy larga (máx. 50 caracteres)"),
    baseline_situation: z.string().max(3000).nullable(),
    success_criteria: z.string().max(3000).nullable(),
    technical_scope: z.string().max(3000).nullable(),
  }),
});

export type CompanyRegisterInput = z.infer<typeof CompanyRegisterSchema>;
export type ChallengeInput = z.infer<typeof ChallengeSchema>;