// js/orderid-validation.js
function waitFor(selector, root = document, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const el = root.querySelector(selector);
    if (el) return resolve(el);

    const obs = new MutationObserver(() => {
      const e2 = root.querySelector(selector);
      if (e2) {
        obs.disconnect();
        resolve(e2);
      }
    });
    obs.observe(root, { childList: true, subtree: true });

    setTimeout(() => {
      obs.disconnect();
      reject(new Error("timeout"));
    }, timeout);
  });
}

function setupOrderIdValidation(input, msgEl) {
  const show = (text) => {
    msgEl.textContent = text || "";
  };
  const setInvalid = (b) => input.classList.toggle("is-invalid", !!b);

  function validate() {
    const v = input.value.trim();
    if (!v) {
      setInvalid(false);
      show("");
      return true;
    }

    const hasStar = v.includes("*");
    const onlyDigits = /^\d+$/.test(v);

    if (hasStar) {
      setInvalid(false);
      show("");
      return true;
    }

    if (!onlyDigits) {
      setInvalid(true);
      show("Nur Ziffern (oder * als Platzhalter).");
      return false;
    }
    if (v.length < 8) {
      setInvalid(true);
      show("Auftrags-ID zu kurz (8 Ziffern).");
      return false;
    }
    if (v.length > 8) {
      setInvalid(true);
      show("Max. 8 Ziffern.");
      return false;
    }

    setInvalid(false);
    show("");
    return true;
  }

  ["input", "blur"].forEach((evt) => input.addEventListener(evt, validate));
  validate(); // initial
}

(async () => {
  try {
    const input = await waitFor("#flt-orderId");
    const msgEl = document.querySelector("#flt-orderId-msg");
    if (input && msgEl) setupOrderIdValidation(input, msgEl);
  } catch (e) {
    // Filter nicht gefunden (Seite ohne Filter) – einfach nichts tun
  }
})();
