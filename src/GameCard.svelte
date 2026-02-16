<script lang="ts">
    import { onMount, tick } from "svelte";
    import ColorThief from "colorthief";
    import PENDING from "./assets/PENDING.jpg";
    import OFFLINE from "./assets/OFFLINE.jpg";

    export let game: {
        title: string;
        imageSrc: string;
        genre: string;
        status: [string, string];
        isNew?: boolean;
        fixedDate?: string;
        isFixed?: boolean;
    };

    let imgElement: HTMLImageElement;
    let backgroundColor = "#57575c";

    // tilt state
    let cardElement: HTMLDivElement;
    // strength of the tilt effect (degrees). Exportable so parent can adjust.
    export let tiltStrength: number = 15;
    let rotX = 0;
    let rotY = 0;

    function handleMouseMove(e: MouseEvent) {
        if (!cardElement) return;
        const rect = cardElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const halfW = rect.width / 2;
        const halfH = rect.height / 2;
        rotY = ((x - halfW) / halfW) * tiltStrength;
        rotX = ((halfH - y) / halfH) * tiltStrength;
    }

    function handleMouseLeave() {
        rotX = 0;
        rotY = 0;
    }

    // Reactive colors for text, borders, and separators
    let textColor = "#fff";
    let borderColor = "rgba(255, 255, 255, 0.15)";
    let separatorColor = "rgba(255, 255, 255, 0.3)";
    let visibleSrc = PENDING;

    // Ticker logic
    let titleContainer: HTMLHeadingElement;
    let titleText: HTMLSpanElement;
    let isScrolling = false;
    let textWidth = 0;

    async function checkForTicker() {
        await tick();
        if (titleContainer && titleText) {
            textWidth = titleText.offsetWidth;
            const containerWidth = titleContainer.offsetWidth;
            isScrolling = textWidth > containerWidth;
        }
    }

    onMount(() => {
        checkForTicker();
        window.addEventListener("resize", checkForTicker);
        return () => window.removeEventListener("resize", checkForTicker);
    });

    $: if (game.title) {
        isScrolling = false; // reset
        checkForTicker();
    }

    $: {
        // This block will re-run whenever game.imageSrc changes
        visibleSrc = PENDING;
        const img = new Image();
        img.src = game.imageSrc;
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            visibleSrc = game.imageSrc;
        };
        img.onerror = () => {
            visibleSrc = OFFLINE;
        };
    }

    function onImageLoad() {
        // Run color thief only for the actual game image
        if (visibleSrc === PENDING || visibleSrc === OFFLINE) {
            // for placeholders, reset to default dark theme
            backgroundColor = "#57575c";
            textColor = "#fff";
            borderColor = "rgba(255, 255, 255, 0.15)";
            separatorColor = "rgba(255, 255, 255, 0.3)";
            return;
        }

        // For the actual image, wait a microtask for bind:this to be updated
        Promise.resolve().then(() => {
            if (imgElement && imgElement.complete) {
                try {
                    const colorThief = new (ColorThief as any)();
                    const color = colorThief.getColor(imgElement);
                    backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

                    const luminance =
                        0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2];

                    if (luminance > 150) {
                        // Light background
                        textColor = "#1a1a1a";
                        borderColor = "rgba(0, 0, 0, 0.15)";
                        separatorColor = "rgba(0, 0, 0, 0.3)";
                    } else {
                        // Dark background
                        textColor = "#fff";
                        borderColor = "rgba(255, 255, 255, 0.15)";
                        separatorColor = "rgba(255, 255, 255, 0.3)";
                    }
                } catch (error) {
                    console.error("Error getting dominant color:", error);
                    // Fallback to default dark theme
                    backgroundColor = "#57575c";
                    textColor = "#fff";
                    borderColor = "rgba(255, 255, 255, 0.15)";
                    separatorColor = "rgba(255, 255, 255, 0.3)";
                }
            }
        });
    }
</script>

<div
    class="game-card"
    role="button"
    tabindex="0"
    bind:this={cardElement}
    on:mousemove={handleMouseMove}
    on:mouseleave={handleMouseLeave}
    style="
    background-color: {backgroundColor};
    --text-color: {textColor};
    --border-color: {borderColor};
    --separator-color: {separatorColor};
    transform: perspective(800px) rotateX({rotX}deg) rotateY({rotY}deg) scale(1.02);
 "
>
    {#if game.isNew}
        <div class="new-tag">NEW</div>
    {/if}
    {#if game.isFixed}
        <div class="fixed-tag">FIXED</div>
    {/if}
    <div class="image-container">
        <img
            src={visibleSrc}
            alt={game.title}
            crossorigin="anonymous"
            bind:this={imgElement}
            on:load={onImageLoad}
        />
    </div>
    <div class="info">
        <h2 bind:this={titleContainer}>
            <span
                class="ticker-wrapper"
                class:scrolling={isScrolling}
                style:--total-duration={isScrolling
                    ? `${(textWidth + 40) / 40}s`
                    : "0s"}
            >
                <span bind:this={titleText}>{game.title}</span>
                {#if isScrolling}
                    <span class="ticker-spacer"></span>
                    <span>{game.title}</span>
                    <span class="ticker-spacer"></span>
                {/if}
            </span>
        </h2>
        <div class="details">
            <span class="genre">{game.genre}</span>
            <span class="separator"></span>
            <span class="status">{game.status[0]}</span>
        </div>
    </div>
</div>

<style>
    .game-card {
        border: 1px solid var(--border-color);
        padding: 10px;
        display: flex;
        flex-direction: column;
        position: relative;
        border-radius: 12px;
        transform-style: preserve-3d;
        transition:
            background-color 0.5s ease,
            color 0.5s ease,
            border-color 0.5s ease,
            transform 0.3s ease,
            box-shadow 0.3s ease;
        color: var(--text-color);
    }
    .game-card:hover {
        /* only subtle shadow on hover; tilt is handled via JS */
        box-shadow: 0 12px 20px rgba(0, 0, 0, 0.3);
    }

    .new-tag {
        position: absolute;
        top: 0px;
        right: 0px;
        background-color: yellow;
        color: black;
        padding: 2px 6px;
        font-size: 0.8em;
        font-weight: bold;
        border-radius: 0 12px 0 12px;
        z-index: 1;
    }

    .fixed-tag {
        position: absolute;
        top: 0px;
        right: 0px;
        background-color: #00e676; /* Green for fixed */
        color: black;
        padding: 2px 6px;
        font-size: 0.8em;
        font-weight: bold;
        border-radius: 0 12px 0 12px;
        z-index: 1;
    }

    .info h2 {
        font-size: 1.2em;
        margin: 0 0 10px 0;
        font-weight: bold;
        overflow: hidden;
        white-space: nowrap;
    }

    .ticker-wrapper {
        display: inline-block;
        white-space: nowrap;
    }

    .ticker-wrapper.scrolling {
        animation: ticker-scroll var(--total-duration) linear infinite;
    }

    .ticker-spacer {
        display: inline-block;
        width: 40px;
    }

    @keyframes ticker-scroll {
        0% {
            transform: translateX(0);
        }
        100% {
            transform: translateX(-50%);
        }
    }

    .image-container {
        width: 100%;
        height: 0;
        padding-bottom: 100%;
        position: relative;
        overflow: hidden;
        margin-bottom: 10px;
    }

    .image-container img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        image-rendering: pixelated;
        border-radius: 7px;
    }

    .details {
        display: flex;
        align-items: center;
        padding: 5px;
        font-size: 0.9em;
    }

    .genre,
    .status {
        display: inline-flex;
        align-items: center;
        height: 20px;
        border: 1px solid var(--border-color);
        padding: 0 5px;
        box-sizing: border-box;
    }

    .separator {
        width: 20px;
        height: 18px;
        border-top: 1px solid var(--border-color);
        border-bottom: 1px solid var(--border-color);
        background-image: repeating-linear-gradient(
            45deg,
            var(--separator-color),
            var(--separator-color) 1px,
            transparent 1px,
            transparent 3px
        );
    }
</style>
