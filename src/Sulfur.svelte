<script lang="ts">
  import ChatList from './ChatList.svelte';
  import ChatView from './ChatView.svelte';
  import CreateChatModal from './CreateChatModal.svelte';
  import ChatCreatedPopup from './ChatCreatedPopup.svelte';
  import { username, activeChat } from './stores';

  $: if (typeof $username === 'string' && !$username.trim()) {
    $username = "anonymous-" + Math.floor(Math.random() * 10000);
  }
</script>

<div class="sulfur-container">
  <div class="header">
    <div class="header-left">
      <span>SULFUR CHAT</span>
      <span class="chat-name">
        {#if $activeChat}
          [{`#${$activeChat.name}`}]
        {:else}
          [No Chat Selected]
        {/if}
      </span>
    </div>
    <div class="header-right">
      <span>User:</span>
      <input type="text" bind:value={$username} class="username-input" />
    </div>
  </div>
  <div class="main-layout">
    <div class="sidebar">
      <ChatList />
    </div>
    <div class="chat-area">
      <ChatView />
    </div>
  </div>
</div>

<CreateChatModal />
<ChatCreatedPopup />

<style>
  .sulfur-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #000;
    color: #b3b3b3;
    font-family: "Courier New", Courier, monospace;
    border: 1px solid #333;
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

  .header-left {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .header-left span:first-child {
    font-weight: bold;
    color: #4caf50;
  }
  
  .chat-name {
    color: #888;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 5px;
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

  .main-layout {
    display: flex;
    flex-grow: 1;
    overflow: hidden; /* Prevents layout issues */
  }

  .sidebar {
    width: 200px;
    flex-shrink: 0;
  }

  .chat-area {
    flex-grow: 1;
    border-left: 1px solid #333;
  }
</style>
