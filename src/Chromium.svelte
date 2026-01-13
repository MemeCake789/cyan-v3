<script lang="ts">
    import { createEventDispatcher, onDestroy, afterUpdate } from 'svelte';

    export let currentUrl = "";
    
    let inputUrl = "";
    let history: string[] = [];
    let historyIndex = -1;
    let iframeElement: HTMLIFrameElement | null;
    let iframeContainer: HTMLDivElement;
    let hasAcceptedWarning = false;

    const dispatch = createEventDispatcher();

    const PROXY_BASE = "http://sulfur-flax.vercel.app/rx?q=";

    function navigate(url: string, addToHistory = true) {
        if (!url) return;
        
        let targetUrl = url;
        // Basic URL validation/fixing
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.includes(' ')) {
             if (url.includes('.') ) {
                 targetUrl = 'https://' + url;
             } else {
                 // Search query
                 targetUrl = url;
             }
        }

        const fullProxyUrl = PROXY_BASE + encodeURIComponent(targetUrl);
        currentUrl = fullProxyUrl;
        inputUrl = targetUrl;

        if (iframeElement) {
            iframeElement.src = fullProxyUrl;
        }

        if (addToHistory) {
            // Remove any forward history if we're in the middle of the stack
            history = history.slice(0, historyIndex + 1);
            history.push(targetUrl);
            historyIndex = history.length - 1;
        }

        dispatch('urlchange', { url: targetUrl });
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            navigate(inputUrl);
        }
    }

    function goBack() {
        if (historyIndex > 0) {
            historyIndex--;
            navigate(history[historyIndex], false);
        }
    }

    function goForward() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            navigate(history[historyIndex], false);
        }
    }

    function refresh() {
        if (historyIndex !== -1) {
            navigate(history[historyIndex], false);
        }
    }
    
    function acceptWarning() {
        hasAcceptedWarning = true;
    }

    function initializeChromium() {
        if (!iframeContainer || iframeElement) return;

        iframeElement = document.createElement('iframe');
        iframeElement.title = "Chromium Proxy";
        iframeElement.style.width = "100%";
        iframeElement.style.height = "100%";
        iframeElement.style.border = "none";
        iframeElement.style.background = "white";
        iframeContainer.appendChild(iframeElement);

        // Initial page or default
        if (!currentUrl) {
            navigate("google.com");
        } else if (iframeElement) {
            iframeElement.src = currentUrl;
        }
    }

    afterUpdate(() => {
        if (hasAcceptedWarning) {
            initializeChromium();
        }
    });

    onDestroy(() => {
        if (iframeElement && iframeContainer) {
            iframeContainer.removeChild(iframeElement);
        }
    });

    // Expose methods for the title bar buttons
    export { goBack, goForward, refresh, navigate, inputUrl };

</script>

<div class="browser-container">
    {#if !hasAcceptedWarning}
        <div class="warning">
            <span class="material-symbols-outlined">warning</span>
            <h3>Proxy WIP</h3>
            <p>This proxy is a work-in-progress and may be blocked by some sites.</p>
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

    iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: white;
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