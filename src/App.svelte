<script lang="ts">
    import { onMount, onDestroy, tick } from "svelte";
    import { windows } from "./windows";
    import Window from "./Window.svelte";
    import Cyanide from "./Cyanide.svelte";
    import Flouride from "./Flouride.svelte";
    import Sulfur from "./Sulfur.svelte";
    import Chromium from "./Chromium.svelte";
    import { flip } from "svelte/animate";
    import type { SvelteComponent } from "svelte";

    let currentDate = new Date().toLocaleDateString();
    let currentTime = new Date().toLocaleTimeString();
    let interval;
    let windowContainer: HTMLDivElement;

    // Local state for chromium instances to bridge the slot to the component
    // Track Chromium component instances and their URLs per window id
    // Using a typed record to satisfy TypeScript and avoid “never” errors
    let chromiumStates: Record<number, { inputUrl: string; component?: any }> =
        {};

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
            title: type,
            displayTitle: type === "proxy" ? "chrθmium" : type,
            minimized: false,
            showBackButton: false,
            persona: "cyan",
        };

        if (type === "proxy") {
            chromiumStates[id] = {
                inputUrl: "google.com",
                component: null,
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

    function updateWindowState(
        id: number,
        detail: { title: string; showBackButton: boolean },
    ) {
        windows.update((ws) =>
            ws.map((w) => {
                if (w.id === id) {
                    return {
                        ...w,
                        displayTitle:
                            detail.title === "games" ? w.type : detail.title,
                        showBackButton: detail.showBackButton,
                    };
                }
                return w;
            }),
        );
    }

    function handleChromiumUrlChange(id, url) {
        if (chromiumStates[id]) {
            chromiumStates[id].inputUrl = url;
        }
    }

    // navigateChromium function removed – navigation handled by Chromium component directly via urlchange events.

    let showFeedbackPopup = false;
    let feedbackType = "bug";
    let feedbackText = "";
    let feedbackStatus = ""; // '', 'submitting', 'success', 'error'

    function openFeedbackPopup() {
        showFeedbackPopup = true;
        feedbackStatus = "";
        feedbackText = "";
    }

    function closeFeedbackPopup() {
        showFeedbackPopup = false;
    }

    async function handleSubmit() {
        if (!feedbackText.trim()) {
            feedbackStatus = "Please enter some text.";
            setTimeout(() => {
                if (feedbackStatus === "Please enter some text.")
                    feedbackStatus = "";
            }, 3000);
            return;
        }

        feedbackStatus = "submitting";
        try {
            const response = await fetch(
                "https://cyan-data.vercel.app/api/feedback",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: feedbackType,
                        text: feedbackText,
                    }),
                },
            );

            if (response.ok) {
                feedbackStatus = "success";
                setTimeout(() => {
                    closeFeedbackPopup();
                }, 1500);
            } else {
                const errorData = await response.json();
                console.error("Submission failed:", errorData);
                feedbackStatus = "error";
                setTimeout(() => {
                    if (feedbackStatus === "error") feedbackStatus = "";
                }, 3000);
            }
        } catch (error) {
            console.error("Submission error:", error);
            feedbackStatus = "error";
            setTimeout(() => {
                if (feedbackStatus === "error") feedbackStatus = "";
            }, 3000);
        }
    }
</script>

<main>
    <header class="header">
        <div class="section-title">header</div>
        <div class="date-time">
            <span>{currentDate}</span>
            <span>{currentTime}</span>
        </div>
        <div class="version">
            CYAN V3.0.1f <br />
            <span style="font-size: xx-small; color: #888;"
                >(Floride AI Image Gen)</span
            >
        </div>
    </header>
    <nav class="nav">
        <button
            class="nav-button"
            on:click={() => openWindow("games")}
            title="Games"
        >
            <span class="material-symbols-outlined">sports_esports</span>
            cyλnide
        </button>
        <button
            class="nav-button"
            on:click={() => openWindow("proxy")}
            title="Proxy"
        >
            <span class="material-symbols-outlined">public</span>
            chrθmium
        </button>
        <button
            class="nav-button"
            on:click={() => openWindow("floride")}
            title="AI"
        >
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
    <section class="right">
        <div class="window-container" bind:this={windowContainer}>
            {#each $windows as window (window.id)}
                <div
                    class:fullscreen={window.id === fullscreenWindowId}
                    role="button"
                    tabindex="0"
                    animate:flip={{ duration: 300 }}
                >
                    <!-- @ts-ignore -->
                    <Window
                        title={window.displayTitle}
                        minimized={window.id === fullscreenWindowId
                            ? false
                            : window.minimized}
                        fullscreen={window.id === fullscreenWindowId}
                        showBackButton={window.showBackButton}
                        on:close={() => closeWindow(window.id)}
                        on:toggleMinimize={() => toggleMinimize(window.id)}
                        on:fullscreen={() => toggleFullscreen(window.id)}
                        on:back={() => handleBack(window.id)}
                        on:dragStart={() => dragStart(window)}
                        on:dragOver={() => dragOver(window)}
                        on:dragEnd={() => dragEnd()}
                    >
                        <svelte:fragment slot="title-center">
                            {#if window.type === "proxy"}
                                <div
                                    class="url-bar-container"
                                    role="button"
                                    tabindex="0"
                                >
                                    <!-- navigation buttons removed for simplicity -->
                                    <input
                                        type="text"
                                        class="url-input"
                                        value={chromiumStates[window.id]
                                            .inputUrl}
                                        placeholder="Enter URL"
                                        on:input={(e) => {
                                            const target =
                                                e.target as HTMLInputElement;
                                            chromiumStates[window.id].inputUrl =
                                                target.value;
                                        }}
                                    />
                                </div>
                            {/if}
                        </svelte:fragment>

                        {#if window.type === "games"}
                            <Cyanide
                                windowId={window.id}
                                on:gamestatechange={(e) =>
                                    updateWindowState(window.id, e.detail)}
                            />
                        {:else if window.type === "floride"}
                            <Flouride persona={window.persona} />
                        {:else if window.type === "sulfur"}
                            <Sulfur
                                isMinimized={window.minimized}
                                isMaximized={!window.minimized &&
                                    window.id !== fullscreenWindowId}
                            />
                        {:else if window.type === "proxy"}
                            <Chromium
                                on:urlchange={(e) =>
                                    handleChromiumUrlChange(
                                        window.id,
                                        // @ts-ignore
                                        e?.detail?.url,
                                    )}
                            />
                        {:else}
                            <p>Content for {window.type}</p>
                        {/if}
                    </Window>
                </div>
            {/each}
        </div>
    </section>
    <!-- Footer (status bar) intentionally hidden per request -->
    <footer class="footer">
        <div class="section-title">status</div>
        <button class="feedback-link" on:click={openFeedbackPopup}>
            report a bug / give feedback
        </button>
    </footer>
</main>

{#if showFeedbackPopup}
    <div
        class="feedback-popup-overlay"
        role="button"
        tabindex="0"
        on:click={closeFeedbackPopup}
    >
        <div class="feedback-popup" on:click|stopPropagation>
            <button class="popup-close-btn" on:click={closeFeedbackPopup}
                >×</button
            >
            <h3>report a bug / give feedback</h3>
            <form class="feedback-form" on:submit|preventDefault={handleSubmit}>
                <select class="feedback-select" bind:value={feedbackType}>
                    <option value="bug">report a bug</option>
                    <option value="recommendation">recommendation</option>
                    <option value="game-request">request a game</option>
                </select>
                <textarea
                    class="feedback-textarea"
                    bind:value={feedbackText}
                    placeholder="your feedback..."
                ></textarea>
                <button
                    class="feedback-submit"
                    type="submit"
                    disabled={feedbackStatus === "submitting"}
                >
                    {#if feedbackStatus === "submitting"}
                        sending...
                    {:else if feedbackStatus === "success"}
                        sent!
                    {:else}
                        submit
                    {/if}
                </button>
            </form>
            {#if feedbackStatus && !["submitting", "success"].includes(feedbackStatus)}
                <div
                    class="feedback-status"
                    class:error={feedbackStatus === "error" ||
                        feedbackStatus === "Please enter some text."}
                >
                    {feedbackStatus === "error"
                        ? "oops, something went wrong."
                        : feedbackStatus}
                </div>
            {/if}
        </div>
    </div>
{/if}

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

    * {
        box-sizing: border-box;
    }

    main {
        display: grid;
        grid-template-columns: 20% 1fr;
        /* Dropped the footer row as the status bar is hidden */
        grid-template-rows: auto 1fr;
        grid-template-areas:
            "header right"
            "nav    right";
        width: 100vw;
        height: 100vh;
        background-color: #000000;
        padding: 20px;
        gap: 20px;
    }

    .right {
        grid-area: right;
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
        background-color: #000;
    }

    .header {
        grid-area: header;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 20px;
        min-height: 150px;
    }
    .nav {
        grid-area: nav;
        flex-grow: 1;
        padding: 20px;
        align-items: flex-start;
    }
    .footer {
        display: none;
    }

    @media (max-width: 1200px) {
        main {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto 1fr;
            grid-template-areas:
                "header"
                "nav"
                "right";
            overflow-y: auto;
            padding: 10px;
        }
        .header,
        .nav,
        .right {
            width: 100%;
        }
        .header {
            min-height: auto;
        }
        .right {
            min-height: 110vh;
        }
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
    .feedback-link {
        background: none;
        border: none;
        color: #888;
        cursor: pointer;
        font-family: "DM Mono", monospace;
        font-size: 1em;
        transition: color 0.3s;
    }
    .feedback-link:hover {
        color: #fff;
    }
    .feedback-popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    }
    .feedback-popup {
        background: #111;
        border: 1px solid #555;
        border-radius: 10px;
        padding: 20px;
        width: 90%;
        max-width: 500px;
        position: relative;
        color: white;
    }
    .popup-close-btn {
        position: absolute;
        top: 10px;
        right: 15px;
        background: none;
        border: none;
        color: #888;
        font-size: 24px;
        cursor: pointer;
        line-height: 1;
    }
    .popup-close-btn:hover {
        color: #fff;
    }
    .feedback-popup h3 {
        text-align: center;
        margin-top: 0;
        font-weight: 400;
    }
    .feedback-form {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .feedback-select,
    .feedback-textarea,
    .feedback-submit {
        background-color: #1a1a1a;
        color: #e0e0e0;
        border: 1px solid #555;
        border-radius: 5px;
        font-family: "DM Mono", monospace;
        width: 100%;
        padding: 8px;
        box-sizing: border-box;
    }
    .feedback-textarea {
        height: 120px;
        resize: vertical;
    }
    .feedback-submit {
        cursor: pointer;
        transition: background-color 0.3s;
        padding: 10px;
    }
    .feedback-submit:hover:not(:disabled) {
        background-color: #333;
    }
    .feedback-submit:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
    .feedback-status {
        text-align: center;
        margin-top: 10px;
        font-size: 12px;
        padding: 5px;
        border-radius: 5px;
    }
    .feedback-status.error {
        background-color: #a22;
        color: #fff;
    }
</style>
