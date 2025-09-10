// js/orders-list.js  (Build: 2025-09-09-2)
import { apiFetch, requireAuth, startInactivityLogout } from "./auth.js";
import { showToast } from "./ui.js";

/* ---------- Konfiguration ---------- */
const PAGE_SIZE = 20;

const state = {
  allRows: [],
  filtered: [],
  page: 1,
  sortKey: "", // wird in applyFilters je nach Seite gesetzt
  sortDir: "desc",
  status: null, // OPEN | IN_PROGRESS | CLOSED | null
};

/* ---------- Spalten ---------- */
const columns = [
  { key: "orderId", label: "Auftrags-ID", type: "number", sortable: true },
  {
    key: "auftragsgeber",
    label: "Auftragsgeber",
    type: "string",
    sortable: true,
  },
  { key: "ladedatum", label: "Ladedatum", type: "date", sortable: true },
  { key: "vonPlz", label: "von (PLZ)", type: "string", sortable: true },
  { key: "entladedatum", label: "Entladedatum", type: "date", sortable: true },
  { key: "nachPlz", label: "nach (PLZ)", type: "string", sortable: true },
  {
    key: "preisKunde",
    label: "Preis Kunde",
    type: "number",
    sortable: true,
    format: (v) => fmtCurrency(v),
  },
  {
    key: "preisFf",
    label: "Preis FF",
    type: "number",
    sortable: true,
    format: (v) => fmtCurrency(v),
  },
  {
    key: "frachtfuehrer",
    label: "Frachtführer",
    type: "string",
    sortable: true,
  },
  { key: "ldm", label: "LDM", type: "number", sortable: true },
  { key: "gewicht", label: "Gewicht (kg)", type: "number", sortable: true },
  { key: "bemerkung", label: "Bemerkung", type: "string", sortable: false },

  // versteckte Spalten für Default-Sortierung/Filter
  {
    key: "status",
    label: "Status",
    type: "string",
    sortable: false,
    hidden: true,
  },
  {
    key: "createdAt",
    label: "Angelegt",
    type: "date",
    sortable: true,
    hidden: true,
  },
  {
    key: "updatedAt",
    label: "Geändert",
    type: "date",
    sortable: true,
    hidden: true,
  },
  {
    key: "closedAt",
    label: "Geschlossen",
    type: "date",
    sortable: true,
    hidden: true,
  },
];

/* ---------- Helpers ---------- */
const visibleColumns = () => columns.filter((c) => !c.hidden);
const $ = (sel, root = document) => root.querySelector(sel);
const $all = (sel, root = document) => [...root.querySelectorAll(sel)];
const h = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        m
      ])
  );

const fmtCurrency = (v) =>
  v == null
    ? ""
    : new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(v);

function parseDateSmart(s) {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?/.test(s))
    return new Date(s);
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) {
    const [dd, mm, yy] = s.split(".").map(Number);
    return new Date(yy, mm - 1, dd);
  }
  const d = new Date(s);
  return isNaN(+d) ? null : d;
}
const makeGlob = (pattern) =>
  new RegExp(
    "^" +
      pattern
        .split("*")
        .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*") +
      "$",
    "i"
  );

function ensureTableParts() {
  const table = $("#ordersTable");
  if (!table) return null;
  let thead = table.querySelector("thead");
  let tbody = table.querySelector("tbody");
  if (!thead) {
    thead = document.createElement("thead");
    table.prepend(thead);
  }
  if (!tbody) {
    tbody = document.createElement("tbody");
    table.appendChild(tbody);
  }
  return { table, thead, tbody };
}

/* ---------- Status-Lokalisierung ---------- */
const STATUS_LABELS_DE = {
  OPEN: "Offen",
  IN_PROGRESS: "In Bearbeitung",
  WIP: "In Bearbeitung",
  IN_BEARBEITUNG: "In Bearbeitung",
  CLOSED: "Geschlossen",
  DONE: "Geschlossen",
};
function statusLabelDE(s) {
  const key = String(s ?? "")
    .trim()
    .toUpperCase();
  return STATUS_LABELS_DE[key] || key;
}

/* ---------- Auftrags-ID Validierung ---------- */
function validateOrderIdInput() {
  const inp = $("#flt-orderId");
  if (!inp) return true;
  const msg = $("#flt-orderId-msg");
  const v = (inp.value || "").trim();
  let error = "";
  if (v) {
    const hasStar = v.includes("*");
    if (hasStar) {
      const digits = v.replace(/\*/g, "");
      if (!/^\d*$/.test(digits)) error = "Nur Ziffern und * erlaubt.";
      else if (digits.length > 8) error = "Max. 8 Ziffern (ohne *).";
    } else {
      if (!/^\d+$/.test(v)) error = "Nur Ziffern erlaubt.";
      else if (v.length < 8) error = "Auftrags-ID zu kurz (8 Ziffern).";
      else if (v.length > 8) error = "Max. 8 Ziffern.";
    }
  }
  msg.textContent = error;
  inp.classList.toggle("is-invalid", !!error);
  return !error;
}

/* ---------- Sort ---------- */
function columnByKey(key) {
  return columns.find((c) => c.key === key) || columns[0];
}
function compare(a, b, col) {
  const { key, type } = col;
  const va = a[key],
    vb = b[key];
  if (type === "number") return Number(va ?? 0) - Number(vb ?? 0);
  if (type === "date") {
    const da = parseDateSmart(va)?.getTime() ?? -Infinity;
    const db = parseDateSmart(vb)?.getTime() ?? -Infinity;
    return da - db;
  }
  return String(va ?? "")
    .toLowerCase()
    .localeCompare(String(vb ?? "").toLowerCase(), "de");
}
function sortRows() {
  const col = columnByKey(state.sortKey);
  state.filtered.sort((a, b) =>
    state.sortDir === "asc" ? compare(a, b, col) : -compare(a, b, col)
  );
}

/* ---------- Filter ---------- */
function applyFilters() {
  if (!validateOrderIdInput()) {
    $("#flt-orderId")?.focus();
    return;
  }

  const f = {
    orderId: $("#flt-orderId")?.value.trim() || "",
    auftragsgeber: $("#flt-auftrag")?.value.trim() || "",
    vonPlz: $("#flt-von")?.value.trim() || "",
    nachPlz: $("#flt-nach")?.value.trim() || "",
    frachtfuehrer: $("#flt-fuehrer")?.value.trim() || "",
    ladedatum: $("#flt-lade")?.value || "",
    entladedatum: $("#flt-entlade")?.value || "",
  };

  state.filtered = state.allRows.filter((r) => {
    const ok = [
      ["orderId", f.orderId],
      ["auftragsgeber", f.auftragsgeber],
      ["vonPlz", f.vonPlz],
      ["nachPlz", f.nachPlz],
      ["frachtfuehrer", f.frachtfuehrer],
    ].every(([k, val]) => !val || makeGlob(val).test(String(r[k] ?? "")));
    if (!ok) return false;

    if (f.ladedatum) {
      const dFrom = parseDateSmart(f.ladedatum);
      dFrom.setHours(0, 0, 0, 0);
      const dRow = parseDateSmart(r.ladedatum);
      if (!dRow || dRow < dFrom) return false;
    }
    if (f.entladedatum) {
      const dFrom = parseDateSmart(f.entladedatum);
      dFrom.setHours(0, 0, 0, 0);
      const dRow = parseDateSmart(r.entladedatum);
      if (!dRow || dRow < dFrom) return false;
    }
    return true;
  });

  // Default-Sort je Seite (nur setzen, wenn noch nicht gesetzt)
  if (!state.sortKey) {
    if (state.status === "OPEN") {
      state.sortKey = "createdAt";
      state.sortDir = "desc";
    } else if (state.status === "IN_PROGRESS") {
      state.sortKey = "updatedAt";
      state.sortDir = "desc";
    } else if (state.status === "CLOSED") {
      state.sortKey = "closedAt";
      state.sortDir = "desc";
    } else {
      state.sortKey = "ladedatum";
      state.sortDir = "desc";
    }
  }

  sortRows();
  state.page = 1;
  renderTable();
}

/* ---------- Header + Resize ---------- */
let isResizing = false;
const widthKey = (key) => `tblw_${state.status || "ALL"}_${key}`;

function addResizeBehaviour(th, resizer, key) {
  let startX, startW;
  resizer.addEventListener("mousedown", (e) => {
    isResizing = true;
    startX = e.pageX;
    startW = th.offsetWidth;
    document.body.style.userSelect = "none";
    const move = (ev) => {
      const w = Math.max(60, startW + (ev.pageX - startX));
      th.style.width = w + "px";
      localStorage.setItem(widthKey(key), String(w));
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      setTimeout(() => (isResizing = false), 0);
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  });
}

function renderHeaderRow() {
  const parts = ensureTableParts();
  if (!parts) return;
  const { thead } = parts;

  const tr = document.createElement("tr");

  for (const col of visibleColumns()) {
    const th = document.createElement("th");
    th.classList.add("th");
    th.textContent = col.label;
    th.title = col.label;

    if (col.sortable) {
      th.classList.add("th--sortable");
      th.dataset.key = col.key;
      const icon = document.createElement("span");
      icon.className = "th__sort";
      th.appendChild(icon);
      th.addEventListener("click", () => {
        if (isResizing) return;
        if (state.sortKey === col.key)
          state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        else {
          state.sortKey = col.key;
          state.sortDir = "asc";
        }
        sortRows();
        renderTable();
      });
    }

    const saved = localStorage.getItem(widthKey(col.key));
    if (saved) th.style.width = saved + "px";
    const rz = document.createElement("span");
    rz.className = "th__resizer";
    th.appendChild(rz);
    addResizeBehaviour(th, rz, col.key);

    tr.appendChild(th);
  }

  const thAct = document.createElement("th");
  thAct.className = "th th--actions";
  thAct.title = "Aktionen";
  tr.appendChild(thAct);

  thead.innerHTML = "";
  thead.appendChild(tr);
}

/* ---------- Kontextmenü / History ---------- */
let openMenuEl = null,
  openAnchor = null,
  openOrderId = null;

const svgEllipsis = () =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`;
const svgExternal = () =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3z"/><path d="M5 5h6v2H7v10h10v-4h2v6H5z"/></svg>`;
const svgHistory = () =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 1 1 2.05 4.95l-1.41 1.41A9 9 0 1 0 13 3z"/><path d="M12 8h1v5l4 2-.5.87L12 14V8z"/></svg>`;

function closeMenu() {
  if (!openMenuEl) return;
  if (openAnchor) openAnchor.setAttribute("aria-expanded", "false");
  openMenuEl.remove();
  openMenuEl = null;
  openAnchor = null;
  openOrderId = null;
  document.removeEventListener("click", onBodyClick, true);
  window.removeEventListener("resize", closeMenu);
  window.removeEventListener("scroll", closeMenu, true);
  document.removeEventListener("keydown", onEscKey);
}
function onEscKey(e) {
  if (e.key === "Escape") closeMenu();
}
function onBodyClick(e) {
  if (!openMenuEl) return;
  if (!openMenuEl.contains(e.target) && e.target !== openAnchor) closeMenu();
}

function openRowMenu(orderId, anchor) {
  if (openMenuEl && openAnchor === anchor) {
    closeMenu();
    return;
  } // toggle
  closeMenu();
  const rect = anchor.getBoundingClientRect();
  const menu = document.createElement("div");
  menu.className = "ctxmenu";
  menu.dataset.orderId = String(orderId);
  menu.innerHTML = `
    <button class="ctxmenu__item" data-act="detail">${svgExternal()} <span>Auftragsdetailansicht öffnen</span></button>
    <button class="ctxmenu__item" data-act="history">${svgHistory()} <span>Änderungshistory öffnen</span></button>
  `;
  document.body.appendChild(menu);

  let left = rect.right + 6,
    top = rect.top;
  const mw = menu.offsetWidth,
    mh = menu.offsetHeight;
  if (left + mw > window.innerWidth - 8) left = Math.max(8, rect.left - mw - 6);
  if (top + mh > window.innerHeight - 8)
    top = Math.max(8, window.innerHeight - mh - 8);
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;

  menu.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    if (btn.dataset.act === "detail") {
      window.open(
        `auftragsdetail.html?id=${encodeURIComponent(orderId)}`,
        "_blank",
        "noopener"
      );
      closeMenu();
    } else if (btn.dataset.act === "history") {
      closeMenu();
      openHistoryModal(orderId);
    }
  });

  document.addEventListener("click", onBodyClick, true);
  window.addEventListener("resize", closeMenu);
  window.addEventListener("scroll", closeMenu, true);
  document.addEventListener("keydown", onEscKey);

  openMenuEl = menu;
  openAnchor = anchor;
  openOrderId = orderId;
  anchor.setAttribute("aria-expanded", "true");
}

/* ---------- History Modal ---------- */
function actionLabel(code) {
  switch (String(code || "").toUpperCase()) {
    case "CREATED":
      return "Neu angelegt";
    case "UPDATED":
      return "Aktualisiert";
    case "STATUS_CHANGED":
      return "Nur Status geändert";
    case "EDITED":
      return "Bearbeitet"; // Status + mind. ein anderes Feld
    default:
      return code || "—";
  }
}

function normalizeHistoryShape(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.history)) return data.history;
  if (Array.isArray(data.changes)) return data.changes;
  if (Array.isArray(data.audit)) return data.audit;
  if (Array.isArray(data.timeline)) return data.timeline;
  if (data.data) return normalizeHistoryShape(data.data);
  return [];
}

async function fetchHistory(orderId) {
  const urls = [
    `/api/orders/${encodeURIComponent(orderId)}/history`,
    `/api/order/${encodeURIComponent(orderId)}/history`,
    `/api/orders/${encodeURIComponent(orderId)}/changes`,
    `/api/orders/${encodeURIComponent(orderId)}/audit`,
    `/api/history?orderId=${encodeURIComponent(orderId)}`,
    `/api/orderHistory?id=${encodeURIComponent(orderId)}`,
    `/api/orders/${encodeURIComponent(orderId)}`,
  ];
  for (const url of urls) {
    try {
      const res = await apiFetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const arr = normalizeHistoryShape(json);
      if (arr.length) return arr;

      // Fallback: einfache Pseudo-History
      if (
        json &&
        typeof json === "object" &&
        (json.createdAt || json.updatedAt)
      ) {
        const items = [];
        if (json.createdAt)
          items.push({
            status: "CREATED",
            action: "CREATED",
            timestamp: json.createdAt,
            username: json.createdBy || "—",
          });
        if (json.updatedAt && json.updatedAt !== json.createdAt)
          items.push({
            status: json.status ?? "",
            action: "UPDATED",
            timestamp: json.updatedAt,
            username: json.updatedBy || "—",
          });
        return items;
      }
    } catch {
      /* try next url */
    }
  }
  return [];
}

function openHistoryModal(orderId) {
  const overlay = document.createElement("div");
  overlay.id = "historyOverlay";
  overlay.innerHTML = `
    <div id="historyBox" role="dialog" aria-modal="true" aria-labelledby="histTitle">
      <header id="histTitle">Änderungshistory</header>
      <div class="hist-meta"><strong>Auftrags-ID:</strong> <span id="histOrderId">${h(
        orderId
      )}</span></div>
      <div class="hist-scroller">
        <table>
          <thead><tr><th>Status</th><th>Aktion</th><th>Datum & Uhrzeit</th><th>Benutzer</th></tr></thead>
          <tbody id="histRows"><tr><td colspan="4" class="muted">Lade…</td></tr></tbody>
        </table>
      </div>
      <footer><button class="btn btn--light" id="histClose">Schließen</button></footer>
    </div>`;
  document.body.appendChild(overlay);

  $("#histClose", overlay).addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  document.addEventListener("keydown", function _esc(e) {
    if (e.key === "Escape") {
      overlay.remove();
      document.removeEventListener("keydown", _esc);
    }
  });

  (async () => {
    const items = await fetchHistory(orderId);
    if (!items.length) {
      $(
        "#histRows",
        overlay
      ).innerHTML = `<tr><td colspan="4" class="muted">Keine Einträge vorhanden oder Fehler beim Laden.</td></tr>`;
      return;
    }

    const toDate = (t) =>
      typeof t === "number" ? new Date(t) : new Date(String(t));
    const fmt = new Intl.DateTimeFormat("de-DE", {
      dateStyle: "short",
      timeStyle: "medium",
    });

    // chronologisch (alt → neu)
    items.sort((a, b) => {
      const ta =
        a.timestamp ?? a.time ?? a.date ?? a.changedAt ?? a.createdAt ?? 0;
      const tb =
        b.timestamp ?? b.time ?? b.date ?? b.changedAt ?? b.createdAt ?? 0;
      return toDate(ta) - toDate(tb);
    });

    const rows = items
      .map((it) => {
        const status = statusLabelDE(it.status ?? it.state ?? "");
        const aktion = actionLabel(it.action ?? it.event ?? it.type ?? "");
        const ts =
          it.timestamp ??
          it.time ??
          it.date ??
          it.changedAt ??
          it.createdAt ??
          "";
        const user =
          it.user ?? it.username ?? it.by ?? it.changedBy ?? it.actor ?? "";
        const when = ts ? fmt.format(toDate(ts)) : "";
        return `<tr>
        <td title="${h(status)}">${h(status)}</td>
        <td title="${h(aktion)}">${h(aktion)}</td>
        <td title="${h(when)}">${h(when)}</td>
        <td title="${h(user)}">${h(user)}</td>
      </tr>`;
      })
      .join("");

    $("#histRows", overlay).innerHTML =
      rows ||
      `<tr><td colspan="4" class="muted">Keine Einträge vorhanden.</td></tr>`;
  })();
}

/* ---------- Filter/Toolbar ---------- */
function renderFilters() {
  const host = $("#filters");
  host.innerHTML = `
    <div class="filters">
      <div class="filters__field"><label for="flt-orderId">Auftrags-ID</label>
        <input id="flt-orderId" class="form__input" placeholder="z.B. 100000*" maxlength="8" title="8 Ziffern oder Muster mit *">
        <p id="flt-orderId-msg" class="filters__help" aria-live="polite"></p></div>
      <div class="filters__field"><label for="flt-auftrag">Auftragsgeber</label>
        <input id="flt-auftrag" class="form__input" placeholder="Name*" title="Text oder Muster mit *"><p class="filters__help"></p></div>
      <div class="filters__field"><label for="flt-lade">Ladedatum ab</label>
        <input id="flt-lade" type="date" class="form__input" title="ab Datum"><p class="filters__help"></p></div>
      <div class="filters__field"><label for="flt-von">von (PLZ)</label>
        <input id="flt-von" class="form__input" placeholder="85*" title="PLZ oder Muster mit *"><p class="filters__help"></p></div>
      <div class="filters__field"><label for="flt-entlade">Entladedatum ab</label>
        <input id="flt-entlade" type="date" class="form__input" title="ab Datum"><p class="filters__help"></p></div>
      <div class="filters__field"><label for="flt-nach">nach (PLZ)</label>
        <input id="flt-nach" class="form__input" placeholder="30*" title="PLZ oder Muster mit *"><p class="filters__help"></p></div>
      <div class="filters__field"><label for="flt-fuehrer">Frachtführer</label>
        <input id="flt-fuehrer" class="form__input" placeholder="Firma*" title="Text oder Muster mit *"><p class="filters__help"></p></div>
      <div class="filters__actions" title="Aktionen">
        <button id="btn-search" class="iconbtn is-active" type="button" title="Suchen (Enter)" aria-label="Suchen">
          <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        </button>
        <button id="btn-reset" class="iconbtn iconbtn--reset" type="button" title="Zurücksetzen" aria-label="Zurücksetzen">
          <svg viewBox="0 0 24 24"><path d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5a5 5 0 0 1-8.66 3.54l-1.42 1.42A7 7 0 1 0 12 6z"/></svg>
        </button>
      </div>
    </div>`;
  $("#flt-orderId").addEventListener("input", validateOrderIdInput);
  $all(".filters input").forEach((inp) =>
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") applyFilters();
    })
  );
  $("#btn-search").addEventListener("click", applyFilters);
  $("#btn-reset").addEventListener("click", () => {
    $all(".filters input").forEach((i) => (i.value = ""));
    validateOrderIdInput();
    applyFilters();
  });
}

/* ---------- Daten laden ---------- */
function resolveCandidates(status) {
  if (!status) return [null];
  const key = String(status).toUpperCase();
  const map = {
    OPEN: ["OPEN"],
    WIP: ["IN_PROGRESS", "WIP", "IN_BEARBEITUNG"],
    IN_PROGRESS: ["IN_PROGRESS", "WIP", "IN_BEARBEITUNG"],
    CLOSED: ["CLOSED", "DONE"],
  };
  return map[key] || [key];
}

async function fetchRows(status) {
  const candidates = resolveCandidates(status);

  // 1) API mit Status versuchen
  let data = null;
  for (const st of candidates) {
    const url = st
      ? `/api/orders?status=${encodeURIComponent(st)}`
      : "/api/orders";
    try {
      const res = await apiFetch(url);
      if (!res.ok) continue;
      data = await res.json();
      break;
    } catch {
      /* try next */
    }
  }
  // 2) Fallback: alle holen und clientseitig filtern
  if (data == null) {
    try {
      const res = await apiFetch("/api/orders");
      data = res.ok ? await res.json() : [];
    } catch {
      data = [];
    }
  }

  // 3) Mapping
  const mapped = (Array.isArray(data) ? data : []).map((r) => {
    const status = r.status ?? r.state ?? r.orderStatus ?? "";
    const createdAt = r.createdAt ?? r.created_at ?? null;
    const updatedAt = r.updatedAt ?? r.updated_at ?? null;
    return {
      status,
      createdAt,
      updatedAt,
      closedAt:
        String(status).toUpperCase() === "CLOSED"
          ? r.closedAt ?? updatedAt ?? null
          : null,

      orderId: r.orderId ?? r.id ?? "",
      auftragsgeber: r.auftragsgeber ?? r.customerName ?? "",
      ladedatum: r.ladedatum ?? r.loadDate ?? "",
      vonPlz: r.vonPlz ?? r.zipFrom ?? "",
      entladedatum: r.entladedatum ?? r.unloadDate ?? "",
      nachPlz: r.nachPlz ?? r.zipTo ?? "",
      preisKunde: r.preisKunde ?? r.priceCustomer ?? null,
      preisFf: r.preisFf ?? r.priceFreight ?? null,
      frachtfuehrer: r.frachtfuehrer ?? r.carrier ?? "",
      ldm: r.ldm ?? "",
      gewicht: r.gewicht ?? "",
      bemerkung: r.bemerkung ?? r.note ?? "",
    };
  });

  state.allRows = status
    ? mapped.filter((r) =>
        resolveCandidates(status).includes(String(r.status).toUpperCase())
      )
    : mapped;
}

/* ---------- Rendering ---------- */
function renderTable() {
  const parts = ensureTableParts();
  if (!parts) return;
  const { tbody } = parts;

  // Sortindikator im Header
  $all("#ordersTable thead th.th--sortable").forEach((th) => {
    th.classList.toggle(
      "is-asc",
      th.dataset.key === state.sortKey && state.sortDir === "asc"
    );
    th.classList.toggle(
      "is-desc",
      th.dataset.key === state.sortKey && state.sortDir === "desc"
    );
  });

  tbody.innerHTML = "";

  const total = state.filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (state.page > pages) state.page = pages;

  const start = (state.page - 1) * PAGE_SIZE;
  const slice = state.filtered.slice(start, start + PAGE_SIZE);

  const frag = document.createDocumentFragment();

  for (const o of slice) {
    const tr = document.createElement("tr");

    for (const c of visibleColumns()) {
      const raw = o[c.key];
      const td = document.createElement("td");

      if (c.key === "orderId") {
        const a = document.createElement("a");
        a.href = `auftragsdetail.html?id=${o.orderId}`;
        a.textContent = String(raw ?? "");
        a.title = String(raw ?? "");
        td.appendChild(a);
      } else {
        const text = c.format ? c.format(raw) : raw ?? "";
        td.textContent = String(text ?? "");
        td.title = String(raw ?? "");
      }
      tr.appendChild(td);
    }

    // Actions
    const tdAct = document.createElement("td");
    tdAct.className = "td--actions";
    const btn = document.createElement("button");
    btn.className = "iconbtn iconbtn--ghost";
    btn.type = "button";
    btn.title = "Menü";
    btn.setAttribute("aria-haspopup", "menu");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = svgEllipsis();
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openRowMenu(o.orderId, btn);
    });
    tdAct.appendChild(btn);
    tr.appendChild(tdAct);

    frag.appendChild(tr);
  }

  tbody.appendChild(frag);

  renderPager(total, pages);
  $("#hitcount") && ($("#hitcount").textContent = `${total} Treffer`);
}

function renderPager(total, pages) {
  const host = $("#pager");
  const mkBtn = (label, page, disabled = false, active = false) => {
    const btn = document.createElement("button");
    btn.className = "pager__btn" + (active ? " is-active" : "");
    btn.textContent = label;
    if (disabled) btn.disabled = true;
    else
      btn.addEventListener("click", () => {
        state.page = page;
        renderTable();
      });
    return btn;
  };

  host.innerHTML = "";
  host.appendChild(mkBtn("«", 1, state.page === 1));
  host.appendChild(mkBtn("‹", Math.max(1, state.page - 1), state.page === 1));

  const around = 2;
  const from = Math.max(1, state.page - around);
  const to = Math.min(pages, state.page + around);
  for (let p = from; p <= to; p++)
    host.appendChild(mkBtn(String(p), p, false, p === state.page));

  host.appendChild(
    mkBtn("›", Math.min(pages, state.page + 1), state.page === pages)
  );
  host.appendChild(mkBtn("»", pages, state.page === pages));
}

/* ---------- Seite rendern ---------- */
export async function renderList(status) {
  requireAuth();
  startInactivityLogout({ minutes: 120 });

  state.status = status || null;

  renderFilters();
  renderHeaderRow();

  $("#hitcount") && ($("#hitcount").textContent = "0 Treffer");
  $("#ordersTable tbody") && ($("#ordersTable tbody").innerHTML = "");
  $("#pager") && ($("#pager").innerHTML = "");

  await fetchRows(state.status);

  // Default per Seite wird in applyFilters gesetzt:
  state.sortKey = "";
  state.sortDir = "desc";

  applyFilters();
}
