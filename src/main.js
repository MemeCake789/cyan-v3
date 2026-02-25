import { mount } from 'svelte'
import 'katex/dist/katex.min.css'; // KaTeX CSS for math rendering
import './app.css'
import App from './App.svelte'
import EpoxyTransport from "@mercuryworkshop/epoxy-transport";

// global proxy for about:blank environments
async function initGlobalProxy() {
    if (typeof window === "undefined") return;
    const isAboutBlank = window.location.protocol === "about:" || window.location.origin === "null";
    if (!isAboutBlank) return;

    try {
        const transport = new EpoxyTransport({ wisp: "wss://fastforwarder.org/wisp/" });
        await transport.init();

        const originalFetch = window.fetch;
        window.fetch = async (input, init) => {
            const url = typeof input === "string" ? input : (input && input.url) || input.toString();
            
            // proxy google ai, firebase, and huggingface requests
            if (url.includes("googleapis.com") || url.includes("firebase") || url.includes("huggingface")) {
                const method = init?.method || "GET";
                let headers = {};
                if (init?.headers) {
                    if (init.headers instanceof Headers) {
                        init.headers.forEach((v, k) => { headers[k] = v; });
                    } else if (Array.isArray(init.headers)) {
                        init.headers.forEach(([k, v]) => { headers[k] = v; });
                    } else {
                        headers = init.headers;
                    }
                }
                const body = init?.body || null;
                
                try {
                    const resp = await transport.request(new URL(url), method, body, headers);
                    return new Response(resp.body, { 
                        status: resp.status, 
                        headers: resp.headers 
                    });
                } catch (e) {
                    console.error("[proxy] fetch failed, falling back:", e);
                    return originalFetch(input, init);
                }
            }
            return originalFetch(input, init);
        };
        console.log("[proxy] global fetch patched for about:blank");
    } catch (e) {
        console.error("[proxy] global init failed:", e);
    }
}

initGlobalProxy();

const app = mount(App, {
  target: document.getElementById('app'),
})

export default app
