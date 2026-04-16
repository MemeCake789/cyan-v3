<script lang="ts">
    let inputUrl = "";

    function formatUrl(url: string) {
        if (!url.trim()) return "";
        const searchUrl = "https://duckduckgo.com/?q=";
        if (url.includes(".") && !url.includes(" ")) return url.startsWith("http") ? url : "https://" + url;
        return searchUrl + encodeURIComponent(url);
    }

    function launchProxy() {
        const finalUrl = formatUrl(inputUrl);
        if (finalUrl) window.open('/proxy.html#' + encodeURIComponent(finalUrl), "_blank");
    }
</script>

<div class="browser-container">
    <div class="launch-screen">
        <h1 class="title">CHROMIUM</h1>
        <p class="subtitle">Enter a URL or a search query to launch a proxy in a new tab.</p>
        <form class="search-form" on:submit|preventDefault={launchProxy}>
            <input type="text" bind:value={inputUrl} placeholder="Search with DuckDuckGo or enter address ..." />
            <button type="submit">></button>
        </form>
    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap');
    .browser-container { display: flex; flex-direction: column; height: 100%; width: 100%; background: #000; color: #fff; font-family: sans-serif; }
    .launch-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; }
    .title { font-family: 'Instrument Serif', serif; font-style: italic; font-size: 72px; margin: 0; font-weight: 400; }
    .subtitle { font-size: 16px; margin-bottom: 30px; color: #fff; opacity: 0.8; }
    .search-form { display: flex; gap: 10px; background: #111; padding: 5px; border-radius: 30px; border: 1px solid #333; }
    .search-form input { background: transparent; border: none; padding: 10px 20px; color: #fff; width: 400px; outline: none; }
    .search-form button { background: #222; border: none; color: #fff; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; }
</style>