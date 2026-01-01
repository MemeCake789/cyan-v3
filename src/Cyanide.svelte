<script lang="ts">
    import { onMount } from "svelte";
    import { flip } from "svelte/animate";
    import { quintOut } from "svelte/easing";
    import GameCard from "./GameCard.svelte";
    import GameListItem from "./GameListItem.svelte";

    type Game = {
        title: string;
        imageSrc: string;
        genre: string;
        type: string;
        link: string;
        description: string;
        status: [string, string];
        favorited?: boolean;
    };

    let games: Game[] = [];
    let loading = true;
    let error: string | null = null;
    let currentView: "grid" | "list" = "grid";

    $: sortedGames = [...games].sort((a, b) => {
        if (a.favorited && !b.favorited) return -1;
        if (!a.favorited && b.favorited) return 1;
        return a.title.localeCompare(b.title);
    });

    onMount(async () => {
        try {
            const response = await fetch(
                "https://raw.githubusercontent.com/MemeCake789/cyan-v3/main/games.json",
            );
            if (!response.ok) {
                throw new Error("Failed to fetch games list");
            }
            const data = await response.json();
            games = data.games.map((game: Omit<Game, "favorited">) => ({
                ...game,
                favorited: false,
            }));
        } catch (e) {
            if (e instanceof Error) {
                error = e.message;
            } else {
                error = "An unknown error occurred";
            }
        } finally {
            loading = false;
        }
    });

    function toggleFavorite(clickedGame: Game) {
        games = games.map((game) =>
            game.title === clickedGame.title
                ? { ...game, favorited: !game.favorited }
                : game,
        );
    }
</script>

<div class="cyanide-container">
    <div class="view-switcher">
        <button
            on:click={() => (currentView = "grid")}
            class:active={currentView === "grid"}>Grid</button
        >
        <button
            on:click={() => (currentView = "list")}
            class:active={currentView === "list"}>List</button
        >
    </div>

    {#if loading}
        <p>Loading games...</p>
    {:else if error}
        <p class="error">Error: {error}</p>
    {:else if currentView === "grid"}
        <div class="grid-view">
            {#each sortedGames as game (game.title)}
                <div animate:flip={{ duration: 500, easing: quintOut }}>
                    <GameCard {game} />
                </div>
            {/each}
        </div>
    {:else}
        <div class="list-view">
            <table>
                <tbody>
                    {#each sortedGames as game (game.title)}
                        <GameListItem {game} on:toggleFavorite={() => toggleFavorite(game)} />
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<style>
    .cyanide-container {
        font-family: 'monospace', monospace;
        color: #e0e0e0;
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }

    .view-switcher {
        margin-bottom: 20px;
    }

    .view-switcher button {
        background-color: #222;
        color: #e0e0e0;
        border: 1px solid #444;
        padding: 5px 10px;
        cursor: pointer;
        font-family: "monospace", monospace;
    }

    .view-switcher button.active {
        background-color: #e0e0e0;
        color: #0d0d0d;
    }

    .error {
        color: #ff5555;
    }

    .grid-view {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
        flex-grow: 1;
        overflow-y: auto;
        padding: 0 10px;
    }

    .list-view {
        flex-grow: 1;
        overflow-y: auto;
        padding: 0 10px;
    }

    .list-view table {
        width: 100%;
        border-spacing: 0;
    }

    .list-view th {
        padding: 8px;
        text-align: left;
        background-color: #333;
        color: #fafafa;
        border-bottom: 1px solid #666;
    }

    .list-view td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid #2a2a2a;
    }

    .list-view tbody tr:hover td {
        background-color: #252525;
    }

    .list-view .star-icon {
        cursor: pointer;
        vertical-align: middle;
        user-select: none;
        font-size: 14px;
    }

    .list-view .star-icon.favorited {
        color: #ffd700;
    }
</style>
