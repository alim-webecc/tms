// js/auth.js
const API_BASE = window.API_BASE || "http://localhost:8081";

/* -------------------- Auth-Storage -------------------- */
export function getAuth() {
  try {
    return JSON.parse(localStorage.getItem("auth") || "null");
  } catch {
    return null;
  }
}

export function setAuth(data) {
  // Erwartet { token, role, username }
  localStorage.setItem("auth", JSON.stringify(data));
}

export function clearAuth() {
  localStorage.removeItem("auth");
}

export function getRole() {
  return getAuth()?.role ?? null;
}

/* -------------------- JWT-Helpers -------------------- */
// Base64URL-Decode (JWT nutzt -, _ und i. d. R. kein Padding)
function b64urlDecode(str) {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4 !== 0) s += "=";
  try {
    return atob(s);
  } catch {
    return "";
  }
}
function getTokenPayload() {
  const token = getAuth()?.token;
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(b64urlDecode(parts[1]));
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  const token = getAuth()?.token;
  if (!token) return false;
  const payload = getTokenPayload();
  if (payload?.exp && Date.now() / 1000 > payload.exp) return false; // exp in Sekunden
  return true;
}

/* -------------------- API -------------------- */
export async function login(username, password) {
  clearAuth();
  const resp = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    const msg =
      txt ||
      (resp.status === 401
        ? "Benutzername oder Passwort ist falsch"
        : `Login fehlgeschlagen (${resp.status})`);
    throw new Error(msg);
  }
  const data = await resp.json();
  if (!data?.token || !data?.role)
    throw new Error("Unerwartete Serverantwort.");
  setAuth(data);
  return data;
}

export async function apiFetch(path, options = {}) {
  const a = getAuth();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (a?.token) headers.Authorization = `Bearer ${a.token}`;

  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (resp.status === 401 || resp.status === 403) {
    clearAuth();
    location.replace("login.html");
    throw new Error("Nicht autorisiert");
  }
  return resp;
}

export function logout() {
  clearAuth();
  location.replace("login.html");
}

export function requireAuth() {
  if (!isLoggedIn()) {
    location.replace("login.html");
    throw new Error("Nicht eingeloggt"); // bricht das restliche Script sauber ab
  }
}

/* -------------------- Inaktivitäts-Logout (2h) -------------------- */
/**
 * Startet einen Inaktivitäts-Logout-Timer.
 * Wenn der Nutzer für `minutes` Minuten nichts macht, wird logout() ausgeführt.
 * Tab-übergreifend synchronisiert via localStorage.
 */
let __idleTimeoutId = null;
const __IDLE_KEY = "lastActivityAt";
let __idleStarted = false;

export function startInactivityLogout({ minutes = 120 } = {}) {
  if (__idleStarted) return; // mehrfaches Registrieren vermeiden
  __idleStarted = true;

  const idleMs = minutes * 60 * 1000;

  function touch() {
    localStorage.setItem(__IDLE_KEY, String(Date.now()));
  }
  function scheduleFromStorage() {
    clearTimeout(__idleTimeoutId);
    const last = Number(localStorage.getItem(__IDLE_KEY) || 0);
    const remaining = Math.max(0, idleMs - (Date.now() - last));
    __idleTimeoutId = setTimeout(() => {
      logout();
    }, remaining);
  }

  if (!localStorage.getItem(__IDLE_KEY)) touch();
  scheduleFromStorage();

  const reset = () => {
    touch();
    scheduleFromStorage();
  };
  const opts = { passive: true };

  window.addEventListener("mousemove", reset, opts);
  window.addEventListener("mousedown", reset, opts);
  window.addEventListener("keydown", reset, opts);
  window.addEventListener("wheel", reset, opts);
  window.addEventListener("touchstart", reset, opts);
  window.addEventListener("touchmove", reset, opts);
  window.addEventListener("scroll", reset, opts);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") scheduleFromStorage();
  });

  window.addEventListener("storage", (e) => {
    if (e.key === __IDLE_KEY) scheduleFromStorage();
  });
}
