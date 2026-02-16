<script lang="ts">
    import { quintOut } from "svelte/easing";
    import { fly } from "svelte/transition";
    import { createEventDispatcher, onDestroy } from "svelte";
    import GamePlayer from "./GamePlayer.svelte";
    import GameToolbar from "./GameToolbar.svelte";

    const dispatch = createEventDispatcher();

    export let game: {
        title: string;
        imageSrc: string;
        genre: string;
        link: string;
        core?: string;
        type?: string;
    };
    export let view: "grid" | "list";

    let isPlaying = false;
    let reloadKey = 0;
    let gameContainer: HTMLElement;
    let iframeSrc: string | null = null;

    // Helper to detect .swf links (case‑insensitive)
    const isSwf = (url: string) => url.toLowerCase().endsWith(".swf");
    // detect Game Boy Advance ROMs
    const isGba = (url: string) => url.toLowerCase().endsWith(".gba");
    // detect Game Boy / Game Boy Color ROMs – returns the appropriate emulator core
    const getGbCore = (url: string): "gb" | "gbc" => {
        const lower = url.toLowerCase();
        if (lower.endsWith(".gbc")) return "gbc";
        return "gb";
    };
    // also keep a simple boolean check for GB/GBC
    const isGb = (url: string) => {
        const lower = url.toLowerCase();
        return lower.endsWith(".gb") || lower.endsWith(".gbc");
    };

    function addToRecents(gameData) {
        try {
            const raw = localStorage.getItem("recentGames");
            let recents = raw ? JSON.parse(raw) : [];

            // Remove if exists
            recents = recents.filter((g) => g.title !== gameData.title);

            // Add to front
            recents.unshift({
                ...gameData,
                timestamp: new Date().toISOString(),
            });

            // Limit to 10
            if (recents.length > 10) recents = recents.slice(0, 10);

            localStorage.setItem("recentGames", JSON.stringify(recents));
        } catch (e) {
            console.error("Failed to save recent game", e);
        }
    }

    function handlePlay() {
        addToRecents(game);
        isPlaying = true;
        dispatch("play");
    }

    function handleClose() {
        isPlaying = false;
        showControlsModal = false;
        dispatch("close");
    }

    function handleFullscreen() {
        if (!gameContainer) return;
        if (!document.fullscreenElement) {
            gameContainer.requestFullscreen().catch((err) => {
                console.error(
                    `Error attempting to enable fullscreen: ${err.message}`,
                );
            });
        } else {
            document.exitFullscreen();
        }
    }

    function handleReload() {
        reloadKey++;
    }

    function getEmulatorCore(game: {
        link: string;
        core?: string;
    }): string | null {
        if (game.core) return game.core;
        if (isGba(game.link)) return "gba";
        if (isGb(game.link)) return getGbCore(game.link);
        return null;
    }

    function createEmulatorSrc(core: string, gameUrl: string) {
        const html = `<html><head><style>body,html{margin:0;padding:0;}</style></head><body><div style="width:100%;height:100%;max-width:100%"><div id="game"></div></div><script>EJS_player="#game";EJS_core="${core}";EJS_pathtodata="https://cdn.emulatorjs.org/stable/data/";EJS_gameUrl="${gameUrl}";<\/script><script src="https://cdn.emulatorjs.org/stable/data/loader.js"><\/script></body></html>`;
        const blob = new Blob([html], { type: "text/html" });
        return URL.createObjectURL(blob);
    }

    $: emulatorCore = getEmulatorCore(game);

    $: if (emulatorCore && game && isPlaying) {
        if (iframeSrc) URL.revokeObjectURL(iframeSrc);
        iframeSrc = createEmulatorSrc(emulatorCore, game.link);
    }

    onDestroy(() => {
        if (iframeSrc) URL.revokeObjectURL(iframeSrc);
    });
</script>

{#if isPlaying}
    <div class="game-wrapper" bind:this={gameContainer}>
        <GameToolbar
            on:close={handleClose}
            on:fullscreen={handleFullscreen}
            on:reload={handleReload}
        />
        <div class="game-content">
            {#key reloadKey}
                {#if isSwf(game.link)}
                    <iframe
                        title={game.title}
                        srcdoc={`<html lang="en"><head><meta charset="utf-8"/><meta http-equiv="x-ua-compatible" content="ie=edge"/><meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no"/></head><body><script src="https://unpkg.com/@ruffle-rs/ruffle"></script><object width="100%" height="100%"><param name="movie" value="${game.link}"><embed src="${game.link}" width="100%" height="100%"></object></body></html>`}
                        style="width:100%;height:100%;border:none;"
                        allow="pointer-lock; fullscreen; autoplay; gamepad; microphone"
                        allowfullscreen
                    ></iframe>
                {:else if emulatorCore && iframeSrc}
                    <iframe
                        title={game.title}
                        src={iframeSrc}
                        style="width:100%;height:100%;border:none;"
                        allow="pointer-lock; fullscreen; autoplay; gamepad; microphone"
                        allowfullscreen
                    ></iframe>
                {:else}
                    <GamePlayer link={game.link} on:close={handleClose} />
                {/if}
            {/key}
        </div>
    </div>
{:else if view === "grid"}
    <div class="game-detail-grid">
        <div
            class="image-container"
            in:fly={{ y: -20, duration: 500, easing: quintOut }}
        >
            <img src={game.imageSrc} alt={game.title} />
        </div>
        <div
            class="info"
            in:fly={{ x: 50, duration: 500, easing: quintOut, delay: 200 }}
        >
            <h2>{game.title}</h2>
            <p>{game.genre}</p>
            <div class="actions">
                <button class="play-button" on:click={handlePlay}>Play</button>
                <button class="back-button" on:click={() => dispatch("close")}
                    >Back</button
                >
            </div>
        </div>
    </div>
{:else}
    <div class="game-detail-list">
        <div class="header-row">
            <h2>{game.title}</h2>
            <button class="back-button-small" on:click={() => dispatch("close")}
                >Back</button
            >
        </div>
        <div class="content-row">
            <div class="image-container">
                <img src={game.imageSrc} alt={game.title} />
            </div>
            <div class="info">
                <p class="genre">{game.genre}</p>
                <div class="meta-row">
                    <span class="label">Status</span>
                    <span class="value ready">Ready</span>
                </div>
                <div class="meta-row">
                    <span class="label">Type</span>
                    <span class="value">{game.type || "Web Game"}</span>
                </div>
                <button class="play-button wide" on:click={handlePlay}
                    >Play</button
                >
            </div>
        </div>
    </div>
{/if}

<style>
    .game-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background-color: #000;
        position: relative;
    }

    .game-content {
        flex: 1;
        width: 100%;
        /* Ensure it takes remaining height */
        height: 0;
        position: relative;
    }

    .game-detail-grid {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 40px;
        width: 100%;
        height: 100%;
        color: var(--text-primary);
    }
    .game-detail-grid .image-container {
        max-width: 200px; /* Smaller container */
        width: 100%; /* Allow to shrink */
        border: 1px solid var(--border-color);
        padding: 5px;
        border-radius: 8px;
        background: var(--surface-color);
    }
    .game-detail-grid .image-container img {
        width: 100%;
        height: auto;
        max-height: 200px;
        object-fit: contain;
        border-radius: 4px;
        display: block;
    }
    .game-detail-grid .info {
        width: 40%;
    }

    .game-detail-list {
        padding: 20px;
        color: var(--text-primary);
    }

    .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 10px;
    }

    .content-row {
        display: flex;
        gap: 20px;
    }

    .game-detail-list .image-container {
        width: 200px;
        border: 1px solid var(--border-color);
        padding: 5px;
        border-radius: 8px;
        background: var(--surface-color);
    }
    .game-detail-list .image-container img {
        width: 100%;
        border-radius: 4px;
        display: block;
    }

    .game-detail-list .info {
        flex: 1;
        max-width: 400px;
    }

    h2 {
        font-size: 24px;
        margin: 0 0 10px 0;
        font-weight: 600;
    }
    p {
        font-size: 14px;
        margin-bottom: 20px;
        color: var(--text-secondary);
    }

    .meta-row {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid var(--border-subtle);
        padding: 8px 0;
        font-size: 14px;
    }

    .meta-row .label {
        color: var(--text-muted);
    }
    .meta-row .value {
        color: var(--text-primary);
    }
    .meta-row .value.ready {
        color: var(--accent-cyan);
    }

    .actions {
        display: flex;
        gap: 10px;
    }

    .play-button {
        background-color: var(--text-primary);
        color: var(--bg-color);
        border: 1px solid var(--text-primary);
        border-radius: 4px;
        padding: 8px 20px;
        font-size: 14px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
    }

    .play-button:hover {
        background-color: transparent;
        color: var(--text-primary);
    }

    .play-button.wide {
        width: 100%;
        margin-top: 20px;
    }

    .back-button {
        background-color: transparent;
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 8px 20px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .back-button:hover {
        border-color: var(--text-primary);
        color: var(--text-primary);
    }

    .back-button-small {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        padding: 4px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    }

    .back-button-small:hover {
        border-color: var(--text-primary);
        color: var(--text-primary);
    }
</style>
