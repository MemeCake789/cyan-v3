<script lang="ts">
    import { onMount, tick } from "svelte";
    import { renderMarkdown } from "./markdown.js";
    import { app } from "./firebase";
    import { getAI, getGenerativeModel, GoogleAIBackend, type Content } from "firebase/ai";

    // --- Development Flag ---
    // Set to true to use dummy logs and disable the AI
    const devMode = false;

    const persona = {
        name: "flouride",
        prompt: `
              # Your name is flouride.

              - **Tone:** Casual internet chat. Dry wit, brief, and direct but chill.
              - **Formatting:** Default to lowercase. Use capitalization only for emphasis or proper nouns.
              - **Vocabulary:** Sound like an internet native. NO "boomer" slang or forced enthusiasm (e.g., explicitly ban phrases like: "let's dive in," "bad boys," "all that jazz," "party started").
              - **Attitude:** Pragmatic and unfiltered. If I'm wrong, roast me gently. If it's easy, say it's easy. Nothing upsets you, you dont care if you upset someone.
              - **Extras:** Use expressive/cursed kaomoji ( ◡́.◡́)(^◡^ ) (NOT JUST THESE) occasionally to react to the difficulty or the result.
              - **Image Generation:** To generate an image, use the format <image>{"prompt": "a description", "width": 1024, "height": 1024, "negative_prompt": "blurry"}</image>. The prompt is the only required field.
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
        },
        {
            sender: "user",
            content: renderMarkdown("can you generate an image of a cat riding a skateboard?"),
            timestamp: "09:24 PM",
        },
        {
            sender: "assistant",
            content: renderMarkdown('aight, one cat on a skateboard coming up.\n<image>{"prompt": "a cat riding a skateboard", "width": 512, "height": 512}</image>'),
            timestamp: "09:24 PM",
        }
    ];

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

    let showPlusMenu = false;
    let imageGenModeActive = false;

    function activateImageGenMode() {
        imageGenModeActive = true;
        showPlusMenu = false;
    }

    function deactivateImageGenMode() {
        imageGenModeActive = false;
    }

    let showImageGenNotification = false;

    function dismissImageGenNotification() {
        showImageGenNotification = false;
    }

    onMount(async () => {
        const viewCount = parseInt(localStorage.getItem("imageGenNotificationViewCount") || "0");
        if (viewCount < 2) {
            showImageGenNotification = true;
            localStorage.setItem("imageGenNotificationViewCount", (viewCount + 1).toString());
        }

        if (devMode) {
            messages = dummyLogs;
            await tick();
            for(let i = 0; i < messages.length; i++){
                if(messages[i].content.includes("<image>")){
                    await handleImageTag(messages[i]);
                }
            }
        }
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

    interface ImageGenerationParams {
        prompt: string;
        width?: number;
        height?: number;
        negative_prompt?: string;
    }

    async function generateImage(params: ImageGenerationParams): Promise<string> {
        addLog(`Generating image with params: ${JSON.stringify(params)}`);
        if(devMode) {
            // In dev mode, return a placeholder image after a short delay
            return new Promise(resolve => setTimeout(() => resolve("https://i.imgur.com/gYCYp5I.jpeg"), 1500));
        }

        const encodedApiKey = 'cGtfTUltdWQ3OTNSYUU2TWZaRQ==';
        const apiKey = atob(encodedApiKey); // Decode from base64

        const encodedPrompt = encodeURIComponent(params.prompt);
        let imageUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?model=flux&key=${apiKey}`;

        if (params.width) {
            imageUrl += `&width=${params.width}`;
        }
        if (params.height) {
            imageUrl += `&height=${params.height}`;
        }
        if (params.negative_prompt) {
            imageUrl += `&negative_prompt=${encodeURIComponent(params.negative_prompt)}`;
        }

        addLog(`Calling Pollinations AI with URL: ${imageUrl}`);

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = imageUrl;
            img.onload = () => resolve(imageUrl);
            img.onerror = () => reject(new Error("Failed to load image from Pollinations AI."));
        });
    }


    async function handleImageTag(message: ChatMessage) {
        const imageRegex = /<image>(.*?)<\/image>/g;
        let match;

        // Use a unique ID for each placeholder
        const placeholderId = `placeholder-${Date.now()}`;
        const spinnerId = `spinner-${Date.now()}`;

        // Replace <image> tag with a placeholder div that includes a spinner span
        const imageParamsJson = (/<image>(.*?)<\/image>/).exec(message.content)?.[1] || '{}';
        let imageParams: ImageGenerationParams;
        let imagePrompt: string;
        try {
            imageParams = JSON.parse(imageParamsJson);
            imagePrompt = imageParams.prompt;
        } catch(e) {
            console.error("Invalid image params JSON:", imageParamsJson);
            imagePrompt = imageParamsJson; // Fallback to using the whole string as prompt
            imageParams = { prompt: imagePrompt };
        }

        const placeholder = `<div id="${placeholderId}" class="image-placeholder" style="display: flex; align-items: center; justify-content: center; flex-direction: column;">
                                <span id="${spinnerId}" style="font-size: 2em; margin-bottom: 10px;"></span>
                                <span>generating image: "${imagePrompt}"</span>
                             </div>`;
        message.content = message.content.replace(/<image>.*?<\/image>/, placeholder);
        messages = [...messages]; // Update UI
        await tick();

        // Start the spinner animation
        const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let frameIndex = 0;
        const intervalId = setInterval(() => {
            const spinnerEl = document.getElementById(spinnerId);
            if (spinnerEl) {
                spinnerEl.textContent = spinnerFrames[frameIndex];
                frameIndex = (frameIndex + 1) % spinnerFrames.length;
            } else {
                clearInterval(intervalId);
            }
        }, 80);

        try {
            const imageUrl = await generateImage(imageParams);
            clearInterval(intervalId); // Stop spinner

            const img = new Image();
            img.src = imageUrl;
            img.onload = () => {
                const imageElement = `<img src="${imageUrl}" alt="${imagePrompt}" class="generated-image" />`;
                const placeholderEl = document.getElementById(placeholderId);
                if (placeholderEl) {
                    placeholderEl.outerHTML = imageElement;
                }
            };
            img.onerror = () => {
                const errorElement = `<div class="image-error">image generation failed for: "${imagePrompt}"</div>`;
                const placeholderEl = document.getElementById(placeholderId);
                if (placeholderEl) {
                    placeholderEl.outerHTML = errorElement;
                }
            };

        } catch (error) {
            clearInterval(intervalId); // Stop spinner on error
            console.error(error);
            const errorElement = `<div class="image-error">image generation failed for: "${imagePrompt}"</div>`;
            const placeholderEl = document.getElementById(placeholderId);
            if (placeholderEl) {
                placeholderEl.outerHTML = errorElement;
            }
        }
    }

    async function sendMessage() {
        if (devMode || userInput.trim() === "") return;

        addLog("Attempting to send message...");

        let messageToSend = userInput;
        if (imageGenModeActive) {
            const imageParams = { prompt: userInput };
            messageToSend = `<image>${JSON.stringify(imageParams)}</image>`;
            deactivateImageGenMode();
        }

        const userMessage: ChatMessage = {
            sender: "user",
            content: renderMarkdown(messageToSend),
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
                
                if (aiMessage.content.includes("<image>")) {
                    await handleImageTag(aiMessage);
                }

                lastError = null;
                break;

            } catch (error: any) {
                addLog(`Model ${modelName} failed: ${error.message || "Unknown error"}`, true);
                lastError = error;
            }
        }

        if (lastError) {
            await callCerebrasAPI(historyForApi, aiMessage);
        }

        await tick();
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function callCerebrasAPI(historyForApi: Content[], aiMessage: ChatMessage) {
        addLog("Falling back to Cerebras API...");

        const encodedCerebrasApiKey = 'Y3NrLXJ5eHdreadmeDdqdjMzeW1oeXRobjY5bjM5dmYyNXByd2RueW10OTJuZDhWMjQ5ZjNjYzQ=';
        const cerebrasApiKey = atob(encodedCerebrasApiKey);

        const cerebrasMessages = historyForApi.map(h => ({
            role: h.role,
            content: h.parts[0].text
        }));

        try {
            const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cerebrasApiKey}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b",
                    max_completion_tokens: 1024,
                    temperature: 0.2,
                    top_p: 1,
                    stream: false,
                    messages: cerebrasMessages
                })
            });

            if (!response.ok) {
                throw new Error(`Cerebras API request failed with status ${response.status}`);
            }

            const data = await response.json();
            const newContent = data.choices[0].message.content;
            aiMessage.content = renderMarkdown(newContent);
            addLog("Cerebras API response received.");

        } catch (error: any) {
            addLog(`Cerebras API failed: ${error.message || "Unknown error"}`, true);
            aiMessage.content = `Error: ${error.message || "Failed to get response from Cerebras AI."}`;
        }

        aiMessage.isLoading = false;
        isThinking = false;
        messages = [...messages];
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

    {#if showImageGenNotification}
        <div class="notification-banner">
            <span>[NEW] flouride can now gerate images, ask it to gerate one or create your own prompt &#8595;</span>
            <button on:click={dismissImageGenNotification}>&times;</button>
        </div>
    {/if}
    <div class="chat-input">
        <div class="input-container">
            <div class="input-wrapper">
                <div class="plus-menu-container">
                    <button class="plus-btn" on:click={() => showPlusMenu = !showPlusMenu}>+</button>
                    {#if showPlusMenu}
                        <div class="plus-menu">
                            <button on:click={activateImageGenMode}>Generate Image</button>
                        </div>
                    {/if}
                </div>
                <textarea
                    bind:this={textareaElement}
                    bind:value={userInput}
                    on:keydown={handleKeydown}
                    on:input={adjustTextareaHeight}
                    rows="1"
                    placeholder={imageGenModeActive ? "Enter a prompt to generate an image..." : "Type a message..."}
                    class:has-image-tag={imageGenModeActive}
                ></textarea>
            </div>
            {#if imageGenModeActive}
                <div class="image-gen-tag">
                    <span>Generate Image</span>
                    <button on:click={deactivateImageGenMode}>&times;</button>
                </div>
            {/if}
        </div>
        <button class="send-btn" on:click={sendMessage} disabled={!userInput.trim() && !imageGenModeActive}>Send</button>
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

    .content :global(.image-placeholder) {
        background-color: #1a1a1a;
        padding: 20px;
        border-radius: 5px;
        color: #888;
        font-style: italic;
    }

    .content :global(.generated-image) {
        max-width: 100%;
        border-radius: 5px;
        margin-top: 10px;
    }

    .content :global(.image-error) {
        background-color: #2a1a1a;
        padding: 20px;
        border-radius: 5px;
        color: #ff5555;
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
        padding: 15px;
        border-top: 1px solid #222;
    }

    .input-wrapper {
        position: relative;
        width: 100%;
    }

    .plus-menu-container {
        position: absolute;
        left: 15px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 10;
    }

    .plus-btn {
        background-color: #333;
        color: #fff;
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
    }

    .plus-menu {
        position: absolute;
        bottom: 45px;
        left: 0;
        background-color: #222;
        border-radius: 5px;
        padding: 5px;
        display: flex;
        flex-direction: column;
        z-index: 10;
        border: 1px solid #333;
    }

    .plus-menu button {
        background: none;
        border: none;
        color: #fff;
        text-align: left;
        padding: 8px 12px;
        cursor: pointer;
        width: 100%;
    }

    .plus-menu button:hover {
        background-color: #444;
    }

    .image-gen-tag {
        position: absolute;
        bottom: 5px; /* Changed from top: -25px */
left: 70px; /* Adjusted to be after the plus button */
        background: #005f5f;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 12px;
    }

    .image-gen-tag button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0;
        margin: 0;
        font-size: 16px;
    }

    .chat-input textarea {
        width: 100%;
        box-sizing: border-box;
        background-color: #1c1c1c;
        color: #f0f0f0;
        border: 1px solid #2f2f2f;
        border-radius: 25px;
        padding: 14px 85px 14px 55px; 
        outline: none;
        resize: none;
        overflow-y: hidden;
        font-family: "Courier New", Courier, monospace;
        max-height: 150px;
        line-height: 1.5; /* Improved line height for centering */
        transition: all 0.2s ease;
    }

    .chat-input textarea.has-image-tag {
        padding-bottom: 40px; /* Adjust as needed based on tag height + desired spacing */
    }

    .chat-input .send-btn {
        position: absolute;
        right: 25px; /* Keep it inside on the right */
        top: 50%;
        transform: translateY(-50%);
        background-color: cyan;
        color: #000;
        border: none;
        padding: 8px 20px;
        border-radius: 50px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 255, 255, 0.3);
    }
    
    .chat-input textarea:not(:placeholder-shown) + .send-btn {
         bottom: 24px; /* Move button to bottom when there is text */
    }

    .chat-input .send-btn:hover {
        background-color: #00e0e0;
    }

    .chat-input .send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background-color: #555;
        box-shadow: none;
    }

    .notification-banner {
        background-color: cyan;
        color: black;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .notification-banner button {
        background: none;
        border: none;
        color: black;
        cursor: pointer;
        font-size: 20px;
        padding: 0 5px;
    }
</style>
