// js/order-details.js
import { apiFetch, getRole } from "./auth.js";
import { showToast } from "./ui.js";

const id = new URLSearchParams(location.search).get("id");
const isAdmin = (getRole() || "").toUpperCase() === "ADMIN";
const OFFENE_PAGE = "offene-auftraege.html";

const form = document.getElementById("detailForm");
const saveBtn =
  document.getElementById("saveBtn") || form?.querySelector('[type="submit"]');
const cancelBtn = document.getElementById("cancelBtn");
const deleteBtn = document.getElementById("deleteBtn");
if (deleteBtn && isAdmin) deleteBtn.style.display = "inline-block";

let baselineJson = null; // Snapshot des zuletzt gespeicherten Zustands
let allowNav = false; // steuert, ob beforeunload ausgelassen wird

/* ---------------- Helpers ---------------- */
const $v = (id) => (document.getElementById(id)?.value ?? "").trim();
const $n = (id) => {
  const v = document.getElementById(id)?.value;
  return v ? Number(v) : null;
};
const $d = (id) => {
  const v = document.getElementById(id)?.value;
  return v || null;
};
function setVal(id, v) {
  const el = document.getElementById(id);
  if (el) el.value = v ?? "";
}

function collectFormValues() {
  return {
    status: $v("status"),
    auftragsgeber: $v("auftragsgeber"),
    ladedatum: $d("ladedatum"),
    vonPlz: $v("vonPlz"),
    entladedatum: $d("entladedatum"),
    nachPlz: $v("nachPlz"),
    preisKunde: $n("preisKunde"),
    preisFf: $n("preisFf"),
    frachtfuehrer: $v("frachtfuehrer"),
    ldm: $n("ldm"),
    gewicht: $n("gewicht"),
    bemerkung: $v("bemerkung"),
    details: $v("details"),
  };
}
const snapshot = () => JSON.stringify(collectFormValues());
const isDirty = () => snapshot() !== (baselineJson || "");
function setBaselineFromCurrent() {
  baselineJson = snapshot();
  updateSaveEnabled();
}
function updateSaveEnabled() {
  if (saveBtn) saveBtn.disabled = !isDirty();
}

function navigate(url) {
  allowNav = true;
  location.href = url;
}

/* -------- Popup: zentriert, ohne globales CSS -------- */
function confirmDiscard(onOk) {
  if (document.getElementById("unsavedConfirm")) return;

  const overlay = document.createElement("div");
  overlay.id = "unsavedConfirm";
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "zIndex:1000".replace("zIndex", "z-index"),
    "background:rgba(0,0,0,.35)",
    "display:flex",
    "align-items:center",
    "justify-content:center",
  ].join(";");

  overlay.innerHTML = `
    <div role="dialog" aria-modal="true" aria-labelledby="unsvTitle"
         style="width:560px;max-width:calc(100vw - 24px);background:#fff;border-radius:8px;
                box-shadow:0 16px 48px rgba(0,0,0,.25);border:1px solid #E0E0E0;overflow:hidden;">
      <div style="padding:16px 18px;border-bottom:1px solid #E5E7EB;background:#fff;">
        <h2 id="unsvTitle" style="margin:0;font-size:20px;color:#163E72;">Ungespeicherte Änderungen</h2>
      </div>
      <div style="padding:16px 18px;">
        <div style="background:#EEF2F7;border:1px solid #E5E7EB;border-radius:4px;padding:12px 14px;line-height:1.45;color:#111827;">
          <div>Einige Änderungen wurden noch nicht gespeichert.</div>
          <div>Wenn Sie <strong>OK</strong> betätigen, gehen diese Änderungen verloren!</div>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;padding:12px 18px 18px 18px;background:#fff;">
        <button class="btn btn--light" id="unsvCancel">Abbrechen</button>
        <button class="btn" id="unsvOk">OK</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.getElementById("unsvCancel").addEventListener("click", close);
  document.getElementById("unsvOk").addEventListener("click", () => {
    close();
    onOk && onOk();
  });
  document.addEventListener("keydown", function onEsc(e) {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", onEsc);
    }
  });
}

/* ---------------- Laden ---------------- */
async function load() {
  const res = await apiFetch(`/api/orders/${id}`);
  if (!res.ok) {
    showToast
      ? showToast("Auftrag nicht gefunden", "error")
      : alert("Auftrag nicht gefunden");
    return;
  }
  const o = await res.json();
  setVal("orderId", o.orderId);
  setVal("status", o.status);
  setVal("auftragsgeber", o.auftragsgeber);
  setVal("ladedatum", o.ladedatum);
  setVal("vonPlz", o.vonPlz);
  setVal("entladedatum", o.entladedatum);
  setVal("nachPlz", o.nachPlz);
  setVal("preisKunde", o.preisKunde);
  setVal("preisFf", o.preisFf);
  setVal("frachtfuehrer", o.frachtfuehrer);
  setVal("ldm", o.ldm);
  setVal("gewicht", o.gewicht);
  setVal("bemerkung", o.bemerkung);
  setVal("details", o.details);

  setBaselineFromCurrent();

  // Änderungen tracken
  form?.querySelectorAll("input,select,textarea").forEach((el) => {
    el.addEventListener("input", updateSaveEnabled);
    el.addEventListener("change", updateSaveEnabled);
  });
}
await load();

/* ---------------- Speichern ---------------- */
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = collectFormValues();
  const res = await apiFetch(`/api/orders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    showToast
      ? showToast("Speichern fehlgeschlagen", "error")
      : alert("Speichern fehlgeschlagen");
    return;
  }
  setBaselineFromCurrent();
  showToast && showToast("Auftrag gespeichert", "success");
  setTimeout(() => navigate(OFFENE_PAGE), 500);
});

/* ---------------- Abbrechen ---------------- */
cancelBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  if (isDirty()) confirmDiscard(() => navigate(OFFENE_PAGE));
  else navigate(OFFENE_PAGE);
});

/* ---------------- Löschen (nur Admin) ---------------- */
deleteBtn?.addEventListener("click", async () => {
  if (!confirm("Diesen Auftrag wirklich löschen?")) return;
  const res = await apiFetch(`/api/orders/${id}`, { method: "DELETE" });
  if (res.status === 204) {
    showToast && showToast("Auftrag gelöscht", "success");
    allowNav = true;
    location.replace(OFFENE_PAGE);
  } else {
    showToast
      ? showToast("Löschen fehlgeschlagen", "error")
      : alert("Löschen fehlgeschlagen");
  }
});

/* -------- Optional: native beforeunload NUR wenn nicht über Buttons verlassen -------- */
window.addEventListener("beforeunload", (e) => {
  if (isDirty() && !allowNav) {
    e.preventDefault();
    e.returnValue = "";
  }
  // Wenn du NIE den nativen Dialog willst, kommentiere die beiden Zeilen oben einfach aus.
});
