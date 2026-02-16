<script lang="ts">
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let isOpen = false;

    function close() {
        dispatch("close");
    }
</script>

{#if isOpen}
    <div class="modal-backdrop" on:click={close}>
        <div class="modal-content" on:click|stopPropagation>
            <div class="modal-header">
                <h2>Game Controls</h2>
                <button class="close-btn" on:click={close}>×</button>
            </div>

            <div class="modal-body">
                <h3>General</h3>
                <ul>
                    <li><strong>Fullscreen:</strong> Click the maximize icon in the toolbar.</li>
                    <li><strong>Pointer Lock:</strong> Click the game area to lock mouse. Press ESC to unlock.</li>
                </ul>

                <h3>Emulator (Game Boy / GBA)</h3>
                <div class="key-map">
                    <div class="key-row">
                        <span class="key">Z</span> <span>A Button</span>
                    </div>
                    <div class="key-row">
                        <span class="key">X</span> <span>B Button</span>
                    </div>
                    <div class="key-row">
                        <span class="key">Enter</span> <span>Start</span>
                    </div>
                    <div class="key-row">
                        <span class="key">Shift</span> <span>Select</span>
                    </div>
                    <div class="key-row">
                        <span class="key">Arrows</span> <span>D-Pad</span>
                    </div>
                     <div class="key-row">
                        <span class="key">Space</span> <span>Speed Up</span>
                    </div>
                </div>

                <h3>Web / Flash</h3>
                <p>Most web games use <strong>WASD</strong> or <strong>Arrow Keys</strong> for movement and <strong>Space</strong> or <strong>Click</strong> for actions.</p>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(2px);
    }

    .modal-content {
        background-color: #1a1a1a;
        border: 1px solid #333;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        color: #e0e0e0;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid #333;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
    }

    .close-btn {
        background: none;
        border: none;
        color: #888;
        font-size: 24px;
        cursor: pointer;
        padding: 0 8px;
        line-height: 1;
    }

    .close-btn:hover {
        color: #fff;
    }

    .modal-body {
        padding: 20px;
    }

    h3 {
        font-size: 16px;
        color: #8ab4f8; /* Use a nice blue for headers */
        margin-top: 0;
        margin-bottom: 10px;
    }

    h3:not(:first-child) {
        margin-top: 20px;
    }

    ul {
        margin: 0;
        padding-left: 20px;
        font-size: 14px;
        color: #ccc;
    }

    li {
        margin-bottom: 6px;
    }

    .key-map {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        font-size: 14px;
    }

    .key-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .key {
        display: inline-block;
        background-color: #333;
        border: 1px solid #444;
        border-radius: 4px;
        padding: 2px 8px;
        font-family: monospace;
        min-width: 20px;
        text-align: center;
        color: #fff;
        font-weight: bold;
    }

    p {
        font-size: 14px;
        color: #ccc;
        margin: 0;
    }
</style>
