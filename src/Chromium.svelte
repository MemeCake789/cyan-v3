<script lang="ts">
    import {
        createEventDispatcher,
        onDestroy,
        onMount,
        afterUpdate,
    } from "svelte";

    export let currentUrl = "";

    let inputUrl = "";
    let history: string[] = [];
    let historyIndex = -1;
    let iframeElement: HTMLIFrameElement | null;
    let iframeContainer: HTMLDivElement;
    let hasAcceptedWarning = false;
    let proxyType: "uv" | "scramjet" = "uv";
    let scramjet: any = null;
    let isProxyReady = false;

    const dispatch = createEventDispatcher();

    async function initProxy() {
        if (typeof window === "undefined") return;

        // Register Service Workers
        if ("serviceWorker" in navigator) {
            try {
                await navigator.serviceWorker.register("/sw.js", {
                    scope: "/",
                });
                console.log("Main SW registered");
            } catch (err) {
                console.error("Main SW registration failed:", err);
            }
        }

        // Initialize BareMux
        try {
            // @ts-ignore
            if (window.BareMux) {
                // @ts-ignore
                const connection = new BareMux.BareMuxConnection(
                    "/baremux/worker.js",
                );
                const wispUrl =
                    (location.protocol === "https:" ? "wss" : "ws") +
                    "://" +
                    location.host +
                    "/wisp/";
                // Defaulting to epoxy as in robux.js
                await connection.setTransport("/epoxy/index.mjs", [
                    { wisp: wispUrl },
                ]);
            }
        } catch (err) {
            console.error("BareMux init failed:", err);
        }

        // Initialize Scramjet
        try {
            // @ts-ignore
            if (window.$scramjetLoadController) {
                // @ts-ignore
                const { ScramjetController } = window.$scramjetLoadController();
                scramjet = new ScramjetController({
                    files: {
                        wasm: "/scram/scramjet.wasm.wasm",
                        all: "/scram/scramjet.all.js",
                        sync: "/scram/scramjet.sync.js",
                    },
                });
                await scramjet.init();
                console.log("Scramjet initialized");
            }
        } catch (err) {
            console.error("Scramjet init failed:", err);
        }

        isProxyReady = true;
    }

    async function loadScripts() {
        const scripts = [
            "/baremux/index.js",
            "/uv/uv.bundle.js",
            "/assets/js/uv/uv.config.js",
            "/scram/scramjet.all.js",
        ];

        for (const src of scripts) {
            await new Promise((resolve) => {
                const script = document.createElement("script");
                script.src = src;
                script.onload = resolve;
                script.onerror = resolve; // Continue even on error to try others
                document.head.appendChild(script);
            });
        }
    }

    onMount(async () => {
        await loadScripts();
        await initProxy();
        if (hasAcceptedWarning) {
            initializeChromium();
        }
    });

    function getProxiedUrl(url: string) {
        if (!url) return "";
        let targetUrl = url;

        // Basic URL validation/fixing
        if (!/^https?:\/\//i.test(targetUrl) && !targetUrl.includes(" ")) {
            if (targetUrl.includes(".")) {
                targetUrl = "https://" + targetUrl;
            } else {
                // fallback to search
                targetUrl = `https://duckduckgo.com/?q=${encodeURIComponent(targetUrl)}`;
            }
        }

        if (proxyType === "uv") {
            // @ts-ignore
            if (window.__uv$config) {
                // @ts-ignore
                return (
                    window.__uv$config.prefix +
                    window.__uv$config.encodeUrl(targetUrl)
                );
            }
        } else if (proxyType === "scramjet" && scramjet) {
            return scramjet.encodeUrl(targetUrl);
        }

        return targetUrl;
    }

    async function navigate(url: string, addToHistory = true) {
        if (!url) return;

        const proxied = getProxiedUrl(url);
        currentUrl = proxied;
        inputUrl = url;

        if (iframeElement) {
            iframeElement.src = proxied;
        }

        if (addToHistory) {
            history = history.slice(0, historyIndex + 1);
            history.push(url);
            historyIndex = history.length - 1;
        }

        dispatch("urlchange", { url });
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            navigate(inputUrl);
        }
    }

    function goBack() {
        if (historyIndex > 0) {
            historyIndex--;
            navigate(history[historyIndex], false);
        } else if (iframeElement) {
            try {
                iframeElement.contentWindow?.history.back();
            } catch (e) {
                console.warn("Cross-origin history access denied");
            }
        }
    }

    function goForward() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            navigate(history[historyIndex], false);
        } else if (iframeElement) {
            try {
                iframeElement.contentWindow?.history.forward();
            } catch (e) {
                console.warn("Cross-origin history access denied");
            }
        }
    }

    function refresh() {
        if (iframeElement) {
            iframeElement.contentWindow?.location.reload();
        } else if (historyIndex !== -1) {
            navigate(history[historyIndex], false);
        }
    }

    function acceptWarning() {
        hasAcceptedWarning = true;
    }

    function initializeChromium() {
        if (!iframeContainer || iframeElement) return;

        iframeElement = document.createElement("iframe");
        iframeElement.title = "Chromium Proxy";
        iframeElement.style.width = "100%";
        iframeElement.style.height = "100%";
        iframeElement.style.border = "none";
        iframeElement.style.background = "white";
        // Enable suggested features for better proxy compatibility
        iframeElement.setAttribute(
            "allow",
            "fullscreen; geolocation; microphone; camera;",
        );
        iframeContainer.appendChild(iframeElement);

        if (currentUrl) {
            iframeElement.src = currentUrl;
        } else {
            navigate("google.com");
        }
    }

    afterUpdate(() => {
        if (hasAcceptedWarning && !iframeElement) {
            initializeChromium();
        }
    });

    onDestroy(() => {
        if (iframeElement && iframeContainer) {
            iframeContainer.removeChild(iframeElement);
        }
    });

    export { goBack, goForward, refresh, navigate, inputUrl };
</script>

<div class="browser-container">
    {#if !hasAcceptedWarning}
        <div class="warning">
            <span class="material-symbols-outlined">warning</span>
            <h3>Proxy WIP</h3>
            <p>
                This proxy is a work-in-progress and may be blocked by some
                extensions.
            </p>
            <button on:click={acceptWarning}>Ok, Proceed</button>
        </div>
    {:else}
        <div class="iframe-wrapper" bind:this={iframeContainer}>
            {#if !currentUrl && !iframeElement}
                <div class="placeholder">
                    <span class="material-symbols-outlined">public</span>
                    <p>Enter a URL or search query to begin</p>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .browser-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        background: #000;
    }

    .warning {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #ccc;
        text-align: center;
    }

    .warning .material-symbols-outlined {
        font-size: 64px;
        margin-bottom: 20px;
        color: #ffcc00;
    }

    .warning h3 {
        margin: 0;
        font-size: 24px;
    }

    .warning p {
        margin: 10px 0 20px;
    }

    .warning button {
        padding: 10px 20px;
        border: 1px solid #555;
        background: #333;
        color: white;
        cursor: pointer;
        border-radius: 5px;
    }

    .iframe-wrapper {
        flex-grow: 1;
        position: relative;
    }

    .placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #555;
    }

    .placeholder .material-symbols-outlined {
        font-size: 64px;
        margin-bottom: 20px;
    }
</style>
