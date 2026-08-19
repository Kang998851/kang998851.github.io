(() => {
  const catalog = {
    learn: {
      name: "Kang Learn",
      pro: { month: "$9.9", quarter: "$29.9", year: "$59.9" },
      max: { month: "$11.9", quarter: "$35.9", year: "$71.9" }
    },
    office: {
      name: "Kang Office",
      month: "$9.9",
      quarter: "$29.9",
      year: "$59.9"
    },
    data: {
      name: "Kang Data",
      month: "$9.9",
      quarter: "$29.9",
      year: "$59.9"
    }
  };

  const params = new URLSearchParams(location.search);
  const product = catalog[params.get("product")] ? params.get("product") : "office";
  const form = document.getElementById("pay-form");
  const setupBox = document.getElementById("stripe-setup");
  const setupForm = document.getElementById("setup-form");
  const setupStatus = document.getElementById("setup-status");
  const status = document.getElementById("form-status");
  const payButton = document.getElementById("pay-button");
  const payHint = document.getElementById("pay-hint");
  const mount = document.getElementById("payment-window");
  const learnBox = document.querySelector(".learn-only");
  const nameEl = document.getElementById("summary-name");
  const metaEl = document.getElementById("summary-meta");
  const priceEl = document.getElementById("summary-price");
  const subEl = document.getElementById("summary-subtotal");
  const totalEl = document.getElementById("summary-total");
  const currencyEl = document.getElementById("summary-currency");

  let checkoutPage = null;
  let publishableKey = "";

  nameEl.textContent = catalog[product].name;
  learnBox.hidden = product !== "learn";

  const requestedTier = params.get("tier") === "max" ? "max" : "pro";
  const requestedCycle = ["month", "quarter", "year"].includes(params.get("cycle"))
    ? params.get("cycle")
    : "year";
  document.getElementById(`tier-${requestedTier}`).checked = true;
  document.getElementById(`cycle-${requestedCycle}`).checked = true;

  function currentPrice() {
    const cycle = document.querySelector('input[name="cycle"]:checked').value;
    const tier = document.querySelector('input[name="tier"]:checked').value;
    const item = catalog[product];
    if (product === "learn") return item[tier][cycle];
    return item[cycle];
  }

  function orderPayload() {
    return {
      product,
      tier: document.querySelector('input[name="tier"]:checked').value,
      cycle: document.querySelector('input[name="cycle"]:checked').value,
      region: "int",
      email: document.getElementById("email").value.trim()
    };
  }

  function renderSummary() {
    const cycle = document.querySelector('input[name="cycle"]:checked').value;
    const cycleLabel = cycle[0].toUpperCase() + cycle.slice(1);
    const price = currentPrice();
    let extra = "";
    if (product === "learn") {
      extra = document.getElementById("tier-max").checked ? " · Max" : " · Pro";
    }
    metaEl.textContent = `${cycleLabel} · USD${extra}`;
    priceEl.textContent = price;
    subEl.textContent = price;
    totalEl.textContent = price;
    currencyEl.textContent = "USD";
  }

  async function destroyCheckout() {
    if (!checkoutPage) return;
    try {
      checkoutPage.destroy();
    } catch {
      /* already gone */
    }
    checkoutPage = null;
    mount.hidden = true;
    mount.innerHTML = "";
    payButton.hidden = false;
  }

  async function fetchClientSecret() {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload())
    });
    const data = await res.json();
    if (!res.ok || !data.clientSecret) {
      throw new Error(data.error || "Could not start Stripe Checkout.");
    }
    return data.clientSecret;
  }

  async function openPaymentWindow() {
    if (!window.Stripe) {
      throw new Error("Stripe.js did not load.");
    }
    if (!publishableKey) {
      throw new Error("Card checkout is not open yet. Download the trial from the homepage.");
    }
    await destroyCheckout();
    const stripe = window.Stripe(publishableKey);
    const options = { fetchClientSecret };
    if (typeof stripe.createEmbeddedCheckoutPage === "function") {
      checkoutPage = await stripe.createEmbeddedCheckoutPage(options);
    } else if (typeof stripe.initEmbeddedCheckout === "function") {
      checkoutPage = await stripe.initEmbeddedCheckout(options);
    } else {
      throw new Error("This Stripe.js build cannot embed Checkout. Update the Stripe script.");
    }
    mount.hidden = false;
    checkoutPage.mount("#payment-window");
    payButton.hidden = true;
    status.textContent = "Enter the card in the Stripe window. Apple Pay and wallets appear there when available.";
  }

  document.querySelector(".checkout-summary").addEventListener("change", () => {
    renderSummary();
    destroyCheckout();
    status.textContent = "Plan changed. Open the payment window again.";
  });
  renderSummary();

  function applyConfig(data) {
    publishableKey = data.publishableKey || "";
    const ready = Boolean(data.ready && publishableKey);
    setupBox.hidden = ready || data.canSetup === false;
    form.hidden = !ready;
    if (ready) {
      payHint.textContent = data.livemode
        ? "Live mode. This charge uses a real card."
        : "Test mode. Use card 4242 4242 4242 4242, any future expiry, any CVC.";
      status.textContent = "";
    } else if (data.canSetup === false) {
      status.textContent = "Card checkout is not open yet. Download the trial and use it on your computer.";
      form.hidden = true;
    } else {
      status.textContent = "";
    }
  }

  fetch("/api/config")
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error("offline"))))
    .then(applyConfig)
    .catch(() => {
      status.textContent = "Card checkout is not open yet. Download the trial and use it on your computer.";
      form.hidden = true;
      setupBox.hidden = true;
    });

  setupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setupStatus.textContent = "Checking keys with Stripe…";
    try {
      const res = await fetch("/api/setup-stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publishableKey: document.getElementById("pk").value.trim(),
          secretKey: document.getElementById("sk").value.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save Stripe keys.");
      document.getElementById("sk").value = "";
      applyConfig({ ...data, canSetup: true });
      setupStatus.textContent = data.livemode
        ? "Live keys saved. Real cards will be charged."
        : "Test keys saved. You can pay with 4242 4242 4242 4242.";
    } catch (err) {
      setupStatus.textContent = err.message || "Could not connect Stripe.";
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    payButton.disabled = true;
    status.textContent = "Opening Stripe payment window…";
    try {
      await openPaymentWindow();
    } catch (err) {
      status.textContent = err.message || "Could not open the payment window.";
      payButton.hidden = false;
    } finally {
      payButton.disabled = false;
    }
  });
})();
