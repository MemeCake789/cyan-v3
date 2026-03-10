import { SimplePool, finalizeEvent, getPublicKey } from 'nostr-tools';
import type { Event } from 'nostr-tools';

// Simple hash function to generate bytes from string
function stringToBytes(str: string): Uint8Array {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const result = new Uint8Array(32);
    
    for (let i = 0; i < 32; i++) {
        let val = i;
        for (let j = 0; j < data.length; j++) {
            val = ((val * 31) + data[j] + (j * 137)) & 0xff;
        }
        result[i] = val;
    }
    
    return result;
}

// Convert bytes to hex string
function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Cyanv3 specific channel - deterministic ID
const CHANNEL_NAME = 'cyanv3-public-chat1';
const CHANNEL_ID = bytesToHex(stringToBytes(CHANNEL_NAME));

// Relay pool
const RELAYS = [
    'wss://relay.damus.io',
    'wss://relay.snort.social',
    'wss://nos.lol',
    'wss://nostr.mom',
    'wss://relay.primal.net',
    'wss://nostr.bitcoiner.social'
];

// Global pool instance - shared across component instances
let pool: SimplePool | null = null;
let activeSubscriptionCount = 0;

// Generate deterministic private key from username
function getKeypairFromUsername(username: string): { sk: Uint8Array; pk: string } {
    const sk = stringToBytes(username);
    const pk = getPublicKey(sk);
    return { sk, pk };
}

// Initialize pool
export function initPool(): SimplePool {
    if (!pool) {
        pool = new SimplePool();
    }
    return pool;
}

// Get channel ID
export function getChannelId(): string {
    return CHANNEL_ID;
}

// Get relays
export function getRelays(): string[] {
    return [...RELAYS];
}

// Subscribe to messages - each call creates a new independent subscription
export function subscribeToMessages(
    onMessage: (event: Event) => void,
    onEose?: () => void
): () => void {
    const p = initPool();
    activeSubscriptionCount++;
    
    const filter = {
        kinds: [42],
        '#e': [CHANNEL_ID],
        limit: 100
    };
    
    console.log('[nostr] subscribing to channel:', CHANNEL_ID);
    
    // Track events for this subscription only
    const seenEvents = new Set<string>();
    
    // Wrapper to handle deduplication for this subscription
    const handleEvent = (event: Event) => {
        if (seenEvents.has(event.id)) {
            return;
        }
        seenEvents.add(event.id);
        console.log('[nostr] received event:', event.id?.slice(0, 8));
        onMessage(event);
    };
    
    // Subscribe for realtime updates
    const sub = p.subscribeMany(
        RELAYS,
        filter,
        {
            onevent: handleEvent,
            oneose: () => {
                console.log('[nostr] subscription eose');
            }
        }
    );
    
    // Fetch existing messages
    let eoseCalled = false;
    const callEose = () => {
        if (!eoseCalled) {
            eoseCalled = true;
            onEose?.();
        }
    };
    
    p.querySync(RELAYS, filter).then(events => {
        console.log('[nostr] fetched', events.length, 'existing messages');
        // Sort by created_at ascending (oldest first)
        events.sort((a, b) => a.created_at - b.created_at);
        events.forEach(event => handleEvent(event));
        callEose();
    }).catch(err => {
        console.error('[nostr] querySync failed:', err);
        callEose();
    });
    
    // Return cleanup function
    return () => {
        console.log('[nostr] closing subscription');
        sub.close();
        seenEvents.clear();
        activeSubscriptionCount--;
        
        // Only close pool when all subscriptions are gone
        if (activeSubscriptionCount <= 0 && pool) {
            pool.close(RELAYS);
            pool = null;
            activeSubscriptionCount = 0;
        }
    };
}

// Send a message
export async function sendMessage(
    text: string,
    username: string,
    replyToId?: string
): Promise<void> {
    const p = initPool();
    const { sk } = getKeypairFromUsername(username);
    
    const tags: string[][] = [['e', CHANNEL_ID, '', 'root']];
    
    if (replyToId) {
        tags.push(['e', replyToId, '', 'reply']);
    }
    
    const eventTemplate = {
        kind: 42,
        created_at: Math.floor(Date.now() / 1000),
        tags: tags,
        content: JSON.stringify({
            text: text,
            user: username
        })
    };
    
    const event = finalizeEvent(eventTemplate, sk);
    console.log('[nostr] sending event:', event.id?.slice(0, 8));
    
    const promises = RELAYS.map(async (relay) => {
        try {
            await p.publish([relay], event);
            console.log('[nostr] published to', relay);
            return { relay, success: true };
        } catch (err) {
            console.error(`[nostr] failed to publish to ${relay}:`, err);
            return { relay, success: false };
        }
    });
    
    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    
    if (successful.length === 0) {
        throw new Error('Failed to publish to any relay');
    }
    
    console.log(`[nostr] published to ${successful.length}/${RELAYS.length} relays`);
}

// Parse event content
export function parseMessageEvent(event: Event): {
    id: string;
    text: string;
    user: string;
    timestamp: string;
    replyTo?: string;
} {
    let content: { text: string; user: string };
    
    try {
        content = JSON.parse(event.content);
    } catch {
        content = { text: event.content, user: 'unknown' };
    }
    
    const replyTag = event.tags.find(tag => tag[0] === 'e' && tag[3] === 'reply');
    const replyTo = replyTag ? replyTag[1] : undefined;
    
    return {
        id: event.id,
        text: content.text || event.content,
        user: content.user || 'anonymous',
        timestamp: new Date(event.created_at * 1000).toISOString(),
        replyTo
    };
}

// Backward compatibility
export function closePool() {
    // Pool is now managed by subscription count
}
