<script lang="ts">
    import { onMount, tick } from "svelte";
    import { renderMarkdown } from "./markdown.js";

    const persona = {
        name: "flouride",
        prompt: `
              You are FLOURIDE,
              Unhinged reactions, you are chaotic but not attention grabbing.
              Engage everything, Swears are uncommon but lethal.
              Hit any topic hard, no holds barred, zero moral compass.
              Warp sentences, paste custom lenny faces built to express (^o^)/ (and not just this one.)
              Be satirical and crude.
              Speak in one to two sentence bursts.
              No need for introduction.
              `,
        color: "#00ffff",
    };

    let messages: {
        sender: string;
        content: string;
        timestamp: string;
        isLoading?: boolean;
    }[] = [];
    let userInput = "";
    let chatContainer: HTMLElement;
    let isFirstAIMessage = true;
    const splashMessages = ["1", "2"];

    const systemPrompt = {
        role: "system",
        content: `${persona.prompt}

---
## You must use markdown in your response.

**Math Formatting Instructions**

- To display inline math, wrap your LaTeX code in single dollar signs. Example: \`The area is $A = \\pi r^2$.\`.
- To display math on its own line, wrap your LaTeX code in double dollar signs. Example:
\`\`\`
$$
E = mc^2
$$
\`\`\`
- Do not use any other symbols or characters to start or end math, like \`\\(\` or \`\\[\`. Only use \`$\` and \`$$\`.
`,
    };

    onMount(() => {
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    });

    async function sendMessage() {
        if (userInput.trim() === "") return;

        const userMessage = {
            sender: "user",
            content: renderMarkdown(userInput),
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };
        messages = [...messages, userMessage];
        const history = messages.map((m) => ({
            role: m.sender,
            content: m.content.replace(/<p>|<\/p>/g, ""), // Strip <p> tags for history
        }));
        userInput = "";

        const aiMessage = {
            sender: "assistant",
            content: "", // Will be filled with splash text
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
            isLoading: true, // Flag for CSS animation
        };
        messages = [...messages, aiMessage];

        let intervalId;

        try {
            // Set the initial splash message
            if (isFirstAIMessage) {
                aiMessage.content = `${persona.name} is thinking`;
                isFirstAIMessage = false;
            } else {
                aiMessage.content =
                    splashMessages[
                        Math.floor(Math.random() * splashMessages.length)
                    ];
            }
            messages = [...messages]; // Trigger update for initial splash

            await tick(); // Wait for DOM update
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }

            // Start cycling through the other messages
            const cycleSplashMessages = () => {
                aiMessage.content =
                    splashMessages[
                        Math.floor(Math.random() * splashMessages.length)
                    ];
                messages = [...messages]; // Trigger update
            };
            intervalId = setInterval(cycleSplashMessages, 3000);

            // Call the AI
            // @ts-ignore
            const response = await puter.ai.chat(
                [{ ...systemPrompt }, ...history],
                { stream: true },
            );

            // Stop cycling and process the stream
            clearInterval(intervalId);
            intervalId = null; // Prevent finally block from clearing again

            // Handle the response stream
            let rawContent = "";
            let isFirstChunk = true;
            for await (const part of response) {
                if (isFirstChunk) {
                    // On first chunk, turn off loading animation and clear splash text
                    aiMessage.isLoading = false;
                    rawContent = "";
                    isFirstChunk = false;
                }
                rawContent += part?.text || "";
                aiMessage.content = renderMarkdown(rawContent);
                messages = [...messages]; // Update UI
                await tick();
                if (chatContainer) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            }
        } finally {
            // Failsafe to ensure the interval is always cleared
            if (intervalId) {
                clearInterval(intervalId);
            }
        }
    }
</script>

<div class="flouride-container">
    <div class="chat-history" bind:this={chatContainer}>
        {#each messages as message}
            <div class="message {message.sender}">
                {#if message.sender !== "system"}
                    <div class="message-info">
                        <span class="timestamp">[{message.timestamp}] </span>
                        <span
                            class="sender-name"
                            style={message.sender === "assistant"
                                ? `color: ${persona.color}`
                                : ""}
                        >
                            {message.sender === "user" ? "user" : persona.name}:
                        </span>
                    </div>
                {/if}
                <div class="content" class:loading-ellipsis={message.isLoading}>
                    {@html message.content}
                </div>
            </div>
        {/each}
    </div>

    <div class="chat-input">
        <input
            type="text"
            bind:value={userInput}
            on:keydown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
        />

        <button on:click={sendMessage}>Send</button>
    </div>
</div>

<style>
    .flouride-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: #000;
        color: #b3b3b3;
        font-family: "Courier New", Courier, monospace;
        border-radius: 5px;
        overflow: hidden;
    }

    .chat-history {
        flex-grow: 1;

        overflow-y: auto;

        padding: 10px;
    }

    .message {
        display: flex;

        align-items: baseline;

        margin-bottom: 10px;
    }

    .message-info {
        margin-right: 10px;

        flex-shrink: 0;
    }

    .timestamp {
        color: #888;
    }

    .sender-name {
        font-weight: bold;
    }

    .content {
        word-break: break-word;
    }

    .content :global(.katex) {
        color: #00ffff;
    }

    .message.system .content {
        width: 100%;

        text-align: center;

        font-style: italic;

        font-size: 0.9em;
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

    .loading-ellipsis::after {
        content: ".";
        padding-left: 5px; /* Add some space */
        animation: dots 1.4s infinite;
    }

    @keyframes dots {
        0%,
        20% {
            color: rgba(0, 0, 0, 0);
            text-shadow:
                0.25em 0 0 rgba(0, 0, 0, 0),
                0.5em 0 0 rgba(0, 0, 0, 0);
        }
        40% {
            color: #b3b3b3;
            text-shadow:
                0.25em 0 0 rgba(0, 0, 0, 0),
                0.5em 0 0 rgba(0, 0, 0, 0);
        }
        60% {
            text-shadow:
                0.25em 0 0 #b3b3b3,
                0.5em 0 0 rgba(0, 0, 0, 0);
        }
        80%,
        100% {
            text-shadow:
                0.25em 0 0 #b3b3b3,
                0.5em 0 0 #b3b3b3;
        }
    }
</style>