<script lang="ts">
  import { onDestroy } from 'svelte';
  import { activeChat, username } from './stores';
  import { getMessages, sendMessage as apiSendMessage } from './chatApi';

  let messages: { text: string; user: string; timestamp: string }[] = [];
  let newMessage = "";
  let chatContainer: HTMLDivElement;
  let isLoading = true;
  let error: string | null = null;
  let currentChatId: string | null = null;
  let eventSource: EventSource;

  $: if (messages && chatContainer) {
    setTimeout(() => {
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 10);
  }

  async function loadHistoryAndConnect(chat) {
    if (!chat) return;
    
    // 1. Disconnect from any previous SSE connection
    if (eventSource) {
      eventSource.close();
    }
    
    currentChatId = chat.chatId;
    messages = [];
    isLoading = true;
    error = null;

    try {
      // 2. Load the initial chat history
      const history = await getMessages(chat.chatId, chat.key);
      messages = history.reverse();
    } catch (e) {
      error = `Failed to load chat history: ${e.message}`;
    } finally {
      isLoading = false;
    }

    // 3. Setup the new SSE connection
    // I'll assume the new endpoint is /api/chat/events
    const url = `/api/chat/events?chatId=${chat.chatId}${chat.key ? '&key=' + chat.key : ''}`;
    eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const newMessage = JSON.parse(event.data);
        // Avoid adding duplicates if history loading was slow
        if (!messages.some(m => m.timestamp === newMessage.timestamp)) {
            messages = [...messages, newMessage];
        }
      } catch (e) {
        console.error("Failed to parse SSE message:", e);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      error = "Connection to real-time updates failed. Please refresh.";
      eventSource.close();
    };
  }

  async function sendMessage() {
    if (!newMessage.trim() || !$activeChat) return;

    const textToSend = newMessage;
    newMessage = ""; // Clear input immediately

    try {
      // Just send the message. The SSE event will update the UI.
      await apiSendMessage($activeChat.chatId, textToSend, $username, $activeChat.key);
    } catch (err) {
      alert(`Message failed to send: ${err.message}`);
      newMessage = textToSend; // Restore message on failure
    }
  }

  activeChat.subscribe(chat => {
    if (chat && chat.chatId !== currentChatId) {
      loadHistoryAndConnect(chat);
    }
  });

  onDestroy(() => {
    if (eventSource) {
      eventSource.close();
    }
  });

  function formatTimestamp(isoString: string) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = (hash * 137) % 360; 
    return `hsl(${hue}, 75%, 55%)`;
  }
</script>

<div class="chat-view-container">
  <div class="chat-history" bind:this={chatContainer}>
    {#if isLoading}
      <div class="message system"><span class="content">Loading messages...</span></div>
    {:else if error}
      <div class="message system error"><span class="content">Error: {error}</span></div>
    {:else if messages.length > 0}
      {#each messages as msg (msg.timestamp)}
        <div class="message" style="--sender-color: {stringToColor(msg.user)}">
          <span class="timestamp">[{formatTimestamp(msg.timestamp)}]</span>
          <span class="sender-name">{msg.user}:</span>
          <span class="content">{msg.text}</span>
        </div>
      {/each}
    {:else}
      <div class="message system">
        <span class="content">No messages yet. Start the conversation!</span>
      </div>
    {/if}
  </div>

  <div class="chat-input">
    <input 
      type="text" 
      bind:value={newMessage} 
      placeholder="Type a message..." 
      on:keydown={(e) => e.key === 'Enter' && sendMessage()} 
      disabled={!$activeChat || !!error}
    />
    <button on:click={sendMessage} disabled={!newMessage.trim() || !$activeChat || !!error}>Send</button>
  </div>
</div>

<style>
  .chat-view-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #000;
    color: #b3b3b3;
  }
  .chat-history {
    flex-grow: 1;
    overflow-y: auto;
    padding: 10px;
    font-family: "Courier New", Courier, monospace;
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
    white-space: pre-wrap;
  }
  .message.system {
    width: 100%;
    text-align: center;
    font-style: italic;
    font-size: 0.9em;
    color: #888;
  }
  .message.system.error {
    color: #f44336;
    font-weight: bold;
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
    font-family: "Courier New", Courier, monospace;
  }
  .chat-input button {
    background-color: #4caf50;
    color: white;
    border: none;
    padding: 5px 15px;
    border-radius: 5px;
    margin-left: 10px;
    cursor: pointer;
    font-family: "Courier New", Courier, monospace;
  }
  .chat-input button:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
</style>
