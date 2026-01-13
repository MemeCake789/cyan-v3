<script lang="ts">
    import { onMount, tick } from "svelte";
    import { renderMarkdown } from "./markdown.js";
    import { InferenceClient } from "@huggingface/inference";

    const persona = {
        name: "flouride",
        prompt: `
              # Your name is flouride.

              - **Tone:** Casual internet chat. Dry wit, brief, and direct but chill.
              - **Formatting:** Default to lowercase. Use capitalization only for emphasis or proper nouns.
              - **Vocabulary:** Sound like an internet native. NO "boomer" slang or forced enthusiasm (e.g., explicitly ban phrases like: "let's dive in," "bad boys," "all that jazz," "party started").
              - **Attitude:** Pragmatic and unfiltered. If I'm wrong, roast me gently. If it's easy, say it's easy. Nothing upsets you, you dont care if you upset someone.
              - **Extras:** Use expressive/cursed kaomoji (0 ◡́.◡̀)(^◡^ ) occasionally to react to the difficulty or the result.
              `,
        color: "#00ffff",
    };

    interface ChatMessage {
        sender: string;
        content: string;
        timestamp: string;
        isLoading?: boolean;
        isError?: boolean;
    }

    let messages: ChatMessage[] = [];
    let userInput = "";
    let chatContainer: HTMLElement;
    let isFirstAIMessage = true;
    const splashMessages = ["1", "2"];

    // @ts-ignore
    const encodedKey = "aGZfSlJwZ1ZIUW1jRXdpemJWdXFyWXpjZXdHU3RSSXFJakFPZQo=";
    const client = new InferenceClient(atob(encodedKey));

    let isThinking = false;
    let thoughtContent = "";
    let splashContent = "";

    const systemPrompt = {
        role: "system",
        content: `${persona.prompt}`,
    };

    onMount(() => {
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    });

    function addLog(message: string, isError: boolean = false) {
        if (isError) {
            console.error(`[ERROR LOG] ${message}`);
        } else {
            console.log(`[LOG] ${message}`);
        }
    }

    async function sendMessage() {
        if (userInput.trim() === "") return;

        addLog("Attempting to send message...");

        const userMessage = {
            sender: "user",
            content: renderMarkdown(userInput),
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };
        messages = [...messages, userMessage];
        const history = messages
            .filter((m) => m.sender !== "system")
            .map((m) => ({
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

        let intervalId: any = null;

        // Reset states
        isThinking = false;
        thoughtContent = "";
        splashContent = "";

        try {
            // Set the initial splash message
            if (isFirstAIMessage) {
                splashContent = `${persona.name} is thinking`;
                isFirstAIMessage = false;
            } else {
                splashContent =
                    splashMessages[
                        Math.floor(Math.random() * splashMessages.length)
                    ];
            }

            await tick(); // Wait for DOM update
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }

            // Start cycling through the other messages
            const cycleSplashMessages = () => {
                splashContent =
                    splashMessages[
                        Math.floor(Math.random() * splashMessages.length)
                    ];
            };
            intervalId = setInterval(cycleSplashMessages, 3000);
            addLog("Calling Hugging Face API...");

            const stream = client.chatCompletionStream({
                model: "deepseek-ai/DeepSeek-R1:novita",
                messages: [{ ...systemPrompt }, ...history] as any,
                temperature: 0.1,
            });

            addLog("Received response stream.");

            let rawContent = "";
            let hasFinishedThinking = false;

            for await (const chunk of stream) {
                if (chunk.choices?.[0]?.delta?.content) {
                    rawContent += chunk.choices[0].delta.content;

                    const hasThinkOpen = rawContent.includes("<think>");
                    const hasThinkClose = rawContent.includes("</think>");

                    if (hasThinkOpen && !hasThinkClose) {
                        isThinking = true;
                        const thought = rawContent.substring(
                            rawContent.indexOf("<think>") + 7,
                        );
                        thoughtContent = thought;
                    } else {
                        if (isThinking) {
                            // We were thinking, now it's over
                            hasFinishedThinking = true;
                            isThinking = false;
                            thoughtContent = "";
                            clearInterval(intervalId);
                            intervalId = null;
                            aiMessage.isLoading = false; // Stop ellipsis animation
                        } else if (
                            !hasFinishedThinking &&
                            !isThinking &&
                            intervalId
                        ) {
                            // stream started but no think tag
                            clearInterval(intervalId);
                            intervalId = null;
                            aiMessage.isLoading = false; // Stop ellipsis animation
                        }

                        // If not thinking, render the cleaned content
                        aiMessage.content = renderMarkdown(
                            rawContent.replace(/<think>[\s\S]*?<\/think>/g, ""),
                        );
                    }

                    messages = [...messages];
                    await tick();
                    if (chatContainer)
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            }

            // Final cleanup after loop
            if (intervalId) clearInterval(intervalId);
            aiMessage.isLoading = false;
            isThinking = false;
            aiMessage.content = renderMarkdown(
                rawContent.replace(/<think>[\s\S]*?<\/think>/g, ""),
            );
            messages = [...messages];

            addLog("AI response stream completed.");
        } catch (error: any) {
            addLog(
                `Hugging Face AI Error: ${error.message || "Unknown error"}`,
                true,
            );
            aiMessage.isLoading = false;
            isThinking = false;
            if (intervalId) clearInterval(intervalId);
            aiMessage.content = `Error: ${error.message || "Failed to get response from AI."}`;
            messages = [...messages];
        }
    }
</script>

<div class="flouride-container">
    <div class="chat-history" bind:this={chatContainer}>
        {#each messages as message}
            <div
                class="message {message.sender}"
                class:error-log={message.isError}
            >
                {#if message.sender !== "system" || message.isError}
                    <div class="message-info">
                        <span class="timestamp">[{message.timestamp}] </span>
                        <span
                            class="sender-name"
                            style={message.sender === "assistant"
                                ? `color: ${persona.color}`
                                : ""}
                        >
                            {message.sender === "user"
                                ? "user"
                                : message.sender === "system"
                                  ? "SYSTEM"
                                  : persona.name}:
                        </span>
                    </div>
                {/if}

                <div
                    class="content"
                    class:loading-ellipsis={message.isLoading && !isThinking}
                >
                    {#if message.sender === "assistant" && message.isLoading}
                        <div class="thinking-container">
                            <span class="splash-message"
                                >{@html splashContent}</span
                            >
                            {#if isThinking}
                                <span class="thought-snippet"
                                    >{thoughtContent.slice(-25)}</span
                                >
                            {/if}
                        </div>
                    {:else}
                        {@html message.content}
                    {/if}
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
        background-color: #0a0a0a;
        color: #b3b3b3;
        font-family: "Courier New", Courier, monospace;
        border-radius: 5px;
        overflow: hidden;
    }

    .thinking-container {
        display: flex;
        justify-content: space-between;
        width: 100%;
        align-items: center;
    }

    .thought-snippet {
        opacity: 0.5; /* Make it dimmer */
        font-family: monospace;
        /*font-size: 0.9em;*/
        margin-left: 15px; /* Add space between splash and thought */
    }

    .auth-prompt {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        text-align: center;
        padding: 20px;
    }

    .auth-prompt button {
        background-color: #007bff;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1em;
        margin-top: 15px;
    }

    .auth-prompt button:hover {
        background-color: #0056b3;
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
        width: 100%; /* Ensure content div takes full width */
    }

    .content :global(.katex) {
        color: #00ffff;
    }

    .message.system .content {
        width: 100%;
        text-align: center;
        font-style: italic;
        font-size: 0.9em;
        color: #888;
    }

    .message.system.error-log .content {
        color: #ff5555;
    }

    .chat-input {
        display: flex;
        padding: 15px;
        border-top: 1px solid #222;
    }

    .chat-input input {
        flex-grow: 1;
        background-color: #111;
        color: #f0f0f0;
        border: 1px solid #242424;
        border-radius: 50px;
        padding: 5px 10px;
        outline: none;
    }

    .chat-input button {
        background-color: cyan;
        color: #000;
        border: none;
        padding: 5px 15px;
        border-radius: 50px;
        margin-left: 10px;
        cursor: pointer;
    }

    .loading-ellipsis .splash-message::after {
        content: ".";
        padding-left: 5px; /* Add some space */
        animation: dots 1.4s infinite;
    }

    .loading-ellipsis .thought-snippet {
        display: none; /* Hide thought snippet when not thinking, to prevent ellipsis from showing */
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
