// js/login.js
import { setAuth, clearAuth } from "./auth.js";
import { apiUrl } from "./config.js";

(() => {
  const form = document.getElementById("loginForm");
  const userId = document.getElementById("userId");
  const password = document.getElementById("password");
  const submitBtn = document.getElementById("submitBtn");
  const msgEl = document.getElementById("login-msg");
  const toggleBtn = document.querySelector(".toggle");
  const card = document.querySelector(".login-card");

  if (!form || !userId || !password || !submitBtn || !card) {
    console.error("login.html IDs passen nicht zu login.js", {
      form: !!form,
      userId: !!userId,
      password: !!password,
      submitBtn: !!submitBtn,
      card: !!card,
    });
    return;
  }

  // Vorhandene Tokens entfernen
  clearAuth();

  // --- Toast-Host immer in der Karte platzieren ---
  function getToastHost() {
    let host = card.querySelector("#toast");
    if (!host) {
      host = document.createElement("div");
      host.id = "toast";
      host.className = "toast toast--card";
      card.prepend(host); // oberhalb des Formulars in der Karte
    } else {
      // sicherstellen, dass die Karten-Variante aktiv ist
      host.classList.add("toast--card");
    }
    return host;
  }

  function showToast(message, type = "error") {
    const host = getToastHost();
    const item = document.createElement("div");
    item.className = `toast__item toast__item--${type}`;
    item.textContent = message;
    host.appendChild(item);
    requestAnimationFrame(() => item.classList.add("show"));
    setTimeout(() => {
      item.classList.remove("show");
      setTimeout(() => item.remove(), 250);
    }, 3000);
  }

  // Feld-Validierung/Hint
  const setValidity = (input, ok, msg = "") => {
    input.classList.toggle("is-invalid", !ok);
    const hint = document.querySelector(
      `.form__hint[data-hint-for="${input.id}"]`
    );
    if (hint) {
      hint.textContent = ok ? "" : msg;
      hint.hidden = !!ok;
    }
  };

  const compute = () => {
    const u = userId.value.trim().length > 0;
    const p = password.value.trim().length > 0;
    submitBtn.disabled = !(u && p);
    submitBtn.classList.toggle("is-active", u && p);
    if (u) setValidity(userId, true, "");
    if (p) setValidity(password, true, "");
    if (msgEl) msgEl.textContent = "";
  };

  // Passwort anzeigen/ausblenden
  toggleBtn?.addEventListener("click", () => {
    password.type = password.type === "password" ? "text" : "password";
    password.focus();
  });

  userId.addEventListener("input", compute);
  password.addEventListener("input", compute);
  compute();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgEl.textContent = "";
    submitBtn.disabled = true;

    const payload = { username: userId.value.trim(), password: password.value };

    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        setValidity(userId, false, "Benutzername oder Passwort ist falsch");
        setValidity(password, false, "");
        showToast("Benutzername oder Passwort ist falsch", "error");
        userId.focus();
        return;
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Login fehlgeschlagen (${res.status})`);
      }

      const data = await res.json();
      if (!data?.token) throw new Error("Unerwartete Serverantwort");

      setAuth(data);
      window.location.replace("start.html");
    } catch (err) {
      const msg = err.message || "Login fehlgeschlagen";
      if (msgEl) msgEl.textContent = msg;
      showToast(msg, "error");
    } finally {
      submitBtn.disabled = false;
      compute();
    }
  });
})();
