<script lang="ts">
    import { quintOut } from "svelte/easing";
    import { fly } from "svelte/transition";
    import { createEventDispatcher } from "svelte";
    import GamePlayer from "./GamePlayer.svelte";

    const dispatch = createEventDispatcher();

    export let game: {
        title: string;
        imageSrc: string;
        genre: string;
        link: string;
    };
    export let view: "grid" | "list";

    let isPlaying = false;

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

    function handlePlay() {
        isPlaying = true;
        dispatch("play");
    }

    function handleClose() {
        isPlaying = false;
        dispatch("close");
    }
</script>

{#if isPlaying}
    {#if isSwf(game.link)}
        <iframe
            srcdoc={`<html lang="en"><head><meta charset="utf-8"/><meta http-equiv="x-ua-compatible" content="ie=edge"/><meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no"/></head><body><script src="https://unpkg.com/@ruffle-rs/ruffle"></script><object width="100%" height="100%"><param name="movie" value="${game.link}"><embed src="${game.link}" width="100%" height="100%"></object></body></html>`}
            style="width:100%;height:100%;border:none;"
        ></iframe>
    {:else if isGba(game.link)}
        <iframe
            srcdoc={`<html><head><style>body,html{margin:0;padding:0;}</style></head><body><div style="width:100%;height:100%;max-width:100%"><div id="game"></div></div><script>EJS_player="#game";EJS_core="gba";EJS_pathtodata="https://cdn.emulatorjs.org/stable/data/";EJS_gameUrl="${game.link}";</script><script src="https://cdn.emulatorjs.org/stable/data/loader.js"></script></body></html>`}
            style="width:100%;height:100%;border:none;"
        ></iframe>
    {:else if isGb(game.link)}
        <iframe
            srcdoc={`<html><head><style>body,html{margin:0;padding:0;}</style></head><body><div style="width:100%;height:100%;max-width:100%"><div id="game"></div></div><script>EJS_player="#game";EJS_core="${getGbCore(game.link)}";EJS_pathtodata="https://cdn.emulatorjs.org/stable/data/";EJS_gameUrl="${game.link}";</script><script src="https://cdn.emulatorjs.org/stable/data/loader.js"></script></body></html>`}
            style="width:100%;height:100%;border:none;"
        ></iframe>
    {:else}
        <GamePlayer link={game.link} on:close={handleClose} />
    {/if}
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
            <button class="play-button" on:click={handlePlay}>> Play</button>
            <button class="back-button" on:click={() => dispatch("close")}
                >Back</button
            >
        </div>
    </div>
{:else}
    <div class="game-detail-list">
        <div class="image-container">
            <img src={game.imageSrc} alt={game.title} />
        </div>
        <div class="info">
            <h2>{game.title}</h2>
            <p>{game.genre}</p>
            <button class="play-button" on:click={handlePlay}>> Play</button>
        </div>
    </div>
{/if}

<style>
    .game-detail-grid {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 40px;
        width: 100%;
        height: 100%;
    }
    .game-detail-grid .image-container {
        max-width: 200px; /* Smaller container */
        width: 100%; /* Allow to shrink */
    }
    .game-detail-grid .image-container img {
        width: 100%; /* Make image responsive within its container */
        height: auto; /* Maintain aspect ratio */
        max-height: 200px; /* Limit image height */
        object-fit: contain; /* Ensure the image fits within the bounds */
        border-radius: 12px;
    }
    .game-detail-grid .info {
        width: 40%;
    }

    .game-detail-list {
        padding: 20px;
    }
    .game-detail-list .image-container {
        width: 100%;
        margin-bottom: 20px;
    }
    .game-detail-list .image-container img {
        width: 100%;
        border-radius: 12px;
    }

    h2 {
        font-size: 2em;
        margin-bottom: 10px;
    }
    p {
        font-size: 1.2em;
        margin-bottom: 20px;
    }
    .play-button {
        background-color: #e0e0e0;
        color: #0d0d0d;
        border: none;
        border-radius: 20px;
        padding: 10px 20px;
        font-size: 1em;
        cursor: pointer;
        margin-right: 10px;
    }
    .back-button {
        background-color: transparent;
        color: #e0e0e0;
        border: 1px solid #e0e0e0;
        border-radius: 20px;
        padding: 10px 20px;
        font-size: 1em;
        cursor: pointer;
    }
</style>
