/**
 * Unsaved changes Guard + Modal-Steuerung.
 * - Nur Buttons (OK/Abbrechen/X) schließen; Overlay/ESC haben keine Wirkung.
 * - Fokus-Trap & Body-Scroll-Lock.
 * - Interceptet Links UND Buttons (data-href / data-back / data-navigate).
 * - „OK“ unterdrückt kurzzeitig ALLE beforeunload-Prompts → kein nativer Dialog.
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
    this._suppressBeforeUnload = false;

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

  /** Trackt ein <form>. */
  trackForm(form) {
    if (!form) return;
    const mark = () => this.setDirty(true);
    form.addEventListener("input", mark, { capture: true });
    form.addEventListener("change", mark, { capture: true });
  }

  /** Trackt Eingaben global – auch ohne <form>. */
  trackAnyInputs(container = document) {
    const mark = () => this.setDirty(true);
    container.addEventListener("input", mark, { capture: true });
    container.addEventListener("change", mark, { capture: true });
  }

  /** Bestätigt Navigation, fängt Links/Buttons ab. */
  interceptLinks(container = document) {
    container.addEventListener(
      "click",
      async (e) => {
        // Auch Buttons ohne <a> unterstützen:
        const t = e.target.closest(
          'a,[data-navigate],[data-href],[data-back],[data-role="cancel"],button[data-action="cancel"]'
        );
        if (!t || t.hasAttribute("data-bypass-guard")) return;

        const isAnchor = t.tagName.toLowerCase() === "a";
        const go = () => {
          if (isAnchor) {
            const href = t.getAttribute("href");
            if (href) window.location.href = href;
            return;
          }
          if (t.dataset.href) {
            window.location.href = t.dataset.href;
            return;
          }
          if (
            t.dataset.back === "1" ||
            t.dataset.navigate === "back" ||
            t.dataset.action === "cancel" ||
            t.dataset.role === "cancel"
          ) {
            history.back();
            return;
          }
          if (t.dataset.navigate) {
            const fn = window[t.dataset.navigate];
            if (typeof fn === "function") fn.call(t, e);
          }
        };

        if (this.isDirty()) {
          e.preventDefault();
          const ok = await this.confirm();
          if (ok) {
            // Unterdrücke *alle* beforeunload-Handler ganz kurz → kein nativer Dialog
            this._suppressBeforeUnload = true;
            const suppress = (ev) => {
              ev.stopImmediatePropagation();
            };
            window.addEventListener("beforeunload", suppress, {
              capture: true,
            });
            setTimeout(() => {
              this._suppressBeforeUnload = false;
              window.removeEventListener("beforeunload", suppress, {
                capture: true,
              });
            }, 800);
            go();
          }
        } else {
          // nicht dirty: Links lässt der Browser machen; Buttons führen wir selbst aus
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
    // 'returnValue' ist als API deprecated, aber weiterhin von Browsern gefordert
    // (Safari/Chrome), um den nativen Dialog zu triggern.
    if (guard.isDirty() && !guard._suppressBeforeUnload) {
      e.preventDefault();
      e.returnValue = ""; // bewusst gesetzt – siehe MDN-Hinweis
    }
  });

  return guard;
}
