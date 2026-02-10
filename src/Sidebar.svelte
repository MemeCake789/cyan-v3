<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from "svelte";

    export let collapsed = false;

    const dispatch = createEventDispatcher();

    let time = "";
    let timeParts = { h: "", m: "", x: "" };
    let date = "";
    let interval: any;

    const apps = [
        { id: "games", label: "Cyanide", icon: "sports_esports" },
        { id: "proxy", label: "Chromium", icon: "public" },
        { id: "sulfur", label: "Sulfur", icon: "chat_bubble" },
        { id: "floride", label: "Flouride", icon: "terminal" },
    ];

    function updateTime() {
        const now = new Date();
        time = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

        const parts = time.split(/[:\s]+/);
        if (parts.length >= 2) {
            timeParts = {
                h: parts[0],
                m: parts[1],
                x: parts[2] || "",
            };
        }

        date = now.toLocaleDateString([], { month: "short", day: "numeric" });
    }

    onMount(() => {
        updateTime();
        interval = setInterval(updateTime, 10000);
    });

    onDestroy(() => {
        if (interval) clearInterval(interval);
    });
</script>

<aside class="sidebar-container">
    <div class="sidebar" class:collapsed>
        <!-- Header -->
        <div class="sidebar-header">
            <div class="logo-area">
                <div class="site-info">
                    <span class="site-name">CYAN</span>
                    <span class="version">v3.1.1</span>
                </div>
            </div>

            <button
                class="toggle-btn"
                on:click={() => dispatch("toggle")}
                title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                <span class="material-symbols-outlined">
                    {collapsed ? "left_panel_open" : "left_panel_close"}
                </span>
            </button>
        </div>

        <!-- Navigation -->
        <nav class="sidebar-nav">
            {#each apps as app}
                <button
                    class="nav-item"
                    on:click={() => dispatch("launch", { appId: app.id })}
                    title={app.label}
                >
                    <div class="nav-icon-box">
                        <span class="material-symbols-outlined icon"
                            >{app.icon}</span
                        >
                    </div>
                    <span class="label">{app.label}</span>
                </button>
            {/each}
        </nav>

        <!-- Footer: Date & Time -->
        <div class="sidebar-footer">
            {#if collapsed}
                <div class="time-widget-vertical">
                    <span class="v-part">{timeParts.h}</span>
                    <span class="v-sep">/</span>
                    <span class="v-part">{timeParts.m}</span>
                    {#if timeParts.x}
                        <span class="v-ampm">{timeParts.x}</span>
                    {/if}
                </div>
            {:else}
                <div class="time-widget">
                    <span class="time">{time}</span>
                    <span class="date">{date}</span>
                </div>
            {/if}
        </div>
    </div>
</aside>

<style>
    /* Floating Container Wrapper */
    .sidebar-container {
        height: 100vh;
        display: flex;
        align-items: center;
        padding-left: 10px; /* Slight offset from screen edge */
        flex-shrink: 0;
        width: auto;
    }

    .sidebar {
        width: 240px;
        height: calc(100vh - 20px); /* Floating gap */
        background-color: rgba(40, 40, 40, 0.75); /* Slight Grey Translucent */
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        padding: 20px 15px;
        transition:
            width 0.3s cubic-bezier(0.25, 1, 0.5, 1),
            padding 0.3s;
        overflow: hidden;
        backdrop-filter: blur(24px) saturate(180%); /* Glassmorphism */
        -webkit-backdrop-filter: blur(24px) saturate(180%);
        font-family: var(--font-mono);
        color: #eee;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    .sidebar::-webkit-scrollbar {
        display: none;
    }

    .sidebar.collapsed {
        width: 54px; /* Tighter width */
        padding: 20px 8px; /* Less padding */
    }

    /* Header */
    .sidebar-header {
        margin-bottom: 30px;
        padding-left: 5px;
        min-height: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .logo-area {
        display: flex;
        align-items: center;
        gap: 0;
        flex-grow: 1;
        overflow: hidden;
    }

    .site-info {
        display: flex;
        flex-direction: column;
        line-height: 1.1;
        transition: opacity 0.2s;
        white-space: nowrap;
    }

    .site-name {
        font-weight: 700;
        font-size: 16px;
        letter-spacing: 0.05em;
    }

    .version {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.5);
    }

    .sidebar.collapsed .site-info {
        display: none;
    }

    .sidebar.collapsed .logo-area {
        display: none;
    }

    /* Toggle Button */
    .toggle-btn {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition:
            color 0.2s,
            background 0.2s;
    }

    .toggle-btn:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.1);
    }

    .sidebar.collapsed .sidebar-header {
        justify-content: center; /* Center the button */
        padding-left: 0;
    }

    /* Navigation */
    .sidebar-nav {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .nav-item {
        display: flex;
        align-items: center;
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        padding: 10px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
        font-family: inherit;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
    }

    .nav-item:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: #fff;
        transform: scale(1.02);
    }

    .nav-item:active {
        transform: scale(0.98);
    }

    .nav-icon-box {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 15px;
        width: 24px;
        flex-shrink: 0;
    }

    .nav-item .icon {
        font-size: 20px;
    }

    .sidebar.collapsed .nav-item {
        justify-content: center;
        padding: 12px 0;
    }

    .sidebar.collapsed .nav-icon-box {
        margin-right: 0;
    }

    .sidebar.collapsed .label {
        display: none;
    }

    /* Footer */
    .sidebar-footer {
        margin-top: auto;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .time-widget {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding-left: 5px;
        white-space: nowrap;
    }

    .time {
        font-size: 20px;
        font-weight: 300;
        color: #fff;
    }

    .date {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 2px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    /* Vertical Time Widget (Collapsed) */
    .time-widget-vertical {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        line-height: 1.2;
        color: rgba(255, 255, 255, 0.8);
        gap: 2px;
    }

    .v-part {
        font-weight: 500;
        font-size: 12px;
    }

    .v-sep {
        opacity: 0.5;
        font-size: 10px;
        transform: rotate(15deg);
    }

    .v-ampm {
        font-size: 9px;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 2px;
    }
</style>
