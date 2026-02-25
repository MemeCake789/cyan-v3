<script lang="ts">
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import EpoxyTransport from "@mercuryworkshop/epoxy-transport";

    export let currentUrl = "";

    let inputUrl = "";
    let iframeElement: HTMLIFrameElement | null = null;
    let iframeContainer: HTMLDivElement;
    let hasAcceptedWarning = false;
    let proxyReady = false;
    let transport: EpoxyTransport | null = null;
    let isLoading = false;

    const dispatch = createEventDispatcher();

    function formatUrl(url: string) {
        let finalUrl = url;
        const searchUrl = "https://www.google.com/search?q=";

        if (!finalUrl.includes(".")) {
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
            // always use wss: for about:blank and google sites compatibility
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
    });

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

        // initial load
        navigate("https://google.com");
    }

    $: if (
        hasAcceptedWarning &&
        iframeContainer &&
        !iframeElement &&
        proxyReady
    ) {
        initializeChromium();
    }

    onDestroy(() => {
        if (iframeElement && iframeContainer) {
            iframeContainer.removeChild(iframeElement);
            iframeElement = null;
        }
    });

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
        if (inputUrl) {
            navigate(inputUrl);
        }
    }

    async function navigate(url: string) {
        let finalUrl = formatUrl(url);
        inputUrl = finalUrl;
        currentUrl = finalUrl;

        if (!iframeElement || !transport) return;

        isLoading = true;
        iframeElement.srcdoc = `<html><body style="background:#202124; display: flex; align-items: center; justify-content: center; height: 100vh;"><h3 style="color:white; font-family:monospace;">loading ${finalUrl}...</h3></body></html>`;

        try {
            const target = new URL(finalUrl);
            const response = await transport.request(
                target,
                "GET",
                null,
                {},
                undefined,
            );

            let htmlText = "";
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
            } else if (typeof response.body === "string") {
                htmlText = response.body;
            } else if (response.body instanceof ArrayBuffer) {
                htmlText = new TextDecoder().decode(response.body);
            } else {
                // handle other types if necessary
                htmlText = new TextDecoder().decode(await new Response(response.body).arrayBuffer());
            }

            // inject base tag so relative links work
            const baseTag = `<base href="${target.origin}${target.pathname}">`;
            if (htmlText.includes("<head>")) {
                htmlText = htmlText.replace("<head>", `<head>${baseTag}`);
            } else {
                htmlText = `${baseTag}${htmlText}`;
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
            <h3>Proxy Engine Ready</h3>
            <p>
                using epoxy transport for about:blank compatibility.
            </p>
            <button on:click={acceptWarning}>Ok, Proceed</button>
        </div>
    {:else}
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
