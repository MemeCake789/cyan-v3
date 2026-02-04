<script lang="ts">
    import { onMount } from "svelte";
    import { getMessages, sendMessage as apiSendMessage } from "./chatApi";
    import { username as usernameStore } from "./stores";

    let messages: {
        text: string;
        user: string;
        timestamp: string;
        replyTo?: string;
        isOwner?: boolean;
        id?: string;
    }[] = [];

    let newMessage = "";
    let chatContainer: HTMLDivElement;
    let username = "anonymous-" + Math.floor(Math.random() * 10000);
    let unsubscribe: () => void = () => {};
    let batchSize = 50;

    let replyToIndex: number | null = null;

    let isLoadingMore = false;
    let previousHeight = 0;

    $: if (typeof $usernameStore === "string" && $usernameStore.trim()) {
        username = $usernameStore;
    }

    function loadMoreMessages() {
        if (chatContainer) previousHeight = chatContainer.scrollHeight;
        isLoadingMore = true;
        batchSize += 50;
        subscribeToMessages();
    }

    function formatTimestamp(iso: string) {
        if (!iso) return "";
        return new Date(iso).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function stringToColor(str: string) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = (hash * 137) % 360;
        return `hsl(${hue}, 75%, 55%)`;
    }

    function processMessage(msg: {
        text: string;
        user: string;
        timestamp: string;
        replyTo?: string;
        isOwner?: boolean;
        id?: string;
    }) {
        if (msg.text.startsWith("sudo ")) {
            return {
                ...msg,
                user: `[OWNER] ${msg.user}`,
                text: msg.text.slice(5),
                isOwner: true,
            };
        }
        return { ...msg, isOwner: false };
    }

    function scrollToMessage(idx: number) {
        const el = document.getElementById(`message-${idx}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function getMessageIndexById(id: string): number {
        return messages.findIndex((m) => m.id === id);
    }

    function getMessageById(id: string) {
        return messages.find((m) => m.id === id);
    }

    async function sendMessage() {
        if (!newMessage.trim()) return;
        const payload = {
            text: newMessage,
            user: username,
            replyTo: replyToIndex,
        };
        const keep = newMessage;
        newMessage = "";

        try {
            const replyId =
                payload.replyTo !== null && messages[payload.replyTo]
                    ? messages[payload.replyTo].id
                    : undefined;
            await apiSendMessage(payload.text, payload.user, replyId);
        } catch (e) {
            alert("Message failed to send!");
            newMessage = keep;
            return;
        }

        replyToIndex = null;
    }

    function subscribeToMessages() {
        if (unsubscribe) unsubscribe();
        unsubscribe = getMessages((newMsgs) => {
            messages = newMsgs;
            setTimeout(() => {
                if (!chatContainer) return;
                if (isLoadingMore) {
                    const newHeight = chatContainer.scrollHeight;
                    chatContainer.scrollTop = newHeight - previousHeight;
                    isLoadingMore = false;
                } else {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            }, 50);
        }, batchSize);
    }

    onMount(() => {
        const handleVis = () => {
            if (!document.hidden) {
                subscribeToMessages();
            } else if (unsubscribe) {
                unsubscribe();
            }
        };
        document.addEventListener("visibilitychange", handleVis);
        handleVis();

        return () => {
            if (unsubscribe) unsubscribe();
            document.removeEventListener("visibilitychange", handleVis);
        };
    });
</script>

<div class="sulfur-container">
    <div class="header">
        <span>[*] public-chat</span>
        <input type="text" bind:value={$usernameStore} class="username-input" />
    </div>

    <div class="chat-history" bind:this={chatContainer}>
        <div class="load-more" on:click={loadMoreMessages}>-- load more --</div>

        {#each messages as msg, i (i)}
            {@const processed = processMessage(msg)}
            <div
                id={"message-" + i}
                class="message"
                style="--sender-color: {stringToColor(processed.user)}"
            >
                {#if msg.replyTo}
                    {@const parent = getMessageById(msg.replyTo)}
                    {#if parent}
                        {@const replied = processMessage(parent)}
                        <div
                            class="reply-context"
                            on:click={() =>
                                scrollToMessage(
                                    getMessageIndexById(msg.replyTo),
                                )}
                        >
                            ↱ {replied.user}: {replied.text}
                        </div>
                    {/if}
                {/if}

                <div class="message-line">
                    <span class="timestamp"
                        >[{formatTimestamp(processed.timestamp)}]</span
                    >
                    <span class="sender-name" class:owner={processed.isOwner}
                        >{processed.user}:</span
                    >
                    <span class="content">{processed.text}</span>
                    <span
                        class="reply-button"
                        on:click={() => (replyToIndex = i)}>↱ reply</span
                    >
                </div>
            </div>
        {:else}
            <div class="message system">
                <span class="content"
                    >No messages yet. Start the conversation!</span
                >
            </div>
        {/each}
    </div>

    {#if replyToIndex !== null && messages[replyToIndex]}
        {@const preview = processMessage(messages[replyToIndex])}
        <div class="reply-preview">
            replying to <strong>{preview.user}</strong>: {preview.text}
            <span class="cancel-reply" on:click={() => (replyToIndex = null)}
                >✖</span
            >
        </div>
    {/if}

    <div class="chat-input">
        <input
            type="text"
            bind:value={newMessage}
            placeholder="type a message..."
            on:keydown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button on:click={sendMessage} disabled={!newMessage.trim()}
            >send</button
        >
    </div>
</div>

<style>
    .sulfur-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #000;
        color: #b3b3b3;
        font-family: "Courier New", Courier, monospace;
        border-radius: 5px;
        overflow: hidden;
    }
    .header {
        padding: 5px 10px;
        background: #1a1a1a;
        border-bottom: 1px solid #333;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.9em;
    }
    .username-input {
        background: #333;
        color: #f0f0f0;
        border: 1px solid #555;
        border-radius: 3px;
        padding: 2px 5px;
        width: 120px;
        text-align: right;
    }
    .chat-history {
        flex-grow: 1;
        overflow-y: auto;
        padding: 10px;
    }
    .load-more {
        text-align: center;
        cursor: pointer;
        color: #888;
        margin-bottom: 10px;
    }
    .message {
        display: flex;
        flex-direction: column;
        margin-bottom: 5px;
        line-height: 1.3;
    }
    .message-line {
        display: grid;
        grid-template-columns: auto auto 1fr auto;
        column-gap: 8px;
        align-items: baseline;
    }
    .timestamp {
        color: #888;
        margin-right: 8px;
        white-space: nowrap;
        flex-shrink: 0;
    }
    .reply-context {
        color: #888;
        font-size: 0.85em;
        margin-bottom: 2px;
        cursor: pointer;
    }
    .sender-name {
        font-weight: bold;
        margin-right: 8px;
        color: var(--sender-color);
        white-space: nowrap;
        flex-shrink: 0;
    }
    .sender-name.owner {
        background: linear-gradient(to right, #00ffff, #fff, #00ffff);
        background-size: 200% 200%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: owner-gradient 3s ease infinite;
    }
    @keyframes owner-gradient {
        0% {
            background-position: 0% 50%;
        }
        50% {
            background-position: 100% 50%;
        }
        100% {
            background-position: 0% 50%;
        }
    }
    .content {
        word-break: break-word;
    }
    .message.system .content {
        width: 100%;
        text-align: center;
        font-style: italic;
        color: #888;
    }
    .chat-input {
        display: flex;
        padding: 10px;
        border-top: 1px solid #333;
    }
    .chat-input input {
        flex-grow: 1;
        background: #333;
        color: #f0f0f0;
        border: 1px solid #555;
        border-radius: 5px;
        padding: 5px 10px;
        outline: none;
    }
    .chat-input button {
        background: #4caf50;
        color: white;
        border: none;
        padding: 5px 15px;
        border-radius: 5px;
        margin-left: 10px;
        cursor: pointer;
    }
    .chat-input button:disabled {
        background: #555;
        cursor: not-allowed;
    }
    .reply-button {
        margin-left: 6px;
        cursor: pointer;
        color: #555;
        opacity: 0;
        transition: opacity 0.2s;
        white-space: nowrap;
    }
    .message:hover .reply-button {
        opacity: 1;
    }
    .reply-button:hover {
        color: #aaa;
    }
    .reply-preview {
        background: #222;
        padding: 5px;
        margin: 5px 0;
        font-size: 0.9em;
        color: #ddd;
    }
    .cancel-reply {
        margin-left: 8px;
        cursor: pointer;
        color: #f88;
    }
</style>
