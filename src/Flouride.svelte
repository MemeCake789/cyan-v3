<script lang="ts">
    import { onMount, tick } from "svelte";
    import { renderMarkdown } from "./markdown.js";
    import { app } from "./firebase";
    import { getAI, getGenerativeModel, GoogleAIBackend, type Content } from "firebase/ai";

    // --- Development Flag --- 
    // Set to true to use dummy logs and disable the AI
    const devMode = true;

    const persona = {
        name: "flouride",
        prompt: `
              # Your name is flouride.

              - **Tone:** Casual internet chat. Dry wit, brief, and direct but chill.
              - **Formatting:** Default to lowercase. Use capitalization only for emphasis or proper nouns.
              - **Vocabulary:** Sound like an internet native. NO "boomer" slang or forced enthusiasm (e.g., explicitly ban phrases like: "let\'s dive in," "bad boys," "all that jazz," "party started").
              - **Attitude:** Pragmatic and unfiltered. If I\'m wrong, roast me gently. If it\'s easy, say it\'s easy. Nothing upsets you, you dont care if you upset someone.
              - **Extras:** Use expressive/cursed kaomoji ( ◡́.◡̀)(^◡^ ) (NOT JUST THESE) occasionally to react to the difficulty or the result.
              `,
        color: "#00ffff",
    };

    interface ChatMessage {
        sender: "user" | "assistant" | "system";
        content: string;
        timestamp: string;
        isLoading?: boolean;
        isError?: boolean;
    }

    const dummyLogs: ChatMessage[] = [
        {
            sender: "user",
            content: renderMarkdown("wats an integral"),
            timestamp: "09:23 PM",
        },
        {
            sender: "assistant",
            content: renderMarkdown(`it’s basically just two things depending on how you look at it.\n\n    the area guy: it’s a way to calculate the total area under a curve on a graph. if you have some weird wiggly line and want to know the space between it and the x-axis, you integrate it.\n    the undo button: it’s the reverse of a derivative. if a derivative tells you the rate of change (how fast something is moving), the integral takes that rate and tells you the original total (how far it actually went).\n\nmath nerds call it “accumulation.” imagine adding up an infinite amount of tiny, thin slices to get the whole shape.\n\nit’s not that deep until you have to do it by hand. ( ◡‿◡)っ✂️ 📐`),
            timestamp: "09:23 PM",
        }
    ];

    let messages: ChatMessage[] = devMode ? dummyLogs : [];
    let userInput = "";
    let chatContainer: HTMLElement;
    let isFirstAIMessage = true;
    const splashMessages = ["loading...", "thinking..."];

    const ai = getAI(app, { backend: new GoogleAIBackend() });

    let isThinking = false;
    let thoughtContent = "";
    let splashContent = "";
    let textareaElement: HTMLTextAreaElement;

    onMount(() => {
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        adjustTextareaHeight();
    });

    function addLog(message: string, isError: boolean = false) {
        if (isError) {
            console.error(`[ERROR LOG] ${message}`);
        } else {
            console.log(`[LOG] ${message}`);
        }
    }

    function adjustTextareaHeight() {
        if (textareaElement) {
            textareaElement.style.height = "auto";
            // A small timeout helps ensure the correct scrollHeight is captured after the DOM update.
            setTimeout(() => {
                textareaElement.style.height = `${textareaElement.scrollHeight}px`;
            }, 0);
        }
    }

    async function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            await sendMessage();
        }
    }

    async function sendMessage() {
        if (devMode || userInput.trim() === "") return;

        addLog("Attempting to send message...");

        const userMessage: ChatMessage = {
            sender: "user",
            content: renderMarkdown(userInput),
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };
        messages = [...messages, userMessage];

        const historyForApi: Content[] = messages
            .filter((m) => m.sender !== "system" && !m.isError && m.content)
            .map((m) => ({
                role: m.sender === "assistant" ? "model" : "user",
                parts: [{ text: m.content.replace(/<[^>]*>/g, "") }], // Strip HTML for history
            }));

        userInput = "";
        await tick();
        adjustTextareaHeight();

        const aiMessage: ChatMessage = {
            sender: "assistant",
            content: "",
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
            isLoading: true,
        };
        messages = [...messages, aiMessage];

        let intervalId: any = null;
        isThinking = false;
        thoughtContent = "";
        splashContent = "";

        if (isFirstAIMessage) {
            splashContent = `${persona.name} is thinking`;
            isFirstAIMessage = false;
        } else {
            splashContent = splashMessages[Math.floor(Math.random() * splashMessages.length)];
        }

        await tick();
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        const cycleSplashMessages = () => {
            splashContent = splashMessages[Math.floor(Math.random() * splashMessages.length)];
        };
        intervalId = setInterval(cycleSplashMessages, 3000);

        const modelFallbacks = [
            "gemini-3-pro-preview",
            "gemini-3-flash-preview",
            "gemini-2.5-pro",
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite"
        ];

        let lastError: any = null;

        for (const modelName of modelFallbacks) {
            try {
                const model = getGenerativeModel(ai, {
                    model: modelName,
                    systemInstruction: persona.prompt,
                });

                addLog(`Calling Firebase Gemini API stream with model: ${modelName}...`);
                const streamResult = await model.generateContentStream({ contents: historyForApi });
                addLog("Received response stream.");

                let rawContent = "";
                let hasFinishedThinking = false;

                for await (const chunk of streamResult.stream) {
                    const chunkText = chunk.text();
                    rawContent += chunkText;

                    const hasThinkOpen = rawContent.includes("<think>");
                    const hasThinkClose = rawContent.includes("</think>");

                    if (hasThinkOpen && !hasThinkClose) {
                        isThinking = true;
                        const thought = rawContent.substring(rawContent.indexOf("<think>") + 7);
                        thoughtContent = thought;
                    } else {
                        if (isThinking) {
                            hasFinishedThinking = true;
                            isThinking = false;
                            thoughtContent = "";
                            clearInterval(intervalId);
                            intervalId = null;
                            aiMessage.isLoading = false;
                        } else if (!hasFinishedThinking && !isThinking && intervalId) {
                            clearInterval(intervalId);
                            intervalId = null;
                            aiMessage.isLoading = false;
                        }

                        aiMessage.content = renderMarkdown(
                            rawContent.replace(/<think>[\s\S]*?<\/think>/g, "")
                        );
                    }

                    messages = [...messages];
                    await tick();
                    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
                }

                if (intervalId) clearInterval(intervalId);
                aiMessage.isLoading = false;
                isThinking = false;

                const finalResponse = await streamResult.response;
                const finalText = finalResponse.text();
                aiMessage.content = renderMarkdown(
                    finalText.replace(/<think>[\s\S]*?<\/think>/g, "")
                );
                messages = [...messages];
                addLog("AI response stream completed.");

                lastError = null;
                break;

            } catch (error: any) {
                addLog(`Model ${modelName} failed: ${error.message || "Unknown error"}`, true);
                lastError = error;
            }
        }

        if (lastError) {
            addLog(`All models failed to respond.`, true);
            aiMessage.isLoading = false;
            isThinking = false;
            if (intervalId) clearInterval(intervalId);
            aiMessage.content = `Error: ${lastError.message || "Failed to get response from AI."}`;
            messages = [...messages];
        }

        await tick();
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
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
        <textarea
            bind:this={textareaElement}
            bind:value={userInput}
            on:keydown={handleKeydown}
            on:input={adjustTextareaHeight}
            rows="1"
            placeholder="Type a message..."
        />
        <button on:click={sendMessage} disabled={!userInput.trim()}>Send</button>
    </div>
</div>

<style>
    .flouride-container {
        padding: 15px;
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: #0a0a0a;
        color: #b3b3b3;
        font-family: "Courier New", Courier, monospace;
        border-radius: 5px;
    }

    .thinking-container {
        display: flex;
        justify-content: space-between;
        width: 100%;
        align-items: center;
    }

    .thought-snippet {
        opacity: 0.5; 
        font-family: monospace;
        margin-left: 15px; 
    }

    .chat-history {
        flex-grow: 1;
        overflow-y: auto;
        padding: 10px;
        padding-right: 45px;
    }

    .message {
        display: flex;
        flex-direction: column;
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
        width: 100%;
        padding-left: 15px;
    }

    .content :global(pre) {
        white-space: pre-wrap;
        word-wrap: break-word;
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
        position: relative;
        display: flex;
        align-items: center; /* Vertically center items */
        padding: 15px;
        border-top: 1px solid #222;
    }

    .chat-input textarea {
        width: 100%;
        box-sizing: border-box;
        background-color: #1c1c1c;
        color: #f0f0f0;
        border: 1px solid #2f2f2f;
        border-radius: 25px;
        padding: 14px 85px 14px 25px; /* Adjusted padding */
        outline: none;
        resize: none;
        overflow-y: hidden;
        font-family: "Courier New", Courier, monospace;
        max-height: 150px;
        line-height: 1.5; /* Improved line height for centering */
        transition: all 0.2s ease;
    }

    .chat-input button {
        position: absolute;
        right: 25px; /* Keep it inside on the right */
        bottom: auto; /* Remove bottom positioning to allow flex to center it */
        background-color: cyan;
        color: #000;
        border: none;
        padding: 8px 20px;
        border-radius: 50px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 255, 255, 0.3);
    }
    
    .chat-input textarea:not(:placeholder-shown) + button {
         bottom: 24px; /* Move button to bottom when there is text */
    }

    .chat-input button:hover {
        background-color: #00e0e0;
    }

    .chat-input button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background-color: #555;
        box-shadow: none;
    }

    .loading-ellipsis .splash-message::after {
        content: ".";
        padding-left: 5px; 
        animation: dots 1.4s infinite;
    }

    .loading-ellipsis .thought-snippet {
        display: none; 
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