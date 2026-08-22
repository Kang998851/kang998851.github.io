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
        const win = app?.platforms?.["win-x64"];
        if (mac && macBtn && (mac.url || mac.file)) {
          macBtn.href = mac.url || new URL(`downloads/${mac.file}`, document.baseURI).href;
          macBtn.removeAttribute("aria-disabled");
          macBtn.classList.remove("is-disabled");
        }
        if (win && winBtn && (win.url || win.file)) {
          winBtn.href = win.url || new URL(`downloads/${win.file}`, document.baseURI).href;
          winBtn.textContent = "Download for Windows";
          winBtn.removeAttribute("aria-disabled");
          winBtn.classList.remove("is-disabled");
        } else if (winBtn) {
          winBtn.textContent = "Windows — coming soon";
        }
        if (note && app) {
          const parts = [`Version ${app.version}`];
          if (win?.size) parts.push(`Windows · ${formatSize(win.size)}`);
          if (mac?.size) parts.push(`Mac · ${formatSize(mac.size)}`);
          if (parts.length > 1) {
            note.textContent = parts.join(" · ");
          } else {
            note.textContent = "Downloads are not published yet.";
          }
        } else if (note) {
          note.textContent = "Downloads are not published yet.";
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
