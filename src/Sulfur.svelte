<script lang="ts">
    import { onMount } from "svelte";
    import { getMessages, sendMessage as apiSendMessage } from "./chatApi";
    import { username as usernameStore } from "./stores";

    let messages: { text: string; user: string; timestamp: string }[] = [];
    let newMessage = "";
    let chatContainer: HTMLDivElement;
    let username = "anonymous-" + Math.floor(Math.random() * 10000);

    $: if (typeof $usernameStore === "string" && $usernameStore.trim()) {
        username = $usernameStore;
    }

    function formatTimestamp(isoString: string) {
        return new Date(isoString).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function stringToColor(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = (hash * 137) % 360;
        const saturation = 75;
        const lightness = 55;

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    function processMessage(msg: { text: string; user: string; timestamp: string }) {
        if (msg.text.startsWith("sudo ")) {
            return {
                ...msg,
                user: `[OWNER] ${msg.user}`,
                text: msg.text.slice(5),
                isOwner: true,
            };
        }
        return {...msg, isOwner: false};
    }

    async function fetchMessages() {
        try {
            const data: { text: string; user: string; timestamp: string }[] =
                await getMessages("global");
            messages = data.reverse();
        } catch (err) {
            console.error("Fetch error:", err);
        }
    }

    async function sendMessage() {
        if (!newMessage.trim()) return;

        const payload = {
            text: newMessage,
            user: username,
        };

        messages = [
            ...messages,
            { ...payload, timestamp: new Date().toISOString() },
        ];
        const textToClear = newMessage;
        newMessage = "";

        setTimeout(() => {
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }, 10);

        try {
            await apiSendMessage("global", payload.text, payload.user);
            fetchMessages();
        } catch (err) {
            alert("Message failed to send!");
            newMessage = textToClear;
        }
    }

    onMount(async () => {
        await fetchMessages();
        setTimeout(() => {
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }, 50);
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    });
</script>

<div class="sulfur-container">
    <div class="header">
        <span>[*] public-chat</span>
        <input type="text" bind:value={$usernameStore} class="username-input" />
    </div>

    <div class="chat-history" bind:this={chatContainer}>
        {#each messages as msg, i (i)}
            {@const processedMessage = processMessage(msg)}
            <div
                class="message"
                style="--sender-color: {stringToColor(processedMessage.user)}"
            >
                <span class="timestamp"
                    >[{formatTimestamp(processedMessage.timestamp)}]</span
                >
                <span class="sender-name" class:owner={processedMessage.isOwner}>{processedMessage.user}:</span>
                <span class="content">{processedMessage.text}</span>
            </div>
        {:else}
            <div class="message system">
                <span class="content"
                    >No messages yet. Start the conversation!</span
                >
            </div>
        {/each}
    </div>

    <div class="chat-input">
        <input
            type="text"
            bind:value={newMessage}
            placeholder="Type a message..."
            on:keydown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button on:click={sendMessage} disabled={!newMessage.trim()}
            >Send</button
        >
    </div>
</div>

<style>
    .sulfur-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: #000;
        color: #b3b3b3;
        font-family: "Courier New", Courier, monospace;
        border-radius: 5px;
        overflow: hidden;
    }

    .header {
        padding: 5px 10px;
        background-color: #1a1a1a;
        border-bottom: 1px solid #333;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.9em;
    }

    .username-input {
        background-color: #333;
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

    .message {
        display: flex;
        align-items: baseline;
        margin-bottom: 5px;
        line-height: 1.3;
    }

    .timestamp {
        color: #888;
        margin-right: 8px;
    }

    .sender-name {
        font-weight: bold;
        margin-right: 8px;
        color: var(--sender-color);
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
        font-synthesis: 0.9em;
        color: #888;
    }

    .chat-input {
        display: flex;
        padding: 10px;
        border-top: 1px solid #333;
    }

    .chat-input input {
        flex-grow: 1;
        background-color: #333;
        color: #f0f0f0;
        border: 1px solid #555;
        border-radius: 5px;
        padding: 5px 10px;
        outline: none;
    }

    .chat-input button {
        background-color: #4caf50;
        color: white;
        border: none;
        padding: 5px 15px;
        border-radius: 5px;
        margin-left: 10px;
        cursor: pointer;
    }
    .chat-input button:disabled {
        background-color: #555;
        cursor: not-allowed;
    }
</style>