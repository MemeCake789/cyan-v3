<script lang="ts">
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import EpoxyTransport from "@mercuryworkshop/epoxy-transport";

    export let currentUrl = "";

    let inputUrl = "https://search.brave.com";
    let iframeElement: HTMLIFrameElement | null = null;
    let iframeContainer: HTMLDivElement;
    let hasAcceptedWarning = false;
    let proxyReady = false;
    let transport: EpoxyTransport | null = null;
    let isLoading = false;

    const dispatch = createEventDispatcher();

    function formatUrl(url: string) {
        let finalUrl = url;
        const searchUrl = "https://search.brave.com/search?q=";

        if (finalUrl.startsWith("about:srcdoc")) return finalUrl;

        // if it looks like a search query (no dots, no slashes at start)
        if (
            !finalUrl.includes(".") &&
            !finalUrl.includes("/") &&
            !finalUrl.startsWith("http")
        ) {
            finalUrl = searchUrl + encodeURIComponent(finalUrl);
        } else if (
            !finalUrl.startsWith("http://") &&
            !finalUrl.startsWith("https://")
        ) {
            finalUrl = "https://" + finalUrl;
        }

        return finalUrl;
    }

    async function initProxyEngine() {
        if (proxyReady) return;
        try {
            const wispUrl = "wss://fastforwarder.org/wisp/";
            transport = new EpoxyTransport({ wisp: wispUrl });
            await transport.init();
            proxyReady = true;

            if (hasAcceptedWarning) {
                initializeChromium();
            }
        } catch (err) {
            console.error("Error setting up Epoxy proxy:", err);
        }
    }

    onMount(() => {
        initProxyEngine();
        window.addEventListener("message", handleIframeMessage);
    });

    onDestroy(() => {
        window.removeEventListener("message", handleIframeMessage);
        if (iframeElement && iframeContainer) {
            iframeContainer.removeChild(iframeElement);
            iframeElement = null;
        }
    });

    async function handleIframeMessage(event: MessageEvent) {
        if (!event.data) return;

        if (event.data.type === "navigation") {
            let url = event.data.url;
            if (url.includes("about:srcdoc")) {
                url = url.replace(/.*?about:srcdoc\??/, "");
                const base = new URL(currentUrl);
                url = new URL(url, base.origin + base.pathname).href;
            }

            // hard navigate if different
            if (
                url !== currentUrl &&
                url !== currentUrl + "/" &&
                currentUrl !== url + "/"
            ) {
                navigate(url);
            }
        } else if (event.data.type === "url-update") {
            // soft update: just change address bar, don't reload
            inputUrl = event.data.url;
            currentUrl = event.data.url;
        } else if (event.data.type === "fetch-request") {
            const { id, url, method, headers, body } = event.data;
            if (!transport) return;

            try {
                const headObj = new Headers();
                if (headers) {
                    Object.entries(headers).forEach(([k, v]) =>
                        headObj.set(k, v as string),
                    );
                }

                const response = await transport.request(
                    new URL(url),
                    method,
                    body,
                    headObj,
                );

                const respHeaders: Record<string, string> = {};
                if (response.headers) {
                    if (Array.isArray(response.headers)) {
                        response.headers.forEach(
                            ([k, v]) => (respHeaders[k] = v),
                        );
                    } else {
                        Object.entries(response.headers).forEach(
                            ([k, v]) => (respHeaders[k] = v as string),
                        );
                    }
                }

                // STRIP FRAME BREAKERS FROM FETCH
                delete respHeaders["x-frame-options"];
                if (respHeaders["content-security-policy"]) {
                    respHeaders["content-security-policy"] = respHeaders[
                        "content-security-policy"
                    ].replace(/frame-ancestors 'none'/g, "");
                }

                let bodyBuffer: ArrayBuffer | null = null;
                if (response.body) {
                    const resp = new Response(response.body);
                    bodyBuffer = await resp.arrayBuffer();
                }

                iframeElement?.contentWindow?.postMessage(
                    {
                        type: "fetch-response",
                        id,
                        status: response.status,
                        headers: respHeaders,
                        body: bodyBuffer,
                    },
                    "*",
                    bodyBuffer ? [bodyBuffer] : [],
                );
            } catch (err) {
                iframeElement?.contentWindow?.postMessage(
                    {
                        type: "fetch-response",
                        id,
                        error: String(err),
                    },
                    "*",
                );
            }
        }
    }

    function acceptWarning() {
        hasAcceptedWarning = true;
        if (proxyReady) {
            initializeChromium();
        }
    }

    function initializeChromium() {
        if (!iframeContainer || iframeElement || !proxyReady) return;

        iframeElement = document.createElement("iframe");
        iframeElement.title = "Chromium Proxy";
        iframeElement.style.width = "100%";
        iframeElement.style.height = "100%";
        iframeElement.style.border = "none";
        iframeElement.style.background = "#202124";
        iframeElement.setAttribute(
            "allow",
            "fullscreen; geolocation; microphone; camera;",
        );
        iframeElement.setAttribute(
            "sandbox",
            "allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation",
        );
        iframeContainer.appendChild(iframeElement);

        navigate(inputUrl);
    }

    $: if (
        hasAcceptedWarning &&
        iframeContainer &&
        !iframeElement &&
        proxyReady
    ) {
        initializeChromium();
    }

    function goBack() {
        try {
            iframeElement?.contentWindow?.history.back();
        } catch (e) {}
    }
    function goForward() {
        try {
            iframeElement?.contentWindow?.history.forward();
        } catch (e) {}
    }
    function refresh() {
        if (inputUrl) navigate(inputUrl);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") navigate(inputUrl);
    }

    async function navigate(url: string, redirectCount = 0) {
        if (redirectCount > 5) return;

        let finalUrl = formatUrl(url);
        inputUrl = finalUrl;
        currentUrl = finalUrl;

        if (!iframeElement || !transport) return;

        isLoading = true;
        if (redirectCount === 0) {
            iframeElement.srcdoc = `<html><body style="background:#202124; display: flex; align-items: center; justify-content: center; height: 100vh;"><h3 style="color:white; font-family:monospace;">loading ${finalUrl}...</h3></body></html>`;
        }

        try {
            const target = new URL(finalUrl);
            const response = await transport.request(
                target,
                "GET",
                null,
                new Headers({
                    "User-Agent": navigator.userAgent,
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                }),
                undefined,
            );

            const respHeaders = new Headers();
            if (response.headers) {
                if (Array.isArray(response.headers)) {
                    response.headers.forEach(([k, v]) => respHeaders.set(k, v));
                } else {
                    Object.entries(response.headers).forEach(([k, v]) =>
                        respHeaders.set(k, v),
                    );
                }
            }

            if (response.status >= 300 && response.status < 400) {
                const location = respHeaders.get("location");
                if (location) {
                    const nextUrl = new URL(location, finalUrl).href;
                    return navigate(nextUrl, redirectCount + 1);
                }
            }

            let htmlText = "";
            const contentType = respHeaders.get("content-type") || "";

            if (response.body instanceof Blob) {
                htmlText = await response.body.text();
            } else if (response.body instanceof ReadableStream) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    htmlText += decoder.decode(value, { stream: true });
                }
            } else {
                htmlText = new TextDecoder().decode(
                    await new Response(response.body).arrayBuffer(),
                );
            }

            if (!contentType.includes("text/html")) {
                const blob = new Blob([response.body], { type: contentType });
                const blobUrl = URL.createObjectURL(blob);
                htmlText = `<html><body style="margin:0; background:#202124; display:flex; align-items:center; justify-content:center; height:100vh;"><img src="${blobUrl}" style="max-width:100%; max-height:100%;"></body></html>`;
            } else {
                const baseTag = `<base href="${target.origin}${target.pathname}">`;

                // REFINED SHIM: Handle SPA navigation and soft URL updates
                const shimScript = `
                <script>
                    (function() {
                        const REAL_BASE = "${finalUrl}";
                        const PARENT = window.parent;
                        const resolve = (url) => {
                            try { return new URL(url, REAL_BASE).href; } catch(e) { return url; }
                        };

                        // Proxy Fetch
                        const originalFetch = window.fetch;
                        window.fetch = async (input, init) => {
                            const url = resolve(typeof input === 'string' ? input : input.url);
                            if (url.startsWith('http') && !url.includes(window.location.host)) {
                                const id = Math.random().toString(36).slice(2);
                                return new Promise((resolveFetch, rejectFetch) => {
                                    const handler = (e) => {
                                        if (e.data.type === 'fetch-response' && e.data.id === id) {
                                            window.removeEventListener('message', handler);
                                            if (e.data.error) rejectFetch(new Error(e.data.error));
                                            else resolveFetch(new Response(e.data.body, { status: e.data.status, headers: e.data.headers }));
                                        }
                                    };
                                    window.addEventListener('message', handler);
                                    PARENT.postMessage({ type: 'fetch-request', id, url, method: init?.method || 'GET', headers: init?.headers, body: init?.body }, '*');
                                });
                            }
                            return originalFetch(input, init);
                        };

                        // Proxy History: Don't reload on pushState, just update address bar
                        const originalPush = window.history.pushState;
                        const originalReplace = window.history.replaceState;

                        window.history.pushState = (state, title, url) => {
                            if (url) {
                                const resolved = resolve(url);
                                PARENT.postMessage({ type: 'url-update', url: resolved }, '*');
                            }
                            try { originalPush.apply(window.history, [state, title, url]); } catch(e) {}
                        };
                        window.history.replaceState = (state, title, url) => {
                            if (url) {
                                const resolved = resolve(url);
                                PARENT.postMessage({ type: 'url-update', url: resolved }, '*');
                            }
                            try { originalReplace.apply(window.history, [state, title, url]); } catch(e) {}
                        };

                        // Intercept Clicks
                        document.addEventListener('click', e => {
                            const link = e.target.closest('a');
                            if (link && link.href && !link.href.startsWith('javascript:')) {
                                const target = link.getAttribute('target');
                                if (target === '_blank') return;
                                setTimeout(() => {
                                    if (!e.defaultPrevented) {
                                        e.preventDefault();
                                        PARENT.postMessage({ type: 'navigation', url: resolve(link.getAttribute('href')) }, '*');
                                    }
                                }, 0);
                            }
                        }, true);

                        // Intercept Forms
                        document.addEventListener('submit', e => {
                            const form = e.target;
                            const method = (form.getAttribute('method') || 'GET').toUpperCase();
                            if (method === 'GET') {
                                setTimeout(() => {
                                    if (!e.defaultPrevented) {
                                        e.preventDefault();
                                        const url = new URL(form.getAttribute('action') || '', REAL_BASE);
                                        const formData = new FormData(form);
                                        for (const [key, value] of formData.entries()) {
                                            url.searchParams.set(key, value);
                                        }
                                        PARENT.postMessage({ type: 'navigation', url: url.href }, '*');
                                    }
                                }, 0);
                            }
                        }, true);
                    })();
                <\/script>`;

                // Remove CSP frame-ancestors to fix GitHub blocking
                // Since we are modifying the HTML string, we can't easily remove HTTP headers here
                // But we handle header stripping in handleIframeMessage for XHR/Fetch
                // The main doc headers are not stripped here because Epoxy returns response object
                // We need to ensure the browser doesn't see them if we are using srcdoc?
                // Actually srcdoc bypasses HTTP headers for the main frame because it's just a string!
                // The issue is likely meta tags or subsequent fetch requests.

                // Let's also strip meta tags that might block framing
                htmlText = htmlText.replace(
                    /<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi,
                    "",
                );
                htmlText = htmlText.replace(
                    /<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi,
                    "",
                );

                if (htmlText.includes("<head>")) {
                    htmlText = htmlText.replace(
                        "<head>",
                        `<head>${baseTag}${shimScript}`,
                    );
                } else {
                    htmlText = `${baseTag}${shimScript}${htmlText}`;
                }
            }

            iframeElement.srcdoc = htmlText;
        } catch (err) {
            console.error("Proxy fetch error:", err);
            iframeElement.srcdoc = `<html><body style="background:#202124; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;"><h3 style="color:#ff6b6b; font-family:monospace;">proxy error:<br/>${err}</h3></body></html>`;
        } finally {
            isLoading = false;
        }
    }

    export { goBack, goForward, refresh, navigate, inputUrl };
</script>

<div class="browser-container">
    {#if !hasAcceptedWarning}
        <div class="warning">
            <span class="material-symbols-outlined">warning</span>
            <h3>Proxy Warning</h3>
            <p>This is a beta build of a proxy, expect things to not work.</p>
            <button on:click={acceptWarning}>Ok, Proceed</button>
        </div>
    {:else}
        <div class="navbar">
            <div class="nav-controls">
                <button on:click={goBack} title="Back">
                    <span class="material-symbols-outlined">arrow_back</span>
                </button>
                <button on:click={goForward} title="Forward">
                    <span class="material-symbols-outlined">arrow_forward</span>
                </button>
                <button on:click={refresh} title="Refresh">
                    <span class="material-symbols-outlined">refresh</span>
                </button>
            </div>
            <div class="address-bar">
                <span class="material-symbols-outlined search-icon">search</span
                >
                <input
                    type="text"
                    bind:value={inputUrl}
                    on:keydown={handleKeydown}
                    placeholder="Search or enter address..."
                />
                {#if isLoading}
                    <div class="loader"></div>
                {/if}
            </div>
        </div>
        <div class="iframe-wrapper" bind:this={iframeContainer}></div>
    {/if}
</div>

<style>
    .browser-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        background: #202124;
    }

    .navbar {
        height: 48px;
        background: #2b2c2f;
        display: flex;
        align-items: center;
        padding: 0 12px;
        gap: 12px;
        border-bottom: 1px solid #3c4043;
    }

    .nav-controls {
        display: flex;
        gap: 4px;
    }

    .nav-controls button {
        background: transparent;
        border: none;
        color: #e8eaed;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s;
    }

    .nav-controls button:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .nav-controls button .material-symbols-outlined {
        font-size: 20px;
    }

    .address-bar {
        flex-grow: 1;
        height: 32px;
        background: #202124;
        border-radius: 16px;
        display: flex;
        align-items: center;
        padding: 0 12px;
        gap: 8px;
        border: 1px solid #3c4043;
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
    }

    .address-bar:focus-within {
        border-color: var(--accent-cyan);
        box-shadow: 0 0 0 2px rgba(80, 227, 194, 0.2);
    }

    .search-icon {
        font-size: 18px;
        color: #9aa0a6;
    }

    .address-bar input {
        flex-grow: 1;
        background: transparent;
        border: none;
        color: #e8eaed;
        font-family: var(--font-mono);
        font-size: 13px;
        outline: none;
    }

    .loader {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(80, 227, 194, 0.3);
        border-top-color: var(--accent-cyan);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
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
        color: var(--accent-cyan);
    }

    .warning p {
        margin: 10px 0 20px;
        font-family: var(--font-mono);
    }

    .warning button {
        padding: 10px 20px;
        border: 1px solid var(--border-color);
        background: #333;
        color: white;
        cursor: pointer;
        border-radius: 5px;
        font-family: var(--font-mono);
    }

    .warning button:hover {
        background: #444;
        border-color: var(--accent-cyan);
    }

    .iframe-wrapper {
        flex: 1;
        position: relative;
        min-height: 0;
        overflow: hidden;
    }

    .iframe-wrapper :global(iframe) {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
</style>
