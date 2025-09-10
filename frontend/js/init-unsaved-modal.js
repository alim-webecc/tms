function ensureLink(href) {
  if ([...document.styleSheets].some((s) => s.href && s.href.includes(href)))
    return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  document.head.appendChild(l);
}

async function injectModal() {
  const url = "./components/unsaved-changes-modal.html";
  try {
    const res = await fetch(url);
    const html = await res.text();
    document.body.insertAdjacentHTML("beforeend", html);
  } catch {
    // Fallback (z. B. file://)
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="ucm-modal" id="unsaved-modal" role="dialog" aria-modal="true"
           aria-labelledby="unsaved-title" aria-describedby="unsaved-desc" hidden data-modal>
        <div class="ucm-modal__overlay" aria-hidden="true"></div>
        <div class="ucm-modal__dialog" role="document">
          <header class="ucm-modal__header">
            <h2 id="unsaved-title" class="ucm-modal__title">Ungespeicherte Änderungen</h2>
            <button type="button" class="btn btn--icon" aria-label="Abbrechen" data-modal-cancel>
              <span class="mi" aria-hidden="true">close</span>
            </button>
          </header>
          <div class="ucm-modal__body" id="unsaved-desc">
            <div class="ucm-modal__message">
              <p>Einige Änderungen wurden noch nicht gespeichert.</p>
              <p>Wenn Sie OK betätigen, gehen diese Änderungen verloren!</p>
            </div>
          </div>
          <footer class="ucm-modal__footer">
            <button type="button" class="btn btn--ghost" data-modal-cancel>Abbrechen</button>
            <button type="button" class="btn btn--primary" data-modal-ok autofocus>OK</button>
          </footer>
        </div>
      </div>`;
    document.body.appendChild(wrapper.firstElementChild);
  }
}

(async function init() {
  // Styles einhängen
  ensureLink("./style/icons.css");
  ensureLink("./style/unsaved-changes-modal.css");

  // Markup injizieren
  await injectModal();

  // Guard initialisieren
  const { createUnsavedGuard } = await import("./unsaved-changes-guard.js");
  const guard = createUnsavedGuard();

  // 1) Wenn ein <form> existiert -> tracken
  const form = document.querySelector("form");
  if (form) guard.trackForm(form);
  // 2) Zusätzlich ALLE Inputs auf der Seite tracken (auch ohne <form>)
  guard.trackAnyInputs(document);

  // 3) Navigation abfangen
  guard.interceptLinks(document);

  // Debug-Hook
  window.__unsavedGuard = guard;
})();
