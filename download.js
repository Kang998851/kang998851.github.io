(() => {
  const cards = document.querySelectorAll("[data-download-app]");
  if (!cards.length) return;

  const manifestUrl = new URL("downloads/manifest.json", document.baseURI);

  fetch(manifestUrl.href, { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((manifest) => {
      if (!manifest?.apps?.length) return;
      const byId = new Map(manifest.apps.map((app) => [app.id, app]));
      cards.forEach((card) => {
        const app = byId.get(card.dataset.downloadApp);
        const note = card.querySelector("[data-download-note]");
        const macBtn = card.querySelector("[data-download-mac]");
        const winBtn = card.querySelector("[data-download-win]");
        const mac = app?.platforms?.["mac-arm64"];
        if (mac && macBtn && (mac.url || mac.file)) {
          macBtn.href = mac.url || new URL(`downloads/${mac.file}`, document.baseURI).href;
          macBtn.removeAttribute("aria-disabled");
          macBtn.classList.remove("is-disabled");
          if (note) {
            note.textContent = `Version ${app.version} · Mac (Apple silicon) · ${formatSize(mac.size)}`;
          }
        } else if (note) {
          note.textContent = "Mac build is not published yet.";
        }
        if (winBtn) {
          winBtn.textContent = "Windows — coming soon";
        }
      });
    })
    .catch(() => {
      cards.forEach((card) => {
        const note = card.querySelector("[data-download-note]");
        if (note) note.textContent = "Could not load download links. Refresh the page.";
      });
    });

  function formatSize(bytes) {
    if (!bytes) return "";
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  }
})();
