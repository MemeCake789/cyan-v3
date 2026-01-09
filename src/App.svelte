<script lang="ts">
    import { onMount, onDestroy, tick } from "svelte";
    import { windows } from "./windows";
    import Window from "./Window.svelte";
    import Cyanide from "./Cyanide.svelte";
    import Flouride from "./Flouride.svelte";
    import Sulfur from "./Sulfur.svelte";
    import Chromium from "./Chromium.svelte";
    import { flip } from "svelte/animate";

    let currentDate = new Date().toLocaleDateString();
    let currentTime = new Date().toLocaleTimeString();
    let interval;
    let windowContainer: HTMLDivElement;

    // Local state for chromium instances to bridge the slot to the component
    let chromiumStates = {};

    onMount(() => {
        interval = setInterval(() => {
            currentDate = new Date().toLocaleDateString();
            currentTime = new Date().toLocaleTimeString();
        }, 1000);
    });

    onDestroy(() => {
        clearInterval(interval);
    });

    async function openWindow(type: string) {
        const id = Date.now();
        const newWindow = {
            id,
            type,
            title: type, // Original title/type
            displayTitle: type === 'proxy' ? 'chrθmium' : type, // Title currently displayed in the bar
            minimized: false,
            showBackButton: false,
            persona: 'cyan', // Add persona state
        };

        if (type === 'proxy') {
            chromiumStates[id] = {
                inputUrl: 'google.com',
                component: null
            };
        }

        windows.update((ws) => {
            const minimizedWindows = ws.map((w) => ({ ...w, minimized: true }));
            return [newWindow, ...minimizedWindows];
        });
        await tick();
        windowContainer.scrollTo({ top: 0, behavior: "smooth" });
    }

    function closeWindow(id: number) {
        windows.update((ws) => ws.filter((w) => w.id !== id));
        if (chromiumStates[id]) {
            delete chromiumStates[id];
        }
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

    function handleBack(id: number) {
        const event = new CustomEvent(`back-${id}`);
        window.dispatchEvent(event);
    }

    function updateWindowState(id: number, detail: { title: string, showBackButton: boolean }) {
        windows.update(ws => ws.map(w => {
            if (w.id === id) {
                return {
                    ...w,
                    displayTitle: detail.title === 'games' ? w.type : detail.title,
                    showBackButton: detail.showBackButton
                };
            }
            return w;
        }));
    }

    function handleChromiumUrlChange(id, url) {
        if (chromiumStates[id]) {
            chromiumStates[id].inputUrl = url;
        }
    }

    function navigateChromium(id) {
        if (chromiumStates[id] && chromiumStates[id].component) {
            chromiumStates[id].component.navigate(chromiumStates[id].inputUrl);
        }
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
                on:click={() => openWindow("sulfur")}
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
                        title={window.displayTitle}
                        minimized={window.id === fullscreenWindowId ? false : window.minimized}
                        fullscreen={window.id === fullscreenWindowId}
                        showBackButton={window.showBackButton}
                        on:close={() => closeWindow(window.id)}
                        on:toggleMinimize={() => toggleMinimize(window.id)}
                        on:fullscreen={() => toggleFullscreen(window.id)}
                        on:back={() => handleBack(window.id)}
                        showPersonaSelector={window.type === 'floride'}
                        bind:selectedPersona={window.persona}
                    >
                        <svelte:fragment slot="title-center">
                            {#if window.type === 'proxy'}
                                <div class="url-bar-container">
                                    <button class="nav-btn" on:click={() => chromiumStates[window.id].component?.goBack()}>
                                        <span class="material-symbols-outlined">arrow_back</span>
                                    </button>
                                    <button class="nav-btn" on:click={() => chromiumStates[window.id].component?.goForward()}>
                                        <span class="material-symbols-outlined">arrow_forward</span>
                                    </button>
                                    <input 
                                        type="text" 
                                        class="url-input" 
                                        bind:value={chromiumStates[window.id].inputUrl}
                                        on:keydown={(e) => e.key === 'Enter' && navigateChromium(window.id)}
                                        placeholder="Search or enter URL"
                                    />
                                    <button class="nav-btn" on:click={() => navigateChromium(window.id)}>
                                        <span class="material-symbols-outlined">search</span>
                                    </button>
                                </div>
                            {/if}
                        </svelte:fragment>

                        {#if window.type === 'games'}
                            <Cyanide 
                                windowId={window.id}
                                on:gamestatechange={(e) => updateWindowState(window.id, e.detail)} 
                            />
                        {:else if window.type === 'floride'}
                            <Flouride persona={window.persona} />
                        {:else if window.type === 'sulfur'}
                            <Sulfur />
                        {:else if window.type === 'proxy'}
                            <Chromium 
                                bind:this={chromiumStates[window.id].component}
                                on:urlchange={(e) => handleChromiumUrlChange(window.id, e.detail.url)}
                            />
                        {:else}
                            <p>Content for {window.type}</p>
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

    .url-bar-container {
        display: flex;
        align-items: center;
        background: #111;
        border: 1px solid #444;
        border-radius: 25px;
        padding: 2px 10px;
        width: 100%;
        max-width: 600px;
        gap: 5px;
    }

    .url-input {
        background: transparent;
        border: none;
        color: #fff;
        flex-grow: 1;
        font-family: "DM Mono", monospace;
        font-size: 14px;
        outline: none;
        padding: 4px 8px;
    }

    .nav-btn {
        background: transparent;
        border: none;
        color: #888;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px;
        transition: color 0.2s;
    }

    .nav-btn:hover {
        color: #fff;
    }

    .nav-btn .material-symbols-outlined {
        font-size: 18px;
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