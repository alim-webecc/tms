function getFocusable(el) {
  return [
    ...el.querySelectorAll(
      'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
    ),
  ].filter(
    (n) =>
      !n.hasAttribute("disabled") && n.getAttribute("aria-hidden") !== "true"
  );
}

class UnsavedChangesGuard {
  constructor(modal) {
    this.modal = modal;
    this.okBtn = modal.querySelector("[data-modal-ok]");
    this.cancelBtns = [...modal.querySelectorAll("[data-modal-cancel]")];
    this.backdrop = modal.querySelector(".ucm-modal__overlay");
    this._dirty = false;
    this._resolve = null;

    this.backdrop.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    this.okBtn.addEventListener("click", () => this._close(true));
    this.cancelBtns.forEach((b) =>
      b.addEventListener("click", () => this._close(false))
    );

    this._onKeydown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === "Tab") {
        this._trapFocus(e);
      }
    };
  }
  setDirty(v) {
    this._dirty = !!v;
  }
  isDirty() {
    return this._dirty;
  }
  trackForm(form) {
    if (!form) return;
    const mark = () => this.setDirty(true);
    form.addEventListener("input", mark, { capture: true });
    form.addEventListener("change", mark, { capture: true });
  }
  interceptLinks(container = document) {
    container.addEventListener(
      "click",
      async (e) => {
        const t = e.target.closest("a,[data-navigate]");
        if (!t || t.hasAttribute("data-bypass-guard")) return;
        if (this.isDirty()) {
          e.preventDefault();
          const ok = await this.confirm();
          if (ok) {
            if (t.tagName.toLowerCase() === "a")
              window.location.href = t.getAttribute("href");
            else if (
              t.dataset.navigate &&
              typeof window[t.dataset.navigate] === "function"
            )
              window[t.dataset.navigate]();
          }
        }
      },
      true
    ); // capture-phase, damit nichts „durchrutscht“
  }
  confirm() {
    this._open();
    return new Promise((res) => (this._resolve = res));
  }
  _open() {
    this.modal.removeAttribute("hidden");
    document.body.classList.add("ucm-modal-open");
    this._focusables = getFocusable(this.modal);
    this._first = this._focusables[0];
    this._last = this._focusables[this._focusables.length - 1];
    document.addEventListener("keydown", this._onKeydown, true);
  }
  _close(ok) {
    document.removeEventListener("keydown", this._onKeydown, true);
    this.modal.setAttribute("hidden", "");
    document.body.classList.remove("ucm-modal-open");
    const res = this._resolve;
    this._resolve = null;
    if (ok) this.setDirty(false);
    if (res) res(!!ok);
  }
  _trapFocus(e) {
    if (!this._focusables || this._focusables.length === 0) return;
    if (e.shiftKey && document.activeElement === this._first) {
      e.preventDefault();
      this._last.focus();
    } else if (!e.shiftKey && document.activeElement === this._last) {
      e.preventDefault();
      this._first.focus();
    }
  }
}
export function createUnsavedGuard() {
  const modal = document.querySelector("[data-modal]");
  if (!modal) throw new Error("Unsaved modal not found");
  const guard = new UnsavedChangesGuard(modal);
  window.addEventListener("beforeunload", (e) => {
    if (guard.isDirty()) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
  return guard;
}
document.addEventListener("DOMContentLoaded", () => {
  const guard = createUnsavedGuard();
  const form = document.querySelector("form");
  if (form) guard.trackForm(form);
  guard.interceptLinks(document);
  window.__unsavedGuard = guard; // optional für Debug
});
