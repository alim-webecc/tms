/**
 * Unsaved changes Guard + Modal-Steuerung.
 * - Nur Buttons (OK/Abbrechen/X) schließen.
 * - Backdrop/ESC haben keine Wirkung.
 * - Fokus-Trap & Body-Scroll-Lock.
 * - Markiert Änderungen global (auch ohne <form>).
 */
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

    // Backdrop: Klicks abfangen (kein Close)
    this.backdrop.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // Buttons
    this.okBtn.addEventListener("click", () => this._close(true));
    this.cancelBtns.forEach((b) =>
      b.addEventListener("click", () => this._close(false))
    );

    // Keyboard: ESC deaktiviert, Tab = Fokus-Trap
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

  /** Trackt konkretes <form>-Element. */
  trackForm(form) {
    if (!form) return;
    const mark = () => this.setDirty(true);
    form.addEventListener("input", mark, { capture: true });
    form.addEventListener("change", mark, { capture: true });
  }

  /** Trackt ALLE Inputs in einem Container (z. B. document), auch ohne <form>. */
  trackAnyInputs(container = document) {
    const mark = () => this.setDirty(true);
    container.addEventListener("input", mark, { capture: true });
    container.addEventListener("change", mark, { capture: true });
    // Optional: programmatisch aufräumen bei Speichern:
    container.addEventListener(
      "click",
      (e) => {
        const btn = e.target.closest("[data-reset-dirty]");
        if (btn) this.setDirty(false);
      },
      true
    );
  }

  /** Fängt Links/Buttons ab und bestätigt bei dirty. */
  interceptLinks(container = document) {
    container.addEventListener(
      "click",
      async (e) => {
        const t = e.target.closest("a,[data-navigate]");
        if (!t || t.hasAttribute("data-bypass-guard")) return;

        const isAnchor = t.tagName.toLowerCase() === "a";
        const go = () => {
          if (isAnchor) {
            const href = t.getAttribute("href");
            if (href) window.location.href = href;
          } else if (t.dataset.navigate) {
            const fn = window[t.dataset.navigate];
            if (typeof fn === "function") fn.call(t, e);
            else if (t.dataset.href) window.location.href = t.dataset.href;
            else if (t.dataset.back === "1" || t.dataset.navigate === "back")
              history.back();
          }
        };

        if (this.isDirty()) {
          e.preventDefault();
          const ok = await this.confirm();
          if (ok) {
            // kurzzeitig beforeunload-Unterdrückung → kein nativer Dialog
            this._suppressBeforeUnload = true;
            setTimeout(() => {
              this._suppressBeforeUnload = false;
            }, 600);
            go();
          }
        } else {
          // nicht dirty: <a> → Browser macht das; [data-navigate] → selbst ausführen
          if (!isAnchor) {
            e.preventDefault();
            go();
          }
        }
      },
      true
    ); // capture-phase
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

  // Tab/Fenster schließen -> nur nativer beforeunload-Dialog erlaubt
  window.addEventListener("beforeunload", (e) => {
    if (guard.isDirty() && !guard._suppressBeforeUnload) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  return guard;
}
