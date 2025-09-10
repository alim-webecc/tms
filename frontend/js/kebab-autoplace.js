/**
 * Platziert Dropdown-Menüs automatisch nach links, wenn rechts nicht genug Platz ist.
 * Erwartung: Trigger-Button hat [data-kebab] oder [aria-haspopup="menu"].
 * Menü ist direktes Geschwisterelement mit Klasse .kebab-menu.
 */
(function () {
  function place(menu) {
    menu.classList.remove("to-left");
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) menu.classList.add("to-left");
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-kebab],[aria-haspopup="menu"]');
    if (!btn) return;
    const menu = btn.nextElementSibling;
    if (!menu || !menu.classList.contains("kebab-menu")) return;
    menu.classList.toggle("open");
    requestAnimationFrame(() => place(menu));
  });
  // Klick außerhalb -> schließen
  document.addEventListener("click", (e) => {
    if (e.target.closest('[data-kebab],[aria-haspopup="menu"],.kebab-menu'))
      return;
    document
      .querySelectorAll(".kebab-menu.open")
      .forEach((m) => m.classList.remove("open"));
  });
  window.addEventListener("resize", () => {
    document.querySelectorAll(".kebab-menu.open").forEach((m) => {
      m.classList.remove("to-left");
      place(m);
    });
  });
})();
