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
    <GamePlayer link={game.link} on:close={handleClose} />
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
            <button class="back-button" on:click={() => dispatch("close")}>Back</button>
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
        width: 40%;
    }
    .game-detail-grid .image-container img {
        width: 100%;
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
