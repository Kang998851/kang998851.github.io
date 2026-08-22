(() => {
  const catalog = {
    learn: {
      name: "Kang Learn",
      month: "$6.9",
      quarter: "$17.9",
      year: "$49.9"
    },
    office: {
      name: "Kang Office",
      month: "$3.9",
      quarter: "$10.9",
      year: "$29.9"
    },
    data: {
      name: "Kang Data",
      month: "$3.9",
      quarter: "$10.9",
      year: "$29.9"
    }
  };

  const params = new URLSearchParams(location.search);
  const product = catalog[params.get("product")] ? params.get("product") : "office";
  const form = document.getElementById("pay-form");
  const setupBox = document.getElementById("pay-setup");
  const setupForm = document.getElementById("setup-form");
  const setupStatus = document.getElementById("setup-status");
  const status = document.getElementById("form-status");
  const payButton = document.getElementById("pay-button");
  const payHint = document.getElementById("pay-hint");
  const nameEl = document.getElementById("summary-name");
  const metaEl = document.getElementById("summary-meta");
  const priceEl = document.getElementById("summary-price");
  const subEl = document.getElementById("summary-subtotal");
  const totalEl = document.getElementById("summary-total");
  const currencyEl = document.getElementById("summary-currency");

  nameEl.textContent = catalog[product].name;

  const requestedCycle = ["month", "quarter", "year"].includes(params.get("cycle"))
    ? params.get("cycle")
    : "year";
  document.getElementById(`cycle-${requestedCycle}`).checked = true;

  if (params.get("cancelled") === "1") {
    status.textContent = "PayPal checkout was cancelled. You can try again.";
  }

  function currentPrice() {
    const cycle = document.querySelector('input[name="cycle"]:checked').value;
    return catalog[product][cycle];
  }

  function orderPayload() {
    return {
      product,
      tier: "pro",
      cycle: document.querySelector('input[name="cycle"]:checked').value,
      region: "int",
      email: document.getElementById("email").value.trim()
    };
  }

  function renderSummary() {
    const cycle = document.querySelector('input[name="cycle"]:checked').value;
    const cycleLabel = cycle[0].toUpperCase() + cycle.slice(1);
    const price = currentPrice();
    metaEl.textContent = `${cycleLabel} · USD`;
    priceEl.textContent = price;
    subEl.textContent = price;
    totalEl.textContent = price;
    currencyEl.textContent = "USD";
  }

  document.querySelector(".checkout-summary").addEventListener("change", () => {
    renderSummary();
    if (!params.get("cancelled")) status.textContent = "";
  });
  renderSummary();

  function applyConfig(data) {
    const ready = Boolean(data.ready);
    setupBox.hidden = ready || data.canSetup === false;
    form.hidden = !ready;
    if (ready) {
      payHint.textContent = data.livemode
        ? "Live PayPal checkout. Pay with PayPal or an international Mastercard / Visa (including CMB Mastercard debit when the bank allows overseas online payments)."
        : "Sandbox mode. Use a PayPal sandbox buyer account — no real charge.";
      status.textContent = status.textContent || "";
    } else if (data.canSetup === false) {
      status.textContent = "Card checkout is not open yet. Download the trial and use it on your computer.";
      form.hidden = true;
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
    setupStatus.textContent = "Checking PayPal credentials…";
    try {
      const res = await fetch("/api/setup-paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: document.getElementById("paypal-client").value.trim(),
          clientSecret: document.getElementById("paypal-secret").value.trim(),
          mode: document.getElementById("paypal-mode").value
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save PayPal settings.");
      document.getElementById("paypal-secret").value = "";
      applyConfig({ ...data, canSetup: true });
      setupStatus.textContent = data.livemode
        ? "PayPal live mode saved. Real payments will be charged."
        : "PayPal sandbox saved. You can test checkout.";
    } catch (err) {
      setupStatus.textContent = err.message || "Could not connect PayPal.";
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    payButton.disabled = true;
    status.textContent = "Opening PayPal…";
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload())
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Could not start PayPal Checkout.");
      }
      location.href = data.checkoutUrl;
    } catch (err) {
      status.textContent = err.message || "Could not open PayPal.";
      payButton.disabled = false;
    }
  });
})();
