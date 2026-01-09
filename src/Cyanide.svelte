<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
    import { flip } from "svelte/animate";
    import { quintOut } from "svelte/easing";
    import { fly } from "svelte/transition";
    import GameCard from "./GameCard.svelte";
    import GameListItem from "./GameListItem.svelte";
    import GameDetail from "./GameDetail.svelte";

    const dispatch = createEventDispatcher();

    export let windowId: number;

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
    let isGamePlaying = false;

    $: sortedGames = [...games].sort((a, b) => {
        if (a.favorited && !b.favorited) return -1;
        if (!a.favorited && b.favorited) return 1;
        return a.title.localeCompare(b.title);
    });

    function handleBackEvent() {
        isGamePlaying = false;
        selectedGame = null;
        dispatch("gamestatechange", {
            title: "games",
            showBackButton: false,
        });
    }

    onMount(async () => {
        window.addEventListener(`back-${windowId}`, handleBackEvent);

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

    onDestroy(() => {
        window.removeEventListener(`back-${windowId}`, handleBackEvent);
    });

    function toggleFavorite(clickedGame: Game) {
        games = games.map((game) =>
            game.title === clickedGame.title
                ? { ...game, favorited: !game.favorited }
                : game,
        );
    }

    let searchTerm = "";
    let selectedGame: Game | null = null;

    $: filteredGames = sortedGames.filter((game) =>
        game.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    function handlePlay() {
        isGamePlaying = true;
        dispatch("gamestatechange", {
            title: `[ ${selectedGame.title} ] cyanide`,
            showBackButton: true,
        });
    }
</script>

<div
    class="cyanide-container"
    class:list-view-details-open={currentView === "list" && selectedGame}
>
    <div class="main-view">
        {#if !isGamePlaying}
            <div class="top-bar">
                <div class="search-bar">
                    <input
                        type="text"
                        placeholder="Search..."
                        bind:value={searchTerm}
                    />
                </div>
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
            </div>
        {/if}

        {#if loading}
            <p>Loading games...</p>
        {:else if error}
            <p class="error">Error: {error}</p>
        {:else if currentView === "grid"}
            {#if selectedGame}
                {#key selectedGame.title}
                    <GameDetail
                        game={selectedGame}
                        view="grid"
                        on:close={() => {
                            selectedGame = null;
                            isGamePlaying = false;
                            dispatch("gamestatechange", {
                                title: "games",
                                showBackButton: false,
                            });
                        }}
                        on:play={handlePlay}
                    />
                {/key}
            {:else}
                <div class="grid-view">
                    {#each filteredGames as game (game.title)}
                        <div
                            animate:flip={{ duration: 500, easing: quintOut }}
                            on:click={() => (selectedGame = game)}
                            role="button"
                            tabindex="0"
                            on:keydown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    selectedGame = game;
                                }
                            }}
                        >
                            <GameCard {game} />
                        </div>
                    {/each}
                </div>
            {/if}
        {:else}
            <div class="list-view">
                {#each filteredGames as game (game.title)}
                    <div animate:flip={{ duration: 500 }}>
                        <div 
                            on:click={() => (selectedGame = game)}
                            role="button"
                            tabindex="0"
                            on:keydown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    selectedGame = game;
                                }
                            }}
                        >
                            <GameListItem
                                game={game}
                                on:toggleFavorite={() => toggleFavorite(game)}
                            />
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    {#if currentView === "list" && selectedGame}
        <div
            class="detail-view"
            transition:fly={{ x: 200, duration: 500, easing: quintOut }}
        >
            <GameDetail
                game={selectedGame}
                view="list"
                on:close={() => {
                    selectedGame = null;
                    isGamePlaying = false;
                    dispatch("gamestatechange", {
                        title: "games",
                        showBackButton: false,
                    });
                }}
                on:play={handlePlay}
            />
        </div>
    {/if}
</div>

<style>
    .cyanide-container {
        font-family: "monospace", monospace;
        color: #e0e0e0;
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }

    .cyanide-container.list-view-details-open {
        flex-direction: row;
    }

    .main-view {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .cyanide-container.list-view-details-open .main-view {
        width: 60%;
        border-right: 1px solid #444;
    }

    .detail-view {
        width: 40%;
    }

    .top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 20px;
    }

    .search-bar input {
        background-color: #222;
        color: #e0e0e0;
        border: 1px solid #444;
        border-radius: 20px;
        padding: 5px 10px;
        font-family: "monospace", monospace;
    }

    .view-switcher button,
    .back-button {
        background-color: #222;
        color: #e0e0e0;
        border: 1px solid #444;
        border-radius: 20px;
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
        padding: 20px;
    }

    .list-view {
        flex-grow: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
</style>
