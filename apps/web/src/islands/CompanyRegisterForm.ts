import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CompanyRegisterSchema } from "@/lib/validation/schemas";
import { Sanitizer } from "@/lib/validation/sanitizer";
import { ZodError } from "zod";

export function initCompanyRegisterForm(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>("form");
  const errorEl = root.querySelector<HTMLElement>("[data-error]");
  const successEl = root.querySelector<HTMLElement>("[data-success]");
  const submitBtn = root.querySelector<HTMLButtonElement>("button[type=submit]");

  if (!form || !submitBtn) return;

  const get = (id: string) => {
    const input = root.querySelector<HTMLInputElement>(`#${id}`);
    return input?.value || "";
  };

  setupRealtimeInputFiltering(root);
  setupRealtimeValidation(root);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl?.classList.add("hidden");
    successEl?.classList.add("hidden");
    submitBtn.disabled = true;
    submitBtn.textContent = "Registrando…";

    try {
      // Limpiar error anterior
      const formErrorEl = root.querySelector("[data-form-error]");
      if (formErrorEl) {
        formErrorEl.classList.add("hidden");
        formErrorEl.textContent = "";
      }
      
      const sanitized = {
        organization_name: Sanitizer.text(get("organization_name")),
        tax_id: Sanitizer.numeric(get("tax_id")),
        business_sector: Sanitizer.text(get("business_sector")),
        address: Sanitizer.text(get("address")),
        phone: Sanitizer.phone(get("phone")),
        website: Sanitizer.url(get("website")),
        full_name: Sanitizer.text(get("full_name")),
        email: Sanitizer.email(get("email")),
        contact_email: Sanitizer.email(get("contact_email")),
        password: get("password"),
        password_confirm: get("password_confirm"),
      };

      const validated = CompanyRegisterSchema.parse(sanitized);

      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          data: {
            registration_type: "company",
            full_name: validated.full_name,
            organization_name: validated.organization_name,
            tax_id: validated.tax_id,
            phone: validated.phone,
            address: validated.address,
            website: validated.website || null,
            business_sector: validated.business_sector,
            contact_email: validated.contact_email || validated.email,
          },
        },
      });

      if (error) {
        showError(errorEl, translateAuthError(error.message));
        resetBtn(submitBtn);
        return;
      }

      if (data.session) {
        window.location.href = "/dashboard/empresa";
        return;
      }

      if (successEl) {
        successEl.textContent =
          "Empresa registrada. Revisa tu correo si se requiere confirmación, o inicia sesión.";
        successEl.classList.remove("hidden");
      }
      form.reset();
      clearAllValidationStates(root);
    } catch (err) {
      // mensaje de errores Zod
      const errorMessage = extractErrorMessage(err);
      showError(errorEl, errorMessage);
    } finally {
      resetBtn(submitBtn);
    }
  });
}

// mensajes de errores Zod 
function extractErrorMessage(err: unknown): string {
  if (err instanceof ZodError) {
    const errors = err.issues;
    if (errors.length > 0) {
      const firstError = errors[0];
      const message = firstError.message;
      return message;
    }
  }

  if (err instanceof Error) {
    return err.message;
  }

  return "Error de validación. Revisa los campos.";
}

//  Limita caracteres y tipos
function setupRealtimeInputFiltering(root: HTMLElement) {
  // Campo RAZÓN SOCIAL (máx 100, debe tener al menos una letra)
  const orgInput = root.querySelector<HTMLInputElement>("#organization_name");
  if (orgInput) {
    orgInput.addEventListener("input", () => {
      orgInput.value = orgInput.value
        .replace(/[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9\s.,\-()]/g, "")
        .slice(0, 100);
      if (!/[a-záéíóúñA-ZÁÉÍÓÚÑ]/.test(orgInput.value)) {
        orgInput.value = orgInput.value.replace(/[0-9]/g, "");
      }
    });
  }

  // Campo SECTOR (máx 50, debe tener al menos una letra)
  const sectorInput = root.querySelector<HTMLInputElement>("#business_sector");
  if (sectorInput) {
    sectorInput.addEventListener("input", () => {
      sectorInput.value = sectorInput.value
        .replace(/[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9\s.,\-()]/g, "")
        .slice(0, 50);
      if (!/[a-záéíóúñA-ZÁÉÍÓÚÑ]/.test(sectorInput.value)) {
        sectorInput.value = sectorInput.value.replace(/[0-9]/g, "");
      }
    });
  }

  // Campo DIRECCIÓN (máx 150, debe tener al menos una letra)
  const addressInput = root.querySelector<HTMLInputElement>("#address");
  if (addressInput) {
    addressInput.addEventListener("input", () => {
      addressInput.value = addressInput.value
        .replace(/[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9\s.,\-()]/g, "")
        .slice(0, 150);
      if (!/[a-záéíóúñA-ZÁÉÍÓÚÑ]/.test(addressInput.value)) {
        addressInput.value = addressInput.value.replace(/[0-9]/g, "");
      }
    });
  }

  // Campo NOMBRE REPRESENTANTE (máx 100, debe tener al menos una letra)
  const fullNameInput = root.querySelector<HTMLInputElement>("#full_name");
  if (fullNameInput) {
    fullNameInput.addEventListener("input", () => {
      fullNameInput.value = fullNameInput.value
        .replace(/[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9\s.,\-()]/g, "")
        .slice(0, 100);
      if (!/[a-záéíóúñA-ZÁÉÍÓÚÑ]/.test(fullNameInput.value)) {
        fullNameInput.value = fullNameInput.value.replace(/[0-9]/g, "");
      }
    });
  }

  // Campo RUC (exactamente 10-13 números, máx 13)
  const taxInput = root.querySelector<HTMLInputElement>("#tax_id");
  if (taxInput) {
    taxInput.addEventListener("input", () => {
      taxInput.value = taxInput.value
        .replace(/\D/g, "")
        .slice(0, 13);
    });
  }

  // Campo TELÉFONO (exactamente 10 dígitos)
  const phoneInput = root.querySelector<HTMLInputElement>("#phone");
  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      let value = phoneInput.value.replace(/[^\d+]/g, "");
      if (value.startsWith("+593")) {
        value = "0" + value.slice(4);
      }
      phoneInput.value = value.slice(0, 10);
    });
  }

  // Campo EMAIL (máx 254 caracteres)
  const emailInput = root.querySelector<HTMLInputElement>("#email");
  if (emailInput) {
    emailInput.addEventListener("input", () => {
      emailInput.value = emailInput.value
        .replace(/[^a-zA-Z0-9._@-]/g, "")
        .toLowerCase()
        .slice(0, 254);
    });
  }

  // Campo EMAIL CONTACTO (máx 254 caracteres)
  const contactEmailInput = root.querySelector<HTMLInputElement>("#contact_email");
  if (contactEmailInput) {
    contactEmailInput.addEventListener("input", () => {
      contactEmailInput.value = contactEmailInput.value
        .replace(/[^a-zA-Z0-9._@-]/g, "")
        .toLowerCase()
        .slice(0, 254);
    });
  }

  // Campo SITIO WEB (máx 255 caracteres)
  const websiteInput = root.querySelector<HTMLInputElement>("#website");
  if (websiteInput) {
    websiteInput.addEventListener("input", () => {
      websiteInput.value = websiteInput.value.slice(0, 255);
    });
  }

  // Campo CONTRASEÑA (máx 128 caracteres)
  const passwordInput = root.querySelector<HTMLInputElement>("#password");
  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      passwordInput.value = passwordInput.value.slice(0, 128);
      updatePasswordStrength(passwordInput);
    });
  }

  // Campo CONFIRMAR CONTRASEÑA (máx 128 caracteres)
  const passwordConfirmInput = root.querySelector<HTMLInputElement>("#password_confirm");
  if (passwordConfirmInput) {
    passwordConfirmInput.addEventListener("input", () => {
      passwordConfirmInput.value = passwordConfirmInput.value.slice(0, 128);
    });
  }

  // LIMPIAR ERROR GENERAL cuando el usuario empieza a escribir en cualquier campo
  const allInputs = root.querySelectorAll<HTMLInputElement>("input[type='text'], input[type='tel'], input[type='email'], input[type='url'], input[type='password']");
  allInputs.forEach((input) => {
    input.addEventListener("input", () => {
      const formErrorEl = root.querySelector("[data-form-error]");
      if (formErrorEl) {
        formErrorEl.classList.add("hidden");
        formErrorEl.textContent = "";
      }
    });
  });
}

// VALIDACION: Mostrar mensajes de error
function setupRealtimeValidation(root: HTMLElement) {
  const fields = [
    { id: "organization_name", type: "text", minLength: 3 },
    { id: "tax_id", type: "numeric" },
    { id: "business_sector", type: "text", minLength: 2 },
    { id: "address", type: "text", minLength: 5 },
    { id: "phone", type: "phone" },
    { id: "website", type: "url", optional: true },
    { id: "full_name", type: "text", minLength: 3 },
    { id: "email", type: "email" },
    { id: "contact_email", type: "email", optional: true },
    { id: "password", type: "password" },
    { id: "password_confirm", type: "password_confirm" },
  ];

  fields.forEach((field) => {
    const input = root.querySelector<HTMLInputElement>(`#${field.id}`);
    if (!input) return;

    input.addEventListener("input", () => {
      validateFieldRealtime(input, field);
    });

    input.addEventListener("blur", () => {
      validateFieldRealtime(input, field);
    });

    input.addEventListener("focus", () => {
      if (!input.value.trim()) {
        clearFieldValidation(input);
      }
    });
  });

  // Validar coincidencia de contraseñas
  const passwordInput = root.querySelector<HTMLInputElement>("#password");
  const passwordConfirmInput = root.querySelector<HTMLInputElement>("#password_confirm");

  if (passwordInput && passwordConfirmInput) {
    passwordConfirmInput.addEventListener("input", () => {
      if (passwordInput.value && passwordConfirmInput.value) {
        if (passwordInput.value === passwordConfirmInput.value) {
          setFieldValid(passwordConfirmInput);
        } else {
          setFieldInvalid(passwordConfirmInput, "Las contraseñas no coinciden");
        }
      }
    });
  }
}

// Indicador visual de fuerza de contraseña
function updatePasswordStrength(input: HTMLInputElement) {
  const value = input.value;
  let strength = 0;

  if (value.length >= 8) strength++;
  if (/[A-Z]/.test(value)) strength++;
  if (/[a-z]/.test(value)) strength++;
  if (/\d/.test(value)) strength++;
  if (/[!@#$%^&*]/.test(value)) strength++;

  input.classList.remove("border-red-500", "border-yellow-500", "border-green-500");
  if (strength < 2) {
    input.classList.add("border-red-500");
  } else if (strength < 4) {
    input.classList.add("border-yellow-500");
  } else {
    input.classList.add("border-green-500");
  }
}

function validateFieldRealtime(
  input: HTMLInputElement,
  field: {
    id: string;
    type: string;
    minLength?: number;
    optional?: boolean;
  }
) {
  const value = input.value.trim();
  const errorContainer = input.parentElement?.querySelector("[data-field-error]") as HTMLElement | null;

  if (field.optional && !value) {
    clearFieldValidation(input);
    return;
  }

  let isValid = false;
  let errorMessage = "";

  switch (field.type) {
    case "text":
      if (value.length === 0) {
        errorMessage = "Este campo es requerido";
      } else if (value.length < (field.minLength || 3)) {
        errorMessage = `Mínimo ${field.minLength || 3} caracteres`;
      } else if (!/^[\p{L}\p{N}\s.,\-()]+$/u.test(value)) {
        errorMessage = "Contiene caracteres no permitidos";
      } else {
        isValid = true;
      }
      break;

    case "numeric":
      if (value.length === 0) {
        errorMessage = "RUC es requerido";
      } else if (!/^\d{10,13}$/.test(value)) {
        errorMessage = "RUC debe ser 10-13 dígitos (ej: 1791234567001)";
      } else {
        isValid = true;
      }
      break;

    case "phone":
      if (value.length === 0) {
        errorMessage = "Teléfono es requerido";
      } else if (!/^0?9\d{8}$/.test(value)) {
        errorMessage = "Teléfono inválido (ej: 0991234567)";
      } else {
        isValid = true;
      }
      break;

    case "email":
      if (value.length === 0) {
        errorMessage = "Email es requerido";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errorMessage = "Email inválido";
      } else {
        isValid = true;
      }
      break;

    case "url":
      if (!value) {
        isValid = true;
      } else {
        try {
          new URL(value);
          isValid = true;
        } catch {
          errorMessage = "URL inválida";
        }
      }
      break;

    case "password":
      if (value.length === 0) {
        errorMessage = "Contraseña es requerida";
      } else if (value.length < 8) {
        errorMessage = "Mínimo 8 caracteres";
      } else if (!/[A-Z]/.test(value)) {
        errorMessage = "Debe contener una mayúscula (A-Z)";
      } else if (!/[a-z]/.test(value)) {
        errorMessage = "Debe contener una minúscula (a-z)";
      } else if (!/\d/.test(value)) {
        errorMessage = "Debe contener un número (0-9)";
      } else if (!/[!@#$%^&*]/.test(value)) {
        errorMessage = "Debe contener un símbolo (!@#$%^&*)";
      } else {
        isValid = true;
      }
      break;

    case "password_confirm":
      const passwordInput = input.closest("form")?.querySelector<HTMLInputElement>("#password");
      if (value.length === 0) {
        errorMessage = "Confirmar contraseña es requerida";
      } else if (passwordInput && value !== passwordInput.value) {
        errorMessage = "Las contraseñas no coinciden";
      } else {
        isValid = true;
      }
      break;
  }

  if (isValid) {
    setFieldValid(input);
    if (errorContainer) errorContainer.textContent = "";
  } else {
    setFieldInvalid(input, errorMessage);
    if (errorContainer) {
      errorContainer.textContent = errorMessage;
    }
  }
}

function setFieldValid(input: HTMLInputElement) {
  input.classList.remove("border-red-500", "bg-red-50");
  input.classList.add("border-green-500", "bg-green-50");

  const icon = input.parentElement?.querySelector("[data-valid-icon]");
  if (icon) icon.classList.remove("hidden");
}

function setFieldInvalid(input: HTMLInputElement, message: string) {
  input.classList.remove("border-green-500", "bg-green-50");
  input.classList.add("border-red-500", "bg-red-50");

  const icon = input.parentElement?.querySelector("[data-valid-icon]");
  if (icon) icon.classList.add("hidden");
}

function clearFieldValidation(input: HTMLInputElement) {
  input.classList.remove("border-green-500", "border-red-500", "bg-green-50", "bg-red-50");
  input.classList.add("border-slate-300");

  const icon = input.parentElement?.querySelector("[data-valid-icon]");
  if (icon) icon.classList.add("hidden");

  const errorContainer = input.parentElement?.querySelector("[data-field-error]");
  if (errorContainer) errorContainer.textContent = "";
}

function clearAllValidationStates(root: HTMLElement) {
  const inputs = root.querySelectorAll<HTMLInputElement>("input");
  inputs.forEach((input) => clearFieldValidation(input));
}

function showError(el: HTMLElement | null, message: string) {
  if (!el) return;
  
  // Mensaje de error cerca del botón (abajo)
  const root = el.closest("#company-register-root");
  if (root) {
    const formErrorEl = root.querySelector("[data-form-error]");
    if (formErrorEl) {
      formErrorEl.textContent = message;
      formErrorEl.classList.remove("hidden");
      // Scroll suave hacia el error
      formErrorEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
  }
  
  // Fallback: mostrar en el elemento original si no hay contenedor
  el.textContent = message;
  el.classList.remove("hidden");
}

function resetBtn(btn: HTMLButtonElement) {
  btn.disabled = false;
  btn.textContent = "Registrar empresa";
}

function translateAuthError(message: string): string {
  if (message.includes("already registered")) {
    return "Este correo ya está registrado. Intenta iniciar sesión.";
  }
  if (message.toLowerCase().includes("email not confirmed")) {
    return "Registro recibido. Confirma tu correo antes de iniciar sesión (revisa tu bandeja).";
  }
  if (message.includes("Password")) {
    return "La contraseña no cumple los requisitos de seguridad.";
  }
  return message;
}