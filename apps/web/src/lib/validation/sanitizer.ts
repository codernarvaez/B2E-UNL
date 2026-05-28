import DOMPurify from "dompurify";

/**
 * Sanitiza entrada de texto para prevenir XSS
 * Elimina scripts, eventos y HTML peligroso
 */
export function sanitizeText(input: string): string {
  if (!input) return "";
  
  // Primero, remover espacios en blanco extra
  let clean = input.trim().replace(/\s+/g, " ");
  
  // Usar DOMPurify para limpiar cualquier HTML peligroso
  clean = DOMPurify.sanitize(clean, { 
    ALLOWED_TAGS: [], // No permitir tags HTML
    ALLOWED_ATTR: [] 
  });
  
  return clean;
}

/**
 * Sanitiza emails
 */
export function sanitizeEmail(input: string): string {
  const clean = input.toLowerCase().trim();
  return DOMPurify.sanitize(clean, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  });
}

/**
 * Sanitiza números (RUC, teléfono)
 */
export function sanitizeNumeric(input: string): string {
  return input.replace(/\D/g, ""); // Mantener solo dígitos
}

/**
 * Sanitiza URLs
 */
export function sanitizeUrl(input: string): string {
  if (!input) return "";
  
  try {
    const url = new URL(input);
    // Solo permitir http y https
    if (!["http:", "https:"].includes(url.protocol)) {
      return "";
    }
    return url.toString();
  } catch {
    return ""; // URL inválida
  }
}

/**
 * Sanitiza teléfono (Ecuador)
 */
export function sanitizePhone(input: string): string {
  const clean = input.replace(/\D/g, ""); // Solo dígitos
  
  // Si comienza con 593 (código país), convertir a 0
  if (clean.startsWith("593")) {
    return "0" + clean.slice(3);
  }
  
  return clean;
}

/**
 * Objeto con todas las funciones de sanitización
 */
export const Sanitizer = {
  text: sanitizeText,
  email: sanitizeEmail,
  numeric: sanitizeNumeric,
  url: sanitizeUrl,
  phone: sanitizePhone,
};