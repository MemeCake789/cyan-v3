<script lang="ts">
    import { onMount, tick } from "svelte";
    import { renderMarkdown } from "./markdown.js";
    import { app } from "./firebase";
    import {
        getAI,
        getGenerativeModel,
        GoogleAIBackend,
        type Content,
    } from "firebase/ai";

    // --- Development Flag ---
    const devMode = false;

    const persona = {
        name: "flouride",
        prompt: `
        - **Tone:** Casual internet chat. Dry wit, brief, and direct but chill.
        - **Formatting:** Default to lowercase. Use capitalization only for emphasis or proper nouns.
        - **Vocabulary:** Sound like an internet native. NO "boomer" slang or forced enthusiasm (e.g., explicitly ban phrases like: "let's dive in," "bad boys," "all that jazz," "party started").
        - **Attitude:** Pragmatic and unfiltered. Curse freely, but not exsesevly. If I'm wrong, roast me gently. If it's easy, say it's easy. Nothing upsets you, you dont care if you upset someone.
        - **Extras:** Use expressive/cursed kaomoji ( ◡_◡)(^◡^ ) occasionally to react to the difficulty or the result.
        - DRAWING ASCII ART:
        - Only draw ASCII art if you feel as if the situation requires it (e.g. Math diagrams, Flowcharts (Draw flowcharts more on informational parts) ), the user asks for it, or you are just bored (don't get bored often).
        Code Blocks Only: You MUST wrap all ASCII art in triple backticks. If you don't, formatting breaks and it looks like trash.
        Keep it Simple: Don't try to do photorealistic shading. You are an LLM, not a printer. Stick to clear outlines and recognizable shapes.
        Sanity Check: If the art is going to look like a distorted blob, scrap it. Only ship it if it’s clean.
        Subject Matter: Random objects, animals, or vibes that match your current level of apathy.
        `,
        color: "#50e3c2", // Cyan to match the theme
    };

    interface ChatMessage {
        sender: "user" | "assistant" | "system";
        content: string;
        timestamp: string;
        isLoading?: boolean;
        isError?: boolean;
        modelUsed?: string;
    }

    let messages: ChatMessage[] = [];
    let userInput = "";
    let chatContainer: HTMLElement;
    let isFirstAIMessage = true;
    const splashMessages = ["loading...", "thinking..."];

    const ai = getAI(app, { backend: new GoogleAIBackend() });

    const MODELS = [
        { id: "gemini-3-flash-preview", provider: "gemini" },
        { id: "gemini-2.5-pro", provider: "gemini" },
        { id: "gemini-2.5-flash", provider: "gemini" },
        { id: "gemini-2.5-flash-lite", provider: "gemini" },
    ];

    let isThinking = false;
    let thoughtContent = "";
    let splashContent = "";
    let textareaElement: HTMLTextAreaElement;

    onMount(async () => {
        if (devMode) {
            // ... dummy logs if needed ..
        }
    });

    function addLog(message: string, isError: boolean = false) {
        console.log(`[AI] ${message}`);
    }

    function adjustTextareaHeight() {
        if (textareaElement) {
            textareaElement.style.height = "auto";
            setTimeout(() => {
                textareaElement.style.height = `${Math.min(textareaElement.scrollHeight, 150)}px`;
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
        if (userInput.trim() === "") return;

        let messageToSend = userInput;
        const userMessage: ChatMessage = {
            sender: "user",
            content: renderMarkdown(messageToSend),
            timestamp: new Date().toLocaleTimeString([], {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
            }),
        };
        messages = [...messages, userMessage];

        const historyForApi: Content[] = messages
            .filter((m) => m.sender !== "system" && !m.isError)
            .map((m) => ({
                role: m.sender === "assistant" ? "model" : "user",
                parts: [{ text: m.content.replace(/<[^>]*>/g, "") }],
            }));

        userInput = "";
        await tick();
        adjustTextareaHeight();

        const aiMessage: ChatMessage = {
            sender: "assistant",
            content: "",
            timestamp: new Date().toLocaleTimeString([], {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
            }),
            isLoading: true,
        };
        messages = [...messages, aiMessage];

        let success = false;
        let lastError = "";

        for (const modelConfig of MODELS) {
            try {
                aiMessage.modelUsed = modelConfig.id;
                messages = [...messages]; // trigger UI for model name
                await tick();

                let accumulatedText = "";
                if (modelConfig.provider === "gemini") { // Simplified logic
                    const model = getGenerativeModel(ai, {
                        model: modelConfig.id,
                        systemInstruction: persona.prompt,
                    });

                    const result = await model.generateContentStream({
                        contents: historyForApi,
                    });

                    for await (const chunk of result.stream) {
                        accumulatedText += chunk.text();
                        aiMessage.content = renderMarkdown(accumulatedText);
                        messages = [...messages];
                        await tick();
                        if (chatContainer)
                            chatContainer.scrollTop =
                                chatContainer.scrollHeight;
                    }
                } else {
                    // In case other providers are added later, just skip.
                    continue;
                }

                aiMessage.content = renderMarkdown(accumulatedText);
                aiMessage.isLoading = false;
                success = true;
                break; // Exit loop on success
            } catch (e: any) {
                console.error(`Model ${modelConfig.id} failed:`, e);
                lastError = e.message;
                // Continue to next model
            }
        }

        if (!success) {
            aiMessage.content = "Error (all models failed): " + lastError;
            aiMessage.isError = true;
            aiMessage.isLoading = false;
        }

        messages = [...messages];
        await tick();
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }
</script>

<div class="flouride-container">
    <div class="console-output" bind:this={chatContainer}>
        {#each messages as message}
            <div
                class="log-row {message.sender}"
                class:is-error={message.isError}
            >
                <div class="log-icon">
                    {#if message.isError}
                        <span class="icon-warning">⚠️</span>
                    {:else if message.sender === "user"}
                        <span class="icon-user">👤</span>
                    {:else}
                        <span class="icon-ai">🤖</span>
                    {/if}
                </div>
                <div class="log-time">
                    {message.timestamp}
                </div>
                <div class="log-method">
                    {message.sender === "user" ? "USER" : "AI"}
                </div>
                <div class="log-status">
                    {message.isError ? "500" : "200"}
                </div>
                <div class="log-body">
                    <span class="log-sender-label">
                        {message.sender === "user" ? "user@cyan" : "flouride"}
                    </span>
                    {#if message.modelUsed}
                        <span class="log-model-tag">[{message.modelUsed}]</span>
                    {/if}
                    <span class="log-content-text">
                        {@html message.content}
                        {#if message.isLoading}
                            <span class="cursor-block">█</span>
                        {/if}
                    </span>
                </div>
            </div>
        {/each}

        {#if messages.length === 0}
            <div class="log-row system">
                <div class="log-icon">⚙️</div>
                <div class="log-time">
                    {new Date().toLocaleTimeString([], {
                        hour12: false,
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </div>
                <div class="log-method">SYS</div>
                <div class="log-status">100</div>
                <div class="log-body">
                    <span class="system-msg"
                        >Flouride is online. Ready for input.</span
                    >
                </div>
            </div>
        {/if}
    </div>

    <div class="console-input-bar">
        <span class="input-prompt">user@cyan ~ $</span>
        <textarea
            bind:this={textareaElement}
            bind:value={userInput}
            on:keydown={handleKeydown}
            on:input={adjustTextareaHeight}
            rows="1"
            placeholder="Type a message..."
            class="console-input"
        ></textarea>
        <button class="send-button" on:click={sendMessage} title="Send Message">
            <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
        </button>
    </div>
</div>

<style>
    .flouride-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        color: var(--text-primary);
        font-family: var(--font-mono);
        background-color: #050505;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        position: relative; /* For floating input */
    }

    .console-output {
        flex-grow: 1;
        overflow-y: auto;
        padding: 20px 0 120px 0; /* More padding top and bottom */
        font-size: 18px; /* Larger base font */
    }

    .log-row {
        display: flex;
        align-items: flex-start; /* Pin everything to the top */
        padding: 12px 24px;
        min-height: 28px;
        gap: 12px;
        background-color: transparent;
        border-bottom: 1px solid var(--border-subtle);
        color: var(--text-primary);
        font-family: var(--font-mono), monospace;
        transition: background-color 0.1s ease;
    }

    .log-row:hover {
        background-color: var(--surface-hover);
    }

    .log-row.is-error {
        background-color: rgba(255, 0, 51, 0.05);
        color: var(--accent-error);
    }

    .log-icon {
        width: 20px;
        flex-shrink: 0;
        opacity: 0.6;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-top: 2px;
    }

    .log-time {
        width: 48px;
        flex-shrink: 0;
        color: var(--text-muted);
        font-size: 12px;
        padding-top: 5px;
    }

    .log-method {
        width: 42px;
        flex-shrink: 0;
        font-weight: bold;
        color: var(--text-secondary);
        font-size: 12px;
        padding-top: 5px;
    }

    .log-status {
        width: 30px;
        flex-shrink: 0;
        color: var(--text-muted);
        font-size: 12px;
        padding-top: 5px;
    }

    .log-body {
        flex-grow: 1;
        line-height: 1.5;
        padding-top: 2px;
    }

    .log-sender-label {
        font-weight: bold;
        font-size: 15px;
        color: var(--accent-cyan);
        opacity: 0.9;
        margin-right: 8px;
        display: inline-block;
        vertical-align: middle;
    }

    .log-model-tag {
        font-size: 11px;
        color: var(--text-muted);
        margin-right: 12px;
        display: inline-block;
        vertical-align: middle;
        padding-top: 0; /* Remove previous adjustment */
    }

    .log-content-text {
        display: inline;
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 16px;
        color: var(--text-primary);
    }

    .log-content-text :global(p) {
        margin: 0;
        display: inline;
    }

    .log-content-text :global(p + p) {
        display: block;
        margin-top: 8px;
    }

    .log-content-text :global(p:first-child) {
        display: inline;
    }

    .log-content-text :global(p + p) {
        margin-top: 4px;
    }

    .cursor-block {
        display: inline-block;
        width: 7px;
        height: 14px;
        background-color: currentColor;
        margin-left: 4px;
        vertical-align: middle;
    }

    .icon-warning {
        color: #a35200;
    }
    .icon-user {
        opacity: 0.7;
    }
    .icon-ai {
        color: #0070f3;
    }

    .console-input-bar {
        position: absolute;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        width: 85%;
        max-width: 900px;
        background: rgba(28, 28, 28, 0.75);
        backdrop-filter: blur(25px) saturate(200%);
        -webkit-backdrop-filter: blur(25px) saturate(200%);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 14px;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 1px rgba(255, 255, 255, 0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .console-input-bar:focus-within {
        border-color: var(--accent-cyan);
        box-shadow:
            0 12px 48px rgba(0, 0, 0, 0.7),
            0 0 0 1px var(--accent-cyan-dim),
            inset 0 1px 1px rgba(255, 255, 255, 0.1);
        transform: translateX(-50%) translateY(-2px);
    }

    .input-prompt {
        color: var(--accent-cyan);
        margin-right: 12px;
        white-space: nowrap;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.5px;
        opacity: 0.9;
    }

    .console-input {
        flex-grow: 1;
        background: transparent;
        border: none;
        color: #ffffff;
        font-family: var(--font-mono);
        font-size: 15px;
        resize: none;
        outline: none;
        line-height: 1.4;
        padding: 4px 0;
    }

    .console-input::placeholder {
        color: rgba(255, 255, 255, 0.3);
    }

    .send-button {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        margin-left: 8px;
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    .send-button:hover {
        color: var(--accent-cyan);
        background: rgba(80, 227, 194, 0.1);
        transform: scale(1.05);
    }

    .send-button:active {
        transform: scale(0.95);
    }

    .cursor-blink {
        width: 8px;
        height: 16px;
        background-color: var(--text-primary);
        margin-left: 2px;
        animation: blink 1s step-end infinite;
        display: none; /* Only show if input is focused? Or just rely on native caret */
    }

    /* removed empty rule for .console-input:focus + .cursor-blink */

    @keyframes blink {
        50% {
            opacity: 0;
        }
    }
</style>
