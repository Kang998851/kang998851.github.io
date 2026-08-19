(() => {
  const title = document.getElementById("success-title");
  const copy = document.getElementById("success-copy");
  const box = document.getElementById("license-box");
  const license = document.getElementById("license");
  const sessionId = new URLSearchParams(location.search).get("session_id") || "";

  fetch(`/api/session?session_id=${encodeURIComponent(sessionId)}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) throw new Error(data.error);
      if (!data.paid) {
        title.textContent = "Payment not finished";
        copy.textContent = "Stripe did not confirm this charge. Return to checkout and try again.";
        return;
      }
      title.textContent = "Payment received";
      copy.textContent = `Paste this license into ${data.product === "learn" ? "Kang Learn" : data.product === "data" ? "Kang Data" : "Kang Office"}. Apps never take a card.`;
      license.value = data.license;
      box.hidden = false;
    })
    .catch((err) => {
      title.textContent = "Could not confirm payment";
      copy.textContent = err.message || "Open checkout again.";
    });

  document.getElementById("copy-license").addEventListener("click", async () => {
    if (!license.value) return;
    await navigator.clipboard.writeText(license.value);
    document.getElementById("copy-license").textContent = "Copied";
  });
})();
