<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let title: string;
    export let minimized = false;

    const dispatch = createEventDispatcher();
</script>

<div class="window" class:minimized>
    <div class="title-bar" on:click={() => dispatch("toggleMinimize")}>
        <div class="drag-handle">::</div>
        <div class="title">{title}</div>
        <div class="controls">
            <span
                class="material-symbols-outlined"
                on:click|stopPropagation={() => dispatch("fullscreen")}
                >fullscreen</span
            >
            <span
                class="material-symbols-outlined"
                on:click|stopPropagation={() => dispatch("close")}>close</span
            >
        </div>
    </div>
    <div class="content" class:hidden={minimized}>
        <slot />
    </div>
</div>

<style>
    .window {
        background: #222;
        border: 1px solid #555;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: height 0.5s ease-in-out;
        height: 80vh;
    }

    .minimized {
        height: 50px;
    }

    .title-bar {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        background: #333;
        padding: 0 10px;
        cursor: pointer;
        height: 50px;
        flex-shrink: 0;
    }

    .title {
        color: #eee;
        font-weight: bold;
    }

    .controls {
        display: flex;
        gap: 10px;
        margin-left: auto;
    }

    .controls .material-symbols-outlined {
        font-family: "Material Symbols Outlined";
        font-size: 20px;
        cursor: pointer;
        color: #eee;
    }

    .content {
        padding: 20px;
        color: #eee;
        flex-grow: 1;
        background: #1a1a1a;
        overflow-y: auto;
        transition: padding 0.3s ease-out, opacity 0.2s ease-out;
        opacity: 1;
    }

    .content.hidden {
        flex-grow: 0;
        height: 0;
        padding-top: 0;
        padding-bottom: 0;
        overflow: hidden;
        opacity: 0;
    }

    .drag-handle {
        color: #eee;
        margin-right: 15px;
        cursor: grab;
        font-family: monospace;
        font-size: 20px;
    }
</style>
