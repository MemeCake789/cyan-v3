<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';

    export let currentUrl = "";
    
    let inputUrl = "";
    let history: string[] = [];
    let historyIndex = -1;
    let iframeElement: HTMLIFrameElement;

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

    onMount(() => {
        // Initial page or default
        if (!currentUrl) {
            navigate("google.com");
        }
    });

    // Expose methods for the title bar buttons
    export { goBack, goForward, refresh, navigate, inputUrl };

</script>

<div class="browser-container">
    <div class="iframe-wrapper">
        {#if currentUrl}
            <iframe 
                bind:this={iframeElement}
                src={currentUrl} 
                title="Chromium Proxy"
                frameborder="0"
            ></iframe>
        {:else}
            <div class="placeholder">
                <span class="material-symbols-outlined">public</span>
                <p>Enter a URL or search query to begin</p>
            </div>
        {/if}
    </div>
</div>

<style>
    .browser-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        background: #000;
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