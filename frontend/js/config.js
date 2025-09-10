// js/config.js
export const API_BASE = window.API_BASE || "http://localhost:8081";
export const apiUrl = (path) =>
  `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
