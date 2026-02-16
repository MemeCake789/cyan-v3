<script lang="ts">
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    function toggleFullscreen() {
        dispatch("fullscreen");
    }

    function reload() {
        dispatch("reload");
    }

    function closeGame() {
        dispatch("close");
    }
</script>

<div class="game-toolbar">
    <div class="left-controls">
        <button
            on:click={closeGame}
            class="toolbar-btn close-btn"
            title="Close Game"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><line x1="18" y1="6" x2="6" y2="18"></line><line
                    x1="6"
                    y1="6"
                    x2="18"
                    y2="18"
                ></line></svg
            >
            <span>Close</span>
        </button>
    </div>

    <div class="right-controls">
        <button on:click={reload} class="toolbar-btn" title="Reload Game">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><path
                    d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"
                /></svg
            >
        </button>

        <button
            on:click={toggleFullscreen}
            class="toolbar-btn"
            title="Fullscreen"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><path
                    d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
                /></svg
            >
        </button>
    </div>
</div>

<style>
    .game-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #1a1a1a;
        padding: 8px 16px;
        border-bottom: 1px solid #333;
        color: #e0e0e0;
        height: 40px;
        box-sizing: border-box;
    }

    .right-controls {
        display: flex;
        gap: 12px;
    }

    .toolbar-btn {
        background: none;
        border: none;
        color: #aaa;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.2s;
    }

    .toolbar-btn:hover {
        background-color: #333;
        color: #fff;
    }

    .close-btn {
        color: #ff6b6b;
    }

    .close-btn:hover {
        background-color: rgba(255, 107, 107, 0.1);
        color: #ff8787;
    }

    .toolbar-btn span {
        font-size: 13px;
        font-weight: 500;
    }

    /* Hide text on small screens */
    @media (max-width: 600px) {
        .toolbar-btn span {
            display: none;
        }
    }
</style>
