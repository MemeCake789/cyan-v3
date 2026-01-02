<script lang="ts">
    import { onMount, tick, createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let game: {
        title: string;
        imageSrc: string;
        genre: string;
        status: [string, string];
        favorited?: boolean;
    };

    // Ticker logic
    let titleContainer: HTMLTableCellElement;
    let titleText: HTMLSpanElement;
    let isScrolling = false;
    let scrollDistance = 0; // New variable for scroll distance

    async function checkForTicker() {
        await tick();
        if (titleContainer && titleText) {
            const textWidth = titleText.offsetWidth;
            const containerWidth = titleContainer.offsetWidth;
            const needsTicker = textWidth > containerWidth;

            if (needsTicker !== isScrolling) {
                isScrolling = needsTicker;
            }
            if (needsTicker) {
                scrollDistance = textWidth - containerWidth;
            } else {
                scrollDistance = 0;
            }
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
</script>

<div class="game-list-item" on:click={() => dispatch("click")}>
    <div class="favorite-cell" on:click|stopPropagation={() => dispatch("toggleFavorite")}>
        <span
            class="material-symbols-outlined star-icon"
            class:favorited={game.favorited}
        >
            {game.favorited ? "star" : "star_outline"}
        </span>
    </div>
    <div class="image-cell">
        <img src={game.imageSrc} alt={game.title} class="game-image" />
    </div>
    <div class="game-info-cell" bind:this={titleContainer}>
        <span
            bind:this={titleText}
            class:scrolling={isScrolling}
            style:--scroll-distance={`${scrollDistance}px`}
            style:--total-duration={isScrolling
                ? `${scrollDistance / 40 / 0.5}s`
                : "0s"}>{game.title}</span
        >
        <div class="genre-status">{game.genre} | {game.status[0]}</div>
    </div>
</div>

<style>
    .game-list-item {
        display: flex;
        align-items: center;
        padding: 8px;
        border-bottom: 1px solid #2a2a2a;
    }

    .game-list-item:hover {
        background-color: #252525;
    }

    .favorite-cell, .image-cell {
        margin-right: 10px;
    }

    .game-info-cell {
        overflow: hidden;
        white-space: nowrap;
        display: flex;
        flex-direction: column;
    }

    .game-info-cell .genre-status {
        font-size: 0.8em;
        color: #aaa;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 2px;
    }

    .game-image {
        width: 40px;
        height: 40px;
        object-fit: cover;
        border-radius: 4px;
    }

    @keyframes ticker-scroll {
        0% {
            transform: translateX(0);
        }
        25% {
            transform: translateX(0); /* Pause at start */
        }
        75% {
            transform: translateX(
                calc(-1 * var(--scroll-distance))
            ); /* Scroll */
        }
        100% {
            transform: translateX(
                calc(-1 * var(--scroll-distance))
            ); /* Pause at end */
        }
    }

    .star-icon {
        cursor: pointer;
        vertical-align: middle;
        user-select: none;
        font-size: 14px;
        font-family: "Material Symbols Outlined";
        font-weight: normal;
        font-style: normal;
        display: inline-block;
        line-height: 1;
        text-transform: none;
        letter-spacing: normal;
        word-wrap: normal;
        white-space: nowrap;
        direction: ltr;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        -moz-osx-font-smoothing: grayscale;
        font-feature-settings: "liga";
    }
    .star-icon.favorited {
        color: #ffd700;
    }
</style>
