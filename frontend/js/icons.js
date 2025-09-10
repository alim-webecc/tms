// Zentrales Icon-Mapping -> Material Symbols (Apache-2.0).
export const ICONS = {
  ok: "check_circle",
  success: "check_circle",
  cancel: "close",
  close: "close",
  x: "close",
  times: "close",
  save: "save",
  edit: "edit",
  pencil: "edit",
  delete: "delete",
  trash: "delete",
  search: "search",
  filter: "filter_alt",
  add: "add",
  plus: "add",
  remove: "remove",
  menu: "menu",
  more: "more_vert",
  back: "arrow_back",
  forward: "arrow_forward",
  info: "info",
  warning: "warning",
  error: "error",
  user: "person",
  settings: "settings",
};
export function icon(name, classes = "") {
  const material = ICONS[name] || name;
  const el = document.createElement("span");
  el.className = `mi ${classes}`.trim();
  el.setAttribute("aria-hidden", "true");
  el.textContent = material;
  return el;
}
