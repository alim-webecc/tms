// js/header.js
import { logout, getRole } from "./auth.js";

function navLink(href, text, attrs = "") {
  return `<a role="menuitem" class="menu__item" href="${href}" ${attrs}>${text}</a>`;
}

export function renderHeader() {
  const role = (getRole() || "MITARBEITER").toUpperCase();
  const isAdmin = role === "ADMIN";

  let header = document.querySelector(".site-header");
  if (!header) {
    header = document.createElement("header");
    header.className = "site-header";
    document.body.prepend(header);
  }

  header.innerHTML = `
    <div class="site-header__inner">
      <a class="site-logo" href="./index.html" aria-label="Startseite">
        <img src="./img/logo.jpg" alt="webECC" />
      </a>

      <nav class="site-nav" aria-label="Hauptnavigation">
        <div class="menu menu--group">
          <button class="menu__parent" aria-haspopup="true" aria-expanded="false">Aufträge</button>
          <div class="menu__dropdown" role="menu">
            ${navLink("./offene-auftraege.html", "Offene Aufträge")}
            ${navLink("./in-bearbeitung.html", "Aufträge in Bearbeitung")}
            ${
              isAdmin
                ? navLink(
                    "./geschlossene-auftraege.html",
                    "Geschlossene Aufträge"
                  )
                : ""
            }
          </div>
        </div>

        <div class="menu menu--group" ${isAdmin ? "" : "hidden"}>
          <button class="menu__parent" aria-haspopup="true" aria-expanded="false">Verwalten</button>
          <div class="menu__dropdown" role="menu">
            ${navLink("./kunden-verwalten.html", "Kunden verwalten")}
            ${navLink("./benutzer-verwalten.html", "Benutzer verwalten")}
            ${navLink(
              "./beschaeftigungshistorie.html",
              "Mitarbeiter&nbsp;Beschäftigungshistorie"
            )}
          </div>
        </div>
      </nav>

      <div class="site-actions">
        <button id="btnLogout" class="btn btn--light">Abmelden</button>
      </div>
    </div>
  `;

  // Dropdown Verhalten
  header.querySelectorAll(".menu--group").forEach((group) => {
    const btn = group.querySelector(".menu__parent");
    const dd = group.querySelector(".menu__dropdown");
    if (!btn || !dd) return;
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      document
        .querySelectorAll(".menu__dropdown.is-open")
        .forEach((x) => x.classList.remove("is-open"));
      document
        .querySelectorAll(".menu__parent[aria-expanded='true']")
        .forEach((x) => x.setAttribute("aria-expanded", "false"));
      btn.setAttribute("aria-expanded", String(!open));
      dd.classList.toggle("is-open", !open);
    });
  });
  document.addEventListener("click", (e) => {
    if (!header.contains(e.target)) {
      document
        .querySelectorAll(".menu__dropdown.is-open")
        .forEach((x) => x.classList.remove("is-open"));
      document
        .querySelectorAll(".menu__parent[aria-expanded='true']")
        .forEach((x) => x.setAttribute("aria-expanded", "false"));
    }
  });

  header.querySelector("#btnLogout")?.addEventListener("click", logout);
}
