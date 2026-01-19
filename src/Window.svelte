<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { fly } from "svelte/transition";

    export let title: string;
    export let minimized = false;
    export let fullscreen = false;
    export let showBackButton = false;

    let showExitInfo = false;

    const dispatch = createEventDispatcher();

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape" && fullscreen) {
            dispatch("fullscreen");
        }
    }

    onMount(() => {
        window.addEventListener("keydown", handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener("keydown", handleKeydown);
    });

    $: if (fullscreen) {
        showExitInfo = true;
        setTimeout(() => {
            showExitInfo = false;
        }, 5000);
    }
</script>

<div class="window" class:minimized class:fullscreen>
    {#if fullscreen && showExitInfo}
        <div
            class="exit-info"
            in:fly={{ y: -50, duration: 500 }}
            out:fly={{ y: -50, duration: 500 }}
        >
            [esc] to exit fullscreen
        </div>
    {/if}
    <div
        class="title-bar"
        class:fullscreen
        draggable="true"
        on:dragstart|stopPropagation={() => dispatch("dragStart")}
        on:dragover|preventDefault|stopPropagation={() => dispatch("dragOver")}
        on:dragend|stopPropagation={() => dispatch("dragEnd")}
        role="button"
        tabindex="0"
    >
        <div class="drag-handle">::</div>
        <div 
            class="title"
            on:click={() => dispatch("toggleMinimize")}
            on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    dispatch("toggleMinimize");
                }
            }}
        >{title}</div>

        <div class="title-center">
            <slot name="title-center" />
        </div>

        <div class="controls">
            {#if showBackButton}
                <button
                    class="back-button"
                    on:click|stopPropagation={() => dispatch("back")}
                    >&lt; Back</button
                >
            {/if}
            <span
                class="material-symbols-outlined"
                on:click|stopPropagation={() => dispatch("fullscreen")}
                role="button"
                tabindex="0"
                on:keydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        dispatch("fullscreen");
                    }
                }}>fullscreen</span
            >
            <span
                class="material-symbols-outlined"
                on:click|stopPropagation={() => dispatch("close")}
                role="button"
                tabindex="0"
                on:keydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        dispatch("close");
                    }
                }}>close</span
            >
        </div>
    </div>
    <div class="content" class:hidden={minimized}>
        <slot />
    </div>
</div>

<style>
    .window {
        background: #0a0a0a;
        border: 1px solid #555;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: height 0.5s ease-in-out;
        height: 80vh;
        position: relative; /* Added for absolute positioning of exit-info */
    }

    .window.fullscreen {
        border-radius: 0;
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

    .title-bar.fullscreen {
        height: 30px;
        padding: 0 5px;
    }

    .title {
        color: #eee;
        font-weight: bold;
        flex-shrink: 0;
        min-width: 100px;
    }

    .title-bar.fullscreen .title {
        font-size: 0.8em;
    }

    .title-center {
        flex-grow: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0 20px;
    }

    .controls {
        display: flex;
        gap: 10px;
        margin-left: auto;
        flex-shrink: 0;
    }

    .controls .material-symbols-outlined {
        font-family: "Material Symbols Outlined";
        font-size: 20px;
        cursor: pointer;
        color: #eee;
    }

    .title-bar.fullscreen .controls .material-symbols-outlined {
        font-size: 16px;
    }

    .content {
        color: #eee;
        flex-grow: 1;
        background: #1a1a1a;
        overflow-y: auto;
        transition:
            padding 0.3s ease-out,
            opacity 0.2s ease-out;
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
        flex-shrink: 0;
    }

    .title-bar.fullscreen .drag-handle {
        font-size: 16px;
        margin-right: 5px;
    }

    .exit-info {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-family: "monospace", monospace;
        z-index: 1001; /* Ensure it's above other content */
    }

    .back-button {
        background-color: #222;
        color: #e0e0e0;
        border: 1px solid #444;
        border-radius: 20px;
        padding: 2px 8px;
        cursor: pointer;
        font-family: "monospace", monospace;
        margin-right: 10px;
    }
</style>
