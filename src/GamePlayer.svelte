<script lang="ts">
    export let link: string;
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();
</script>

<div class="game-player">
    <iframe
        src={link}
        sandbox="allow-scripts allow-same-origin"
        allowfullscreen
    ></iframe>
</div>

<style>
    .game-player {
        width: 100%;
        height: 100%;
        position: relative;
    }
    iframe {
        width: 100%;
        height: 100%;
        border: none;
    }
</style>