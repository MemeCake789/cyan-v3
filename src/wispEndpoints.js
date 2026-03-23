// ranked from best (most reliable) to worst
// add your own wisp server at the top for best results
const WISP_ENDPOINTS = [
    "wss://wisp.mercurywork.shop/",          // official mercury workshop demo, 500kB/s limit
    "wss://anura.pro/",                       // anura ecosystem, used by holy unblocker
    "wss://nebulaproxy.io/wisp/",             // titanium network (whisper docs)
    "wss://shadow.letsendobesity.org/wisp/",  // shadow proxy default (flaky)
    "wss://wisp.rhw.one/",                    // deployWisp instance
    "wss://atlas.titaniumnet.work/wisp/",     // titanium network atlas
    "wss://fastforwarder.org/wisp/",          // original (probably dead, kept as last resort)
];

export const WISP_CONFIG = {
    endpoints: WISP_ENDPOINTS,
    maxRetries: 2,
    retryDelay: 1500,
};

/**
 * try each wisp endpoint in order, return first working transport
 * @param {typeof import("@mercuryworkshop/epoxy-transport").default} EpoxyTransport
 * @returns {Promise<{transport: any, url: string}>}
 */
export async function connectWisp(EpoxyTransport) {
    for (const url of WISP_CONFIG.endpoints) {
        for (let attempt = 0; attempt < WISP_CONFIG.maxRetries; attempt++) {
            try {
                console.log(`[wisp] trying ${url} (attempt ${attempt + 1}/${WISP_CONFIG.maxRetries})`);
                const transport = new EpoxyTransport({ wisp: url });
                await transport.init();
                console.log(`[wisp] connected via ${url}`);
                return { transport, url };
            } catch (err) {
                console.warn(`[wisp] ${url} failed:`, err);
                if (attempt < WISP_CONFIG.maxRetries - 1) {
                    await new Promise(r => setTimeout(r, WISP_CONFIG.retryDelay));
                }
            }
        }
    }
    throw new Error("all wisp endpoints failed");
}
