const APPS = [
  {
    id: "learn",
    name: "Kang Learn",
    kicker: "Learn",
    blurb: "导入资料，按天闯关。",
    mark: "L",
    mac: "Kang-Learn-mac.zip",
    win: "Kang-Learn-win.zip",
  },
  {
    id: "office",
    name: "Kang Office",
    kicker: "Office",
    blurb: "纪要、周报、报价、待办。",
    mark: "O",
    mac: "Kang-Office-mac.zip",
    win: "Kang-Office-win.zip",
  },
  {
    id: "data",
    name: "Kang Data",
    kicker: "Data",
    blurb: "清洗、分类、导出。",
    mark: "D",
    mac: "Kang-Data-mac.zip",
    win: "Kang-Data-win.zip",
  },
];

function isMac() {
  return /Mac|iPhone|iPad/.test(navigator.platform) || /Mac OS X/.test(navigator.userAgent);
}

function fileFor(app) {
  return isMac() ? app.mac : app.win;
}

function abs(href) {
  return new URL(href, document.baseURI).href;
}

function save(href, name) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function mountInstall(root, base) {
  root.innerHTML = APPS.map((app) => {
    const file = fileFor(app);
    const href = `${base}${file}`;
    return `
      <article class="install-row" data-app="${app.id}">
        <p class="tag">${app.kicker}</p>
        <h3>${app.name}</h3>
        <p>${app.blurb}</p>
        <div class="install-stage" aria-label="把 ${app.name} 拖到文件夹下载">
          <button type="button" class="app-icon" draggable="true" data-href="${href}" data-name="${file}" aria-label="拖动 ${app.name}">
            <span class="app-mark">${app.mark}</span>
            <span class="app-label">${app.name}</span>
          </button>
          <div class="install-arrow" aria-hidden="true"><span></span></div>
          <button type="button" class="desk-folder" data-href="${href}" data-name="${file}" aria-label="放到桌面，下载 ${app.name}">
            ${folderSvg()}
            <span>桌面</span>
          </button>
        </div>
        <p class="install-caption">按住左边图标，拖进右边文件夹。软件会下载到本机。</p>
      </article>
    `;
  }).join("");

  root.querySelectorAll(".app-icon").forEach(bindIcon);
  root.querySelectorAll(".desk-folder").forEach(bindFolder);
}

function bindIcon(icon) {
  icon.addEventListener("dragstart", (event) => {
    const href = abs(icon.dataset.href);
    const name = icon.dataset.name;
    event.dataTransfer.setData("DownloadURL", `application/zip:${name}:${href}`);
    event.dataTransfer.setData("text/uri-list", href);
    event.dataTransfer.setData("text/plain", href);
    event.dataTransfer.effectAllowed = "copy";
    document.body.classList.add("is-dragging");
    icon.closest(".install-row")?.classList.add("is-dragging");
  });
  icon.addEventListener("dragend", () => {
    document.body.classList.remove("is-dragging");
    icon.closest(".install-row")?.classList.remove("is-dragging");
    document.querySelectorAll(".desk-folder.is-over").forEach((el) => el.classList.remove("is-over"));
  });
  icon.addEventListener("click", () => save(abs(icon.dataset.href), icon.dataset.name));
}

function bindFolder(folder) {
  folder.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    folder.classList.add("is-over");
  });
  folder.addEventListener("dragleave", () => folder.classList.remove("is-over"));
  folder.addEventListener("drop", (event) => {
    event.preventDefault();
    folder.classList.remove("is-over");
    save(abs(folder.dataset.href), folder.dataset.name);
  });
  folder.addEventListener("click", () => save(abs(folder.dataset.href), folder.dataset.name));
}

function folderSvg() {
  return `<svg viewBox="0 0 64 52" width="64" height="52" aria-hidden="true"><path fill="currentColor" d="M6 10h18l4 6h30a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6z"/></svg>`;
}

const root = document.querySelector("[data-install]");
if (root) mountInstall(root, root.getAttribute("data-base") || "./");
