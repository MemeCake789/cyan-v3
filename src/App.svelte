<script lang="ts">
    import { onMount, tick } from "svelte";
    import { windows } from "./windows";
    import Home from "./Home.svelte";
    import Cyanide from "./Cyanide.svelte";
    import Flouride from "./Flouride.svelte";
    import Sulfur from "./Sulfur.svelte";
    import Chromium from "./Chromium.svelte";
    import Sidebar from "./Sidebar.svelte";

    // Animate imports might need `svelte` package check, standard is `svelte/animate`.
    import { flip } from "svelte/animate";

    let activeTabId: number | null = null;
    let chromiumStates: Record<number, { inputUrl: string }> = {};
    let isSidebarCollapsed = false;

    onMount(() => {
        // Init with one Home tab if empty
        if ($windows.length === 0) {
            createNewTab();
        } else {
            activeTabId = $windows[0].id;
        }
    });

    function createNewTab() {
        const id = Date.now();
        const newTab = {
            id,
            type: "home",
            title: "New Tab",
            displayTitle: "New Tab",
            minimized: false,
            showBackButton: false,
        };
        windows.update((w) => [...w, newTab]);
        activeTabId = id;
        // Expand sidebar on new tab (Home)
        isSidebarCollapsed = false;
    }

    function closeTab(id: number, event?: MouseEvent) {
        if (event) event.stopPropagation();

        let nextActiveId = activeTabId;

        // Find next active tab if closing the current one
        if (activeTabId === id) {
            const currentIndex = $windows.findIndex((w) => w.id === id);
            if (currentIndex > 0) {
                nextActiveId = $windows[currentIndex - 1].id;
            } else if ($windows.length > 1) {
                nextActiveId = $windows[1].id;
            } else {
                nextActiveId = null;
            }
        }

        windows.update((ws) => {
            const newWs = ws.filter((w) => w.id !== id);
            return newWs;
        });

        activeTabId = nextActiveId;

        if (chromiumStates[id]) delete chromiumStates[id];

        // Auto-create new tab if all closed
        if ($windows.length === 0) {
            setTimeout(() => createNewTab(), 0);
        }
    }

    function selectTab(id: number) {
        activeTabId = id;
    }

    function handleLaunch(tabId: number, appId: string, gameTitle?: string) {
        windows.update((ws) =>
            ws.map((w) => {
                if (w.id === tabId) {
                    let title = "New Tab";
                    if (appId === "games") title = "Cyanide";
                    else if (appId === "proxy") title = "Chromium";
                    else if (appId === "sulfur") title = "Sulfur";
                    else if (appId === "floride") title = "Flouride";
                    else if (appId === "home") title = "New Tab";

                    if (appId === "proxy" && !chromiumStates[tabId]) {
                        chromiumStates[tabId] = { inputUrl: "google.com" };
                    }

                    return {
                        ...w,
                        type: appId,
                        displayTitle: title,
                        gameTitleContext: gameTitle,
                    };
                }
                return w;
            }),
        );

        // Auto-collapse when launching an app
        if (appId !== "home") {
            isSidebarCollapsed = true;
        }
    }

    function updateTabTitle(id: number, title: string) {
        windows.update((ws) =>
            ws.map((w) => {
                if (w.id === id) return { ...w, displayTitle: title };
                return w;
            }),
        );
    }

    function handleChromiumUrlChange(id, url) {
        if (chromiumStates[id]) chromiumStates[id].inputUrl = url;
    }

    // Sidebar launch handler
    function handleSidebarLaunch(event) {
        if (activeTabId) {
            handleLaunch(activeTabId, event.detail.appId);
        } else {
            // No active tab (rare), create one
            createNewTab();
            // Then launch? Need to wait for tick probably, but activeTabId will set
            setTimeout(() => {
                if (activeTabId) handleLaunch(activeTabId, event.detail.appId);
            }, 0);
        }
    }

    // Determine sidebar state
    function toggleSidebar() {
        isSidebarCollapsed = !isSidebarCollapsed;
    }
</script>

<main class="app-layout">
    <!-- Sidebar -->
    <Sidebar
        collapsed={isSidebarCollapsed}
        on:launch={handleSidebarLaunch}
        on:toggle={toggleSidebar}
    />

    <div class="main-content">
        <!-- Top Tab Strip -->
        <div class="tabs-header">
            <!-- Sidebar Toggle Button REMOVED, now in sidebar -->

            <div class="tabs-list">
                {#each $windows as tab (tab.id)}
                    <div
                        class="tab-item"
                        class:active={activeTabId === tab.id}
                        on:click={() => selectTab(tab.id)}
                        on:keypress={() => selectTab(tab.id)}
                        role="button"
                        tabindex="0"
                        animate:flip={{ duration: 200 }}
                    >
                        <span class="tab-title">{tab.displayTitle}</span>
                        <button
                            class="close-tab"
                            on:click={(e) => closeTab(tab.id, e)}>×</button
                        >
                    </div>
                {/each}
                <button class="new-tab-btn" on:click={createNewTab}>
                    <span class="material-symbols-outlined">add</span>
                </button>
            </div>
        </div>

        <!-- Active Tab Content -->
        <div class="tab-content">
            {#each $windows as tab (tab.id)}
                {#if activeTabId === tab.id}
                    <div class="tab-pane visible">
                        {#if tab.type === "home"}
                            <Home
                                on:launch={(e) =>
                                    handleLaunch(
                                        tab.id,
                                        e.detail.appId,
                                        e.detail.gameTitle,
                                    )}
                            />
                        {:else if tab.type === "games"}
                            <Cyanide
                                windowId={tab.id}
                                on:gamestatechange={(e) =>
                                    updateTabTitle(tab.id, e.detail.title)}
                            />
                        {:else if tab.type === "floride"}
                            <Flouride />
                        {:else if tab.type === "sulfur"}
                            <Sulfur />
                        {:else if tab.type === "proxy"}
                            <Chromium
                                on:urlchange={(e) =>
                                    handleChromiumUrlChange(
                                        tab.id,
                                        e?.detail?.url,
                                    )}
                            />
                        {/if}
                    </div>
                {/if}
            {/each}
        </div>
    </div>
</main>

<style>
    :global(body) {
        background-color: var(--bg-color);
        color: var(--text-primary);
        margin: 0;
        font-family: var(--font-mono);
        overflow: hidden;
    }

    .app-layout {
        display: flex;
        width: 100vw;
        height: 100vh;
        background-color: #000; /* Outer bg */
    }

    .main-content {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
        background-color: var(--bg-color);
        margin-left: 8px;
    }

    /* Tabs Header */
    .tabs-header {
        height: 48px;
        background-color: #000;
        display: flex;
        align-items: center;
        padding: 8px 10px 0 10px;
        border-bottom: 1px solid var(--border-color);
        position: relative;
    }

    .tabs-list {
        display: flex;
        flex-grow: 1;
        gap: 5px;
        overflow-x: auto;
        height: 100%;
        align-items: flex-end;
    }

    .tab-item {
        height: 36px; /* slightly smaller than full height */
        min-width: 140px;
        max-width: 240px;
        background-color: transparent;
        border-radius: 8px 8px 0 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 12px;
        font-size: 13px;
        color: var(--text-secondary);
        cursor: pointer;
        user-select: none;
        transition: background 0.1s;
        border: 1px solid transparent;
        border-bottom: none;
    }

    .tab-item:hover {
        background-color: rgba(255, 255, 255, 0.08);
    }

    .tab-item.active {
        background-color: var(--bg-color);
        color: var(--text-primary);
        border-color: var(--border-color);
        position: relative;
        z-index: 2;
        margin-bottom: -1px;
        height: 37px;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
    }

    .tab-title {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-right: 8px;
        font-weight: 500;
    }

    .close-tab {
        background: none;
        border: none;
        color: var(--text-muted);
        font-size: 16px;
        cursor: pointer;
        padding: 0;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        line-height: 1;
    }

    .tab-item:hover .close-tab,
    .tab-item.active .close-tab {
        opacity: 0.7;
    }

    .close-tab:hover {
        background-color: rgba(255, 255, 255, 0.2);
        color: #fff;
        opacity: 1;
    }

    .new-tab-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        width: 36px;
        height: 36px; /* Match tab height roughly */
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 6px;
        transition: background 0.2s;
        margin-left: 5px;
        margin-bottom: 2px;
    }

    .new-tab-btn:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
    }

    .new-tab-btn .material-symbols-outlined {
        font-size: 20px;
    }

    .tab-content {
        flex-grow: 1;
        position: relative;
        overflow: hidden;
        border-top: 1px solid var(--border-color);
        margin-top: -1px; /* Align with tab border */
        z-index: 1;
    }

    .tab-pane {
        width: 100%;
        height: 100%;
        display: none;
    }

    .tab-pane.visible {
        display: block;
    }
</style>
