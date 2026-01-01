<script lang="ts">
    import { onMount, tick, createEventDispatcher } from 'svelte';

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
        window.addEventListener('resize', checkForTicker);
        return () => window.removeEventListener('resize', checkForTicker);
    });

    $: if(game.title) {
        isScrolling = false; // reset
        checkForTicker();
    }
</script>

<tr>
    <td on:click|stopPropagation={() => dispatch('toggleFavorite')}>
        <span
            class="material-symbols-outlined star-icon"
            class:favorited={game.favorited}
        >
            {game.favorited ? "star" : "star_outline"}
        </span>
    </td>
    <td class="title-cell" bind:this={titleContainer}>
        <span
            bind:this={titleText}
            class:scrolling={isScrolling}
            style:--scroll-distance={`${scrollDistance}px`}
            style:--total-duration={isScrolling ? `${(scrollDistance / 40) / 0.5}s` : '0s'}
        >{game.title}</span>
    </td>
    <td>{game.genre}</td>
    <td>{game.status[0]}</td>
</tr>

<style>
    td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid #2a2a2a;
        vertical-align: middle;
    }
    
    .title-cell {
        overflow: hidden;
        white-space: nowrap;
    }

    .title-cell span.scrolling {
        display: inline-block;
        animation: ticker-scroll var(--total-duration) linear infinite;
    }

    @keyframes ticker-scroll {
        0% {
            transform: translateX(0);
        }
        25% {
            transform: translateX(0); /* Pause at start */
        }
        75% {
            transform: translateX(calc(-1 * var(--scroll-distance))); /* Scroll */
        }
        100% {
            transform: translateX(calc(-1 * var(--scroll-distance))); /* Pause at end */
        }
    }

    .star-icon {
        cursor: pointer;
        vertical-align: middle;
        user-select: none;
        font-size: 14px;
        font-family: 'Material Symbols Outlined';
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
        font-feature-settings: 'liga';
    }
    .star-icon.favorited {
        color: #ffd700;
    }
</style>
