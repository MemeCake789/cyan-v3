<script lang="ts">
  import { onMount } from 'svelte';

  const API_URL = "https://cyan-data.vercel.app/api/chat";
  
  let messages: { text: string; user: string; timestamp: string }[] = [];
  let newMessage = "";
  let username = generateAnonymousName();
  let chatContainer: HTMLDivElement;

  $: if (messages && chatContainer) {
    setTimeout(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 10);
  }

  $: if (typeof username === 'string' && !username.trim()) {
    username = generateAnonymousName();
  }

  function generateAnonymousName() {
    return "anonymous-" + Math.floor(Math.random() * 10000);
  }

  function formatTimestamp(isoString: string) {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  async function fetchMessages() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to load");
      const data: { text: string; user: string; timestamp: string }[] = await res.json();
      messages = data.reverse(); 
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;

    const payload = { 
      text: newMessage, 
      user: username 
    };

    messages = [...messages, { ...payload, timestamp: new Date().toISOString() }];
    const textToClear = newMessage;
    newMessage = ""; 

    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      fetchMessages(); 
    } catch (err) {
      alert("Message failed to send!");
      newMessage = textToClear; 
    }
  }

  onMount(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  });
</script>

<div class="sulfur-container">
  <div class="header">
    <span>[*] public-chat</span>
    <input type="text" bind:value={username} class="username-input" />
  </div>

  <div class="chat-history" bind:this={chatContainer}>
    {#each messages as msg, i (i)}
      <div class="message" style="--sender-color: {stringToColor(msg.user)}">
        <span class="timestamp">[{formatTimestamp(msg.timestamp)}]</span>
        <span class="sender-name">{msg.user}:</span>
        <span class="content">{msg.text}</span>
      </div>
    {:else}
      <div class="message system">
        <span class="content">No messages yet. Start the conversation!</span>
      </div>
    {/each}
  </div>

  <div class="chat-input">
    <input 
      type="text" 
      bind:value={newMessage} 
      placeholder="Type a message..." 
      on:keydown={(e) => e.key === 'Enter' && sendMessage()} 
    />
    <button on:click={sendMessage} disabled={!newMessage.trim()}>Send</button>
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
