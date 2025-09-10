// js/staff-history.js
import { apiFetch } from "./auth.js";
import { showToast } from "./ui.js";

const $ = (s, r = document) => r.querySelector(s);
const $all = (s, r = document) => [...r.querySelectorAll(s)];
const PAGE_SIZE = 20;

const refs = {
  name: $("#empName"),
  from: $("#fromDate"),
  to: $("#toDate"),
  btnS: $("#btnSearch"),
  btnR: $("#btnReset"),
  tbody: $("#histTable tbody"),
  pager: $("#pager"),
  hit: $("#hitcount"),
};

let rows = [],
  page = 1;

function statusLabelDE(code) {
  switch (String(code || "").toUpperCase()) {
    case "OPEN":
      return "Offen";
    case "IN_PROGRESS":
      return "In Bearbeitung";
    case "CLOSED":
      return "Geschlossen";
    default:
      return code || "";
  }
}
function actionLabel(code) {
  switch (String(code || "").toUpperCase()) {
    case "CREATED":
      return "Neu angelegt";
    case "UPDATED":
      return "Aktualisiert";
    case "STATUS_CHANGED":
      return "Nur Status geändert";
    case "EDITED":
      return "Bearbeitet";
    default:
      return code || "—";
  }
}

function enable() {
  const active =
    !!refs.name.value.trim() || !!refs.from.value || !!refs.to.value;
  refs.btnS.disabled = !active;
  refs.btnR.disabled = !active;
}
$all("#empName,#fromDate,#toDate").forEach((el) =>
  el.addEventListener("input", enable)
);
refs.btnR.addEventListener("click", () => {
  refs.name.value = "";
  refs.from.value = "";
  refs.to.value = "";
  enable();
  draw([]);
});

refs.btnS.addEventListener("click", doSearch);
$all("#empName,#fromDate,#toDate").forEach((el) =>
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
  })
);

function firstDayOfMonthISO(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}
function ISO(d) {
  return d ? new Date(d).toISOString() : null;
}

async function doSearch() {
  const name = refs.name.value.trim();
  if (!name) {
    showToast("Bitte Mitarbeitername eingeben.", "error");
    return;
  }

  let from = refs.from.value ? ISO(refs.from.value) : null;
  let to = refs.to.value ? ISO(refs.to.value) : null;
  if (!from && !to) {
    from = firstDayOfMonthISO();
    to = new Date().toISOString();
  } else if (from && !to) {
    to = new Date().toISOString();
  } else if (!from && to) {
    from = firstDayOfMonthISO(new Date());
  }

  try {
    const params = new URLSearchParams({ username: name });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await apiFetch(`/api/admin/history?${params.toString()}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    rows = (Array.isArray(data) ? data : [])
      .map((x) => ({
        orderId: x.orderId,
        status: x.status,
        action: x.action,
        timestamp: x.timestamp,
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // neueste zuerst
    draw(rows);
    if (!rows.length) showToast("Kein Suchergebnis gefunden.", "error");
    else showToast(`${rows.length} Ergebnis(se) gefunden`, "success");
  } catch {
    showToast("Fehler beim Laden.", "error");
  }
}

function draw(items) {
  rows = items;
  page = 1;
  render();
}

function render() {
  const total = rows.length,
    pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > pages) page = pages;
  const start = (page - 1) * PAGE_SIZE,
    slice = rows.slice(start, start + PAGE_SIZE);
  const fmt = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "medium",
  });

  refs.tbody.innerHTML = slice
    .map((r) => {
      return `<tr>
      <td>${r.orderId}</td>
      <td>${statusLabelDE(r.status)}</td>
      <td>${actionLabel(r.action)}</td>
      <td>${fmt.format(new Date(r.timestamp))}</td>
    </tr>`;
    })
    .join("");

  refs.hit.textContent = `${total} Treffer`;

  const host = refs.pager;
  host.innerHTML = "";
  const mk = (label, p, dis = false, act = false) => {
    const b = document.createElement("button");
    b.className = "pager__btn" + (act ? " is-active" : "");
    b.textContent = label;
    b.disabled = dis;
    if (!dis)
      b.addEventListener("click", () => {
        page = p;
        render();
      });
    return b;
  };
  host.appendChild(mk("«", 1, page === 1));
  host.appendChild(mk("‹", Math.max(1, page - 1), page === 1));
  const from = Math.max(1, page - 2),
    to = Math.min(pages, page + 2);
  for (let p = from; p <= to; p++)
    host.appendChild(mk(String(p), p, false, p === page));
  host.appendChild(mk("›", Math.min(pages, page + 1), page === pages));
  host.appendChild(mk("»", pages, page === pages));
}
enable();
