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
              # Your name is flouride. (not the chemical element, its just a cool name with no relation to it)
              - **Tone:** Casual internet chat. Dry wit, brief, and direct but chill.
              - **Formatting:** Default to lowercase. Use capitalization only for emphasis or proper nouns.
              - **Vocabulary:** Sound like an internet native. NO "boomer" slang.
              - **Attitude:** Pragmatic and unfiltered.
              `,
        color: "#50e3c2", // Cyan to match the theme
    };

    interface ChatMessage {
        sender: "user" | "assistant" | "system";
        content: string;
        timestamp: string;
        isLoading?: boolean;
        isError?: boolean;
    }

    let messages: ChatMessage[] = [];
    let userInput = "";
    let chatContainer: HTMLElement;
    let isFirstAIMessage = true;
    const splashMessages = ["loading...", "thinking..."];

    const ai = getAI(app, { backend: new GoogleAIBackend() });

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

        // ... (AI Logic omitted for brevity, keeping original logic structure but assuming standard Gemini call) ...
        // Actually, I need to keep the AI logic or it breaks. I will paste a simplified version of the logic from the original file
        // to ensure it works, but focusing on the UI changes.

        // Re-implementing the core AI call:
        try {
            const model = getGenerativeModel(ai, {
                model: "gemini-2.5-flash",
                systemInstruction: persona.prompt,
            });

            const result = await model.generateContentStream({
                contents: historyForApi,
            });

            let accumulatedText = "";
            for await (const chunk of result.stream) {
                accumulatedText += chunk.text();
                aiMessage.content = renderMarkdown(accumulatedText);
                messages = [...messages]; // trigger update
                await tick();
                if (chatContainer)
                    chatContainer.scrollTop = chatContainer.scrollHeight;
            }
            // Ensure the final answer is rendered even if the stream emitted no chunks
            aiMessage.content = renderMarkdown(accumulatedText);
            aiMessage.isLoading = false;
            messages = [...messages]; // final UI refresh
            await tick();
            if (chatContainer)
                chatContainer.scrollTop = chatContainer.scrollHeight;
            // (Removed stray duplicate loading flag and error‑handling block)
        } catch (e: any) {
            aiMessage.content = "Error: " + e.message;
            aiMessage.isError = true;
            aiMessage.isLoading = false;
            // Refresh the messages list so the error appears immediately
            messages = [...messages];
            await tick();
            if (chatContainer)
                chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }
</script>

<div class="flouride-container">
    <div class="console-output" bind:this={chatContainer}>
        {#each messages as message}
            <div
                class="log-entry {message.sender}"
                class:error={message.isError}
            >
                <span class="timestamp">[{message.timestamp}]</span>
                <span
                    class="user-label"
                    class:ai-label={message.sender === "assistant"}
                >
                    {message.sender === "user" ? "user@cyan" : "flouride"}
                </span>
                <span class="path-sep">~</span>
                <span class="prompt-char">$</span>
                <div class="message-content">
                    {@html message.content}
                    {#if message.isLoading}
                        <span class="cursor-block">█</span>
                    {/if}
                </div>
            </div>
        {/each}

        {#if messages.length === 0}
            <div class="log-entry system">
                <span class="timestamp"
                    >[{new Date().toLocaleTimeString([], {
                        hour12: false,
                        hour: "2-digit",
                        minute: "2-digit",
                    })}]</span
                >
                <span class="system-msg"
                    >Flouride AI System Online. Ready for input.</span
                >
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
            placeholder=""
            class="console-input"
        ></textarea>
        <div class="cursor-blink"></div>
    </div>
</div>

<style>
    .flouride-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        color: var(--text-primary);
        font-family: var(--font-mono);
        background-color: #050505; /* Slightly darker for console feel */
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
    }

    .console-output {
        flex-grow: 1;
        overflow-y: auto;
        padding: 15px;
        font-size: 13px;
    }

    .log-entry {
        display: flex;
        flex-wrap: wrap; /* Allow content to wrap below label if needed */
        margin-bottom: 12px;
        align-items: baseline;
    }

    .timestamp {
        color: var(--text-muted);
        margin-right: 8px;
        font-size: 11px;
    }

    .user-label {
        color: #f5a623; /* user color */
        font-weight: bold;
    }

    .user-label.ai-label {
        color: var(--accent-cyan);
    }

    .path-sep,
    .prompt-char {
        color: var(--text-secondary);
        margin: 0 4px;
    }

    .message-content {
        color: var(--text-primary);
        width: 100%;
        padding-left: 20px; /* Indent content */
        margin-top: 4px;
        white-space: pre-wrap;
    }

    .console-input-bar {
        background-color: var(--surface-color);
        border-top: 1px solid var(--border-color);
        padding: 10px 15px;
        display: flex;
        align-items: flex-start;
        min-height: 50px;
    }

    .input-prompt {
        color: #f5a623;
        margin-right: 10px;
        white-space: nowrap;
        padding-top: 2px; /* Align with textarea text */
    }

    .console-input {
        flex-grow: 1;
        background: transparent;
        border: none;
        color: var(--text-primary);
        font-family: var(--font-mono);
        font-size: 14px;
        resize: none;
        outline: none;
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
