// js/ui.js
export function ensureToastHost() {
  let host = document.getElementById("appToast");
  if (!host) {
    host = document.createElement("div");
    host.id = "appToast";
    host.className = "toast";
    document.body.appendChild(host);
  }
  return host;
}
export function showToast(text, type = "success") {
  const host = ensureToastHost();
  host.textContent = text;
  host.classList.remove("toast--error", "toast--success");
  host.classList.add(type === "error" ? "toast--error" : "toast--success");
  requestAnimationFrame(() => host.classList.add("is-visible"));
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => host.classList.remove("is-visible"), 2300);
}
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
