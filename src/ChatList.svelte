<script lang="ts">
  import { onMount } from 'svelte';
  import { chats, activeChat, showCreateChatModal } from './stores';
  import { getAllChats } from './chatApi';

  let isLoading = true;
  let error: string | null = null;

  async function loadChats() {
    try {
      isLoading = true;
      const allChats = await getAllChats();
      // The global chat is always available, so we ensure it's in the list.
      const globalChatExists = allChats.some(c => c.chatId === 'global');
      if (!globalChatExists) {
        allChats.unshift({ chatId: 'global', name: 'Global', type: 'public', message_count: 0 });
      }
      $chats = allChats;
      error = null;
    } catch (e) {
      error = e.message;
      console.error("Failed to load chats:", e);
    } finally {
      isLoading = false;
    }
  }

  function selectChat(chat) {
    if (chat.type === 'private') {
      const key = prompt(`Enter key for private chat "${chat.name}":`);
      if (key) {
        $activeChat = { ...chat, key };
      }
    } else {
      $activeChat = { ...chat, key: null };
    }
  }

  function openCreateModal() {
    $showCreateChatModal = true;
  }

  onMount(() => {
    loadChats();
    const interval = setInterval(loadChats, 10000); // Refresh list every 10 seconds
    return () => clearInterval(interval);
  });
</script>

<div class="chat-list-container">
  <div class="header">Chats</div>
  <div class="list">
    {#if isLoading && $chats.length === 0}
      <div class="item system">loading...</div>
    {:else if error}
      <div class="item error">Error: {error}</div>
    {:else}
      {#each $chats as chat (chat.chatId)}
        <div 
          class="item" 
          class:active={$activeChat?.chatId === chat.chatId}
          on:click={() => selectChat(chat)}
        >
          <span>{chat.type === 'private' ? '🔒' : '#'} {chat.name}</span>
          <span class="count">{chat.message_count || 0}</span>
        </div>
      {/each}
    {/if}
  </div>
  <div class="footer">
    <button on:click={openCreateModal}>[+ New Chat]</button>
  </div>
</div>

<style>
  .chat-list-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    border-right: 1px solid #333;
    background-color: #0a0a0a;
  }
  .header {
    padding: 5px 10px;
    border-bottom: 1px solid #333;
    font-weight: bold;
    color: #eee;
    text-align: center;
  }
  .list {
    flex-grow: 1;
    overflow-y: auto;
    padding: 5px 0;
  }
  .item {
    padding: 5px 15px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9em;
  }
  .item:hover {
    background-color: #2a2a2a;
  }
  .item.active {
    background-color: #4caf50;
    color: #000;
    font-weight: bold;
  }
  .item.system {
    color: #888;
    text-align: center;
  }
  .item.error {
    color: #f44336;
  }
  .count {
    color: #888;
  }
  .item.active .count {
    color: #222;
  }
  .footer {
    padding: 5px;
    border-top: 1px solid #333;
    text-align: center;
  }
  button {
    background: none;
    border: none;
    color: #4caf50;
    font-family: inherit;
    cursor: pointer;
    font-size: 0.9em;
  }
  button:hover {
    color: #81c784;
  }
</style>
