/**
 * Platziert Dropdown-Menüs automatisch nach links, wenn rechts nicht genug Platz ist.
 * Markup-Annahme: [data-kebab] (Button) -> direkt folgendes Element = Menü (absolute/fixed).
 * Fällt zurück auf [aria-haspopup="menu"] falls data-kebab fehlt.
 */
(function () {
  function place(menu, toggle) {
    // Default: rechts neben dem Toggle öffnen
    menu.classList.remove("to-left");
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.classList.add("to-left");
    }
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-kebab],[aria-haspopup="menu"]');
    if (!btn) return;
    const menu = btn.nextElementSibling;
    if (!menu) return;
    // Toggle Sichtbarkeit
    menu.classList.toggle("open");
    // Position nachträglich überprüfen
    requestAnimationFrame(() => place(menu, btn));
  });
  // Klick außerhalb schließt
  document.addEventListener("click", (e) => {
    if (e.target.closest('[data-kebab],[aria-haspopup="menu"],.kebab-menu'))
      return;
    document
      .querySelectorAll(".kebab-menu.open")
      .forEach((m) => m.classList.remove("open"));
  });
})();
