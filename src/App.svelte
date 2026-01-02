<script lang="ts">
    import { onMount, onDestroy, tick } from "svelte";
    import { windows } from "./windows";
    import Window from "./Window.svelte";
    import Cyanide from "./Cyanide.svelte";
    import { flip } from "svelte/animate";

    let currentDate = new Date().toLocaleDateString();
    let currentTime = new Date().toLocaleTimeString();
    let interval;
    let windowContainer: HTMLDivElement;

    onMount(() => {
        interval = setInterval(() => {
            currentDate = new Date().toLocaleDateString();
            currentTime = new Date().toLocaleTimeString();
        }, 1000);
    });

    onDestroy(() => {
        clearInterval(interval);
    });

    async function openWindow(title: string) {
        const newWindow = {
            id: Date.now(),
            title,
            minimized: false,
        };
        windows.update((ws) => {
            const minimizedWindows = ws.map((w) => ({ ...w, minimized: true }));
            return [newWindow, ...minimizedWindows];
        });
        await tick();
        windowContainer.scrollTo({ top: 0, behavior: "smooth" });
    }

    function closeWindow(id: number) {
        windows.update((ws) => ws.filter((w) => w.id !== id));
    }

    function toggleMinimize(id: number) {
        windows.update((ws) =>
            ws.map((w) =>
                w.id === id ? { ...w, minimized: !w.minimized } : w,
            ),
        );
    }

    let fullscreenWindowId = null;

    function toggleFullscreen(id) {
        if (fullscreenWindowId === id) {
            fullscreenWindowId = null;
        } else {
            fullscreenWindowId = id;
        }
    }

    let draggedItem = null;

    function dragStart(item) {
        draggedItem = item;
    }

    function dragOver(item) {
        if (draggedItem === null || draggedItem === item) return;

        windows.update((ws) => {
            const draggedIndex = ws.findIndex((w) => w.id === draggedItem.id);
            const targetIndex = ws.findIndex((w) => w.id === item.id);

            const newWindows = [...ws];
            newWindows.splice(draggedIndex, 1);
            newWindows.splice(targetIndex, 0, draggedItem);
            return newWindows;
        });
    }

    function dragEnd() {
        draggedItem = null;
    }

    let gameTitle = "";
    let showBackButton = false;

    function handleBack() {
        // This is a bit of a hack, but it's the easiest way to communicate
        // back down to Cyanide.svelte without a store.
        const event = new CustomEvent("back");
        window.dispatchEvent(event);
    }
</script>

<main>
    <section class="left">
        <header class="header">
            <div class="section-title">header</div>
            <div class="date-time">
                <span>{currentDate}</span>
                <span>{currentTime}</span>
            </div>
            <div class="version">CYAN V3.0.1</div>
        </header>
        <nav class="nav">
            <button class="nav-button" on:click={() => openWindow("games")} title="Games">
                <span class="material-symbols-outlined">sports_esports</span
                >
                cyλnide
            </button>
            <button class="nav-button" on:click={() => openWindow("proxy")} title="Proxy">
                <span class="material-symbols-outlined">public</span>
                chrθmium
            </button>
            <button class="nav-button" on:click={() => openWindow("floride")} title="AI">
                <span class="material-symbols-outlined">smart_toy</span>
                °Fluoride
            </button>
            <button
                class="nav-button"
                on:click={() => openWindow("chromium")}
                title="Discord"
            >
                <span class="material-symbols-outlined">chat</span>
                sµlfur
            </button>
        </nav>
        <footer class="footer">
            <div class="section-title">status</div>
            footer
        </footer>
    </section>
    <section class="right">
        <div class="window-container" bind:this={windowContainer}>
            {#each $windows as window (window.id)}
                <div
                    class:fullscreen={window.id === fullscreenWindowId}
                    draggable="true"
                    on:dragstart={() => dragStart(window)}
                    on:dragover|preventDefault={() => dragOver(window)}
                    on:dragend={dragEnd}
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            dragStart(window);
                        }
                    }}
                    animate:flip={{ duration: 300 }}
                >
                    <Window
                        title={gameTitle || window.title}
                        minimized={window.id === fullscreenWindowId ? false : window.minimized}
                        fullscreen={window.id === fullscreenWindowId}
                        showBackButton={showBackButton}
                        on:close={() => closeWindow(window.id)}
                        on:toggleMinimize={() => toggleMinimize(window.id)}
                        on:fullscreen={() => toggleFullscreen(window.id)}
                        on:back={handleBack}
                    >
                        {#if window.title === 'games'}
                            <Cyanide on:gamestatechange={(e) => {
                                if (e.detail.title === 'games') {
                                    gameTitle = '';
                                    showBackButton = false;
                                } else {
                                    gameTitle = e.detail.title;
                                    showBackButton = e.detail.showBackButton;
                                }
                            }} />
                        {:else}
                            <p>Content for {window.title}</p>
                        {/if}
                    </Window>
                </div>
            {/each}
        </div>
    </section>
</main>



<style>
    @import url("https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap");

    :global(body, html) {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        font-family: "DM Mono", monospace;
    }

    main {
        display: flex;
        width: 100vw;
        height: 100vh;
        background-color: #000000;
        padding: 20px;
        box-sizing: border-box;
    }

    .left {
        display: flex;
        flex-direction: column;
        width: 30%;
        margin-right: 20px;
    }

    .right {
        width: 70%;
        border: 1px solid #555;
        border-radius: 10px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }

    .header,
    .nav,
    .footer {
        border: 1px solid #555;
        border-radius: 10px;
        color: white;
        position: relative;
    }

    .header {
        display: flex;
        flex-direction: column;
        height: 20%;
        margin-bottom: 10px;
        background-color: #000;
        align-items: flex-start;
        justify-content: space-between;
        padding: 20px;
    }

    .nav {
        flex-grow: 1;
        margin-bottom: 10px;
        background-color: #000;
        align-items: flex-start;
        padding: 20px;
    }

    .footer {
        height: 15%;
        background-color: #000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .window-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        height: 100%;
        overflow-y: auto;
    }

    .date-time {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        font-size: normal;
        color: #fff;
    }

    .version {
        color: #fff;
        font-size: normal;
    }

    .section-title {
        position: absolute;
        top: -0.8em;
        left: 20px;
        background-color: #000000;
        padding: 0 5px;
        color: #404040;
        font-size: normal;
    }

    .navbar {
        display: flex;
        flex-direction: column;
        width: 100%;
        margin-top: 10px;
    }

    .nav-button {
        display: flex;
        align-items: center;
        padding: 10px;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        margin-bottom: 10px;
        transition: background-color 0.3s;
        font-size: normal;
        background-color: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
    }

    .nav-button:hover {
        background-color: #333;
    }

    .nav-button .material-symbols-outlined {
        margin-right: 15px;
        font-size: 1.2em;
        font-weight: normal;
        font-family: "Material Symbols Outlined";
    }

    :global(.fullscreen) {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 1000;
        box-sizing: border-box;
        background: rgba(0, 0, 0, 0.8);
        transition: all 0.3s ease;
    }

    :global(.fullscreen .window) {
        height: 100%;
    }
</style>
