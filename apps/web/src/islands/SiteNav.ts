export function initSiteNav() {
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-mobile-menu");
  const backdrop = document.getElementById("nav-backdrop");

  if (!toggle || !menu) return;

  const open = () => {
    menu.classList.remove("hidden");
    menu.classList.add("nav-menu-open");
    backdrop?.classList.remove("hidden");
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("overflow-hidden");
  };

  const close = () => {
    menu.classList.add("hidden");
    menu.classList.remove("nav-menu-open");
    backdrop?.classList.add("hidden");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("overflow-hidden");
  };

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    if (expanded) close();
    else open();
  });

  backdrop?.addEventListener("click", close);

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", close);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // Resaltar enlace activo
  const path = window.location.pathname;
  document.querySelectorAll<HTMLAnchorElement>("[data-nav-link]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    const active =
      href === path || (href !== "/" && path.startsWith(href));
    if (active) {
      link.setAttribute("aria-current", "page");
      link.classList.add("nav-link-active");
    }
  });
}
