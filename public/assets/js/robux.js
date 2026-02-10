const { ScramjetController } = $scramjetLoadController();
const bareUrl = location.origin + "/bare/";
const scramjet = new ScramjetController({
  files: {
    wasm: "/scram/scramjet.wasm.wasm",
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js",
  },
});

(async () => {
  if (!navigator.serviceWorker) return;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => console.log("SW registered"))
      .catch((err) => console.error("SW failed", err));
  }

  if (!window.__scramjetReady) {
    await scramjet.init();
    window.__scramjetReady = true;
  }
})();
const LOCK_PATHS = {
  secure: `
    M6 10V8a6 6 0 1 1 12 0v2
    M4 10h16v10H4z
  `,
  insecure: `
    M18 10V8a6 6 0 1 0-12 0
    M4 10h16v10H4z
  `,
};
function isInternalPage(url) {
  if (!url) return true;
  return (
    url === "about:blank" ||
    url === "/new.html" ||
    url.startsWith(location.origin)
  );
}

const lockPath = document.getElementById("lock-body");

function setLockState(state) {
  siteStatus.dataset.state = state;

  if (state === "secure") {
    lockPath.setAttribute("d", LOCK_PATHS.secure);
  }

  if (state === "insecure") {
    lockPath.setAttribute("d", LOCK_PATHS.insecure);
  }
}

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
const wispUrl =
  (location.protocol === "https:" ? "wss" : "ws") +
  "://" +
  location.host +
  "/wisp/";

async function setTransport(transportsel) {
  switch (transportsel) {
    case "epoxy":
      await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
      break;
    case "libcurl":
      await connection.setTransport("/libcurl/index.mjs", [
        { websocket: wispUrl },
      ]);
      break;
    default:
      await connection.setTransport("/bareasmodule/index.mjs", [bareUrl]);
      break;
  }
}

setTransport("epoxy");

const tabsBar = document.getElementById("tabs");
const views = document.getElementById("views");
const urlInput = document.getElementById("url");
const siteStatus = document.getElementById("site-status");

let tabs = [];
let activeTab = null;

function decodeProxiedUrl(href) {
  try {
    if (href.startsWith(__uv$config.prefix)) {
      return __uv$config.decodeUrl(href.slice(__uv$config.prefix.length));
    }
    if (href.includes("/scramjet/")) {
      return scramjet.decodeUrl(href);
    }
  } catch {}
  return null;
}

function setActiveTab(tab) {
  activeTab = tab;

  tabs.forEach((t) => {
    t.tabEl.classList.toggle("active", t === tab);
    t.iframe.classList.toggle("active", t === tab);
  });

  urlInput.value = tab.rawUrl || "";
  urlInput.focus();
  urlInput.select();

  if (!tab.rawUrl || tab.iframe.src.includes("/new.html")) {
    siteStatus.dataset.state = "secure";
    if (lockPath) {
      lockPath.setAttribute("d", LOCK_PATHS.secure);
    }
  } else {
    const state = tab.rawUrl.startsWith("https:") ? "secure" : "insecure";
    siteStatus.dataset.state = state;
    if (lockPath) {
      lockPath.setAttribute("d", LOCK_PATHS[state]);
    }
  }
}
function resolveCloakedUrl(url) {
  if (!url.startsWith("cloaked://")) return null;
  const page = url.replace("cloaked://", "").toLowerCase();
  switch (page) {
    case "games":
      return "/g.html";
    case "settings":
      return "/settings.html";
    case "newtab":
      return "/new.html";
    case "ai":
      return "/ai.html";
    case "movies":
      return "/m.html";

    default:
      return null;
  }
}

function createTab(rawUrl = "") {
  const iframe = document.createElement("iframe");
  iframe.className = "view";

  const cloaked = resolveCloakedUrl(rawUrl);
  iframe.src = "/new.html";

  views.appendChild(iframe);

  const tabEl = document.createElement("div");
  tabEl.className = "tab";
  tabEl.innerHTML = `<span class="title">New Tab</span><button class="close">×</button>`;
  tabsBar.insertBefore(tabEl, document.getElementById("new-tab"));

  const tab = { iframe, tabEl, rawUrl };
  tabs.push(tab);

  tabEl.addEventListener("click", () => setActiveTab(tab));
  tabEl.querySelector(".close").addEventListener("click", (e) => {
    e.stopPropagation();
    tabEl.classList.add("closing");
    setTimeout(() => {
      iframe.remove();
      tabEl.remove();
      tabs = tabs.filter((t) => t !== tab);
      if (activeTab === tab && tabs.length) setActiveTab(tabs[tabs.length - 1]);
    }, 140);
  });

  iframe.addEventListener("load", () => {
    if (tab !== activeTab) return;

    const path = iframe.contentWindow.location.pathname;

    if (path.endsWith("/new.html")) {
      tab.rawUrl = "";
      urlInput.value = "";
      siteStatus.dataset.state = "secure";
      tab.tabEl.querySelector(".title").textContent = "New Tab";
      return;
    }

    if (path.endsWith("/g.html")) {
      urlInput.value = "cloaked://games";
      tab.rawUrl = "cloaked://games";
      siteStatus.dataset.state = "secure";
      tab.tabEl.querySelector(".title").textContent = "Games";
      return;
    }

    if (path.endsWith("/settings.html")) {
      urlInput.value = "cloaked://settings";
      tab.rawUrl = "cloaked://settings";
      siteStatus.dataset.state = "secure";
      tab.tabEl.querySelector(".title").textContent = "Settings";
      return;
    }

    if (path.endsWith("/ai.html")) {
      urlInput.value = "cloaked://ai";
      tab.rawUrl = "cloaked://ai";
      siteStatus.dataset.state = "secure";
      tab.tabEl.querySelector(".title").textContent = "AI";
      return;
    }

    if (path.endsWith("/m.html")) {
      urlInput.value = "cloaked://movies";
      tab.rawUrl = "cloaked://movies";
      siteStatus.dataset.state = "secure";
      tab.tabEl.querySelector(".title").textContent = "Movies";
      return;
    }

    try {
      const proxied = iframe.contentWindow.location.href;
      const real = decodeProxiedUrl(proxied);

      if (real) {
        tab.rawUrl = real;
        urlInput.value = real;
        tab.tabEl.querySelector(".title").textContent = new URL(real).hostname;
        siteStatus.dataset.state = real.startsWith("https:")
          ? "secure"
          : "insecure";
      } else {
        const current = iframe.contentWindow.location.href;
        tab.rawUrl = current;
        urlInput.value = current;
        tab.tabEl.querySelector(".title").textContent = new URL(
          current
        ).hostname;
        siteStatus.dataset.state = current.startsWith("https:")
          ? "secure"
          : "insecure";
      }
    } catch {
      siteStatus.dataset.state = "insecure";
    }
  });

  setActiveTab(tab);
  return tab;
}

async function navigate(url) {
  if (!activeTab) return;

  const displayUrl = url.trim();
  activeTab.rawUrl = displayUrl;
  urlInput.value = displayUrl;

  siteStatus.dataset.state = "loading";

  const cloaked = resolveCloakedUrl(displayUrl);

  try {
    let title;
    if (cloaked) {
      title = displayUrl.replace("cloaked://", "");
    } else {
      let loadUrl = displayUrl;
      if (!/^https?:\/\//i.test(loadUrl)) loadUrl = "https://" + loadUrl;
      title = new URL(loadUrl).hostname;
    }
    activeTab.tabEl.querySelector(".title").textContent = title;
  } catch {
    activeTab.tabEl.querySelector(".title").textContent = displayUrl;
  }

  if (cloaked) {
    activeTab.iframe.src = cloaked;
  } else {
    await setTransport(document.getElementById("trans").value);
    let final;
    if (document.getElementById("proxysel").value === "uv") {
      final = __uv$config.prefix + __uv$config.encodeUrl(displayUrl);
    } else {
      final = scramjet.encodeUrl(displayUrl);
    }
    activeTab.iframe.src = final;
  }
}

document.getElementById("idk").addEventListener("submit", async (e) => {
  e.preventDefault();
  const inputUrl = urlInput.value.trim();

  if (inputUrl.startsWith("cloaked://")) {
    navigate(inputUrl);
    urlInput.blur();
    return;
  }

  const fixed = await search(inputUrl);
  navigate(fixed);
  urlInput.blur();
});

document.getElementById("reload").addEventListener("click", () => {
  if (!activeTab) return;
  siteStatus.dataset.state = "loading";
  activeTab.iframe.contentWindow.location.reload();
});

document.getElementById("back").addEventListener("click", () => {
  try {
    activeTab?.iframe.contentWindow.history.back();
  } catch {}
});

document.getElementById("forward").addEventListener("click", () => {
  try {
    activeTab?.iframe.contentWindow.history.forward();
  } catch {}
});

document.getElementById("new-tab").addEventListener("click", () => {
  createTab();
});

createTab();

window.addEventListener("message", async (e) => {
  if (!e.data || e.data.type !== "navigate") return;

  const url = e.data.url.trim();

  if (url.startsWith("cloaked://")) {
    navigate(url);
  } else {
    const fixed = await search(url);
    navigate(fixed);
  }
});
