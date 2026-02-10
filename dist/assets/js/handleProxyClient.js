const PROXY_QUERY_PARAM = '__cpo';
function createProxyUrl(targetUrl) {
    try {
        const url = new URL(targetUrl);
        // Do not proxy data/blob URLs
        if (['data:', 'blob:', 'mailto:'].includes(url.protocol)) {
            return targetUrl;
        }
        const encodedOrigin = btoa(url.origin);
        url.searchParams.set(PROXY_QUERY_PARAM, encodedOrigin);
        url.host = location.host;
        url.protocol = location.protocol;
        return url.href;
    } catch (e) {
        console.warn(`Could not create proxy URL for: ${targetUrl}`);
        return targetUrl;
    }
}

async function search(inputString) {
    const trimmedInput = inputString.trim();
    if (!trimmedInput) return;
    const urlRegex = /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/[a-zA-Z0-9]+\.[^\s]{2,}|[a-zA-Z0-9]+\.[^\s]{2,})$/i;

    let isUrlCandidate = false;
    let urlToAttempt = '';

    if (urlRegex.test(trimmedInput)) {
        isUrlCandidate = true;
        if (!trimmedInput.startsWith('http://') && !trimmedInput.startsWith('https://')) {
            urlToAttempt = `https://${trimmedInput}`;
        } else {
            urlToAttempt = trimmedInput;
        }
    }

    try {
        if (isUrlCandidate) {
            console.log(`Checking URL existence via server: ${urlToAttempt}`);
            const checkResponse = await fetch(`/check?url=${encodeURIComponent(urlToAttempt)}`);

            if (checkResponse.ok) {
                const textResponse = await checkResponse.text();
                const urlExists = textResponse === 'true';

                if (urlExists) {
                    console.log(`URL exists, navigating to: ${urlToAttempt}`);
                    return urlToAttempt;
                } else {
                    console.log(`URL does not exist: ${urlToAttempt}`);
                    return urlToAttempt;
                }
            } else {
                console.error('Error from /check endpoint:', checkResponse.status, checkResponse.statusText);
            }
        }

        const duckDuckGoUrl = `https://duckduckgo.com/?q=${encodeURIComponent(trimmedInput)}`;
        console.log(`Performing DuckDuckGo search for: ${trimmedInput}`);
        return duckDuckGoUrl;

    } catch (error) {
        console.error('Network or unexpected error during search:', error);
        const duckDuckGoUrl = `https://duckduckgo.com/?q=${encodeURIComponent(trimmedInput)}`;
        console.log(`Fallback to DuckDuckGo due to error: ${trimmedInput}`);
        return duckDuckGoUrl;
    }
}
async function convertUrl(url) {
    document.cookie = "shouldProxy=true; path=/";
    try{
        await navigator.serviceWorker.register("/overcloaked-proxy-handler.sw.js", { scope: "/" });
    } catch (e) {   
        throw new Error("Failed to register service worker");
    }
    url = await search(url);
    return createProxyUrl(url);
}