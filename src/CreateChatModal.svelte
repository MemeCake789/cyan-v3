<script lang="ts">
  import { showCreateChatModal, newlyCreatedChat } from './stores';
  import { createChat } from './chatApi';

  let name = '';
  let type: 'public' | 'private' = 'public';
  let key = '';
  let error: string | null = null;
  let isSubmitting = false;

  async function handleSubmit() {
    if (!name.trim()) {
      error = "Name is required.";
      return;
    }
    if (type === 'private' && !key.trim()) {
      error = "Key is required for private chats.";
      return;
    }

    isSubmitting = true;
    error = null;

    try {
      const result = await createChat(name, type, key);
      $newlyCreatedChat = { ...result, name, type, key: type === 'private' ? key : undefined };
      closeModal();
    } catch (e) {
      error = e.message;
    } finally {
      isSubmitting = false;
    }
  }

  function closeModal() {
    $showCreateChatModal = false;
    name = '';
    type = 'public';
    key = '';
    error = null;
    isSubmitting = false;
  }
</script>

{#if $showCreateChatModal}
  <div class="modal-backdrop" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <span>Create New Chat</span>
        <button class="close-btn" on:click={closeModal}>×</button>
      </div>
      <div class="modal-body">
        {#if error}
          <div class="error-banner">{error}</div>
        {/if}
        <form on:submit|preventDefault={handleSubmit}>
          <div class="form-group">
            <label for="chat-name">Name:</label>
            <input id="chat-name" type="text" bind:value={name} required disabled={isSubmitting} />
          </div>
          <div class="form-group">
            <label>Type:</label>
            <div class="radio-group">
              <label>
                <input type="radio" bind:group={type} value="public" disabled={isSubmitting} /> Public
              </label>
              <label>
                <input type="radio" bind:group={type} value="private" disabled={isSubmitting} /> Private
              </label>
            </div>
          </div>
          {#if type === 'private'}
            <div class="form-group">
              <label for="chat-key">Secret Key:</label>
              <input id="chat-key" type="password" bind:value={key} required disabled={isSubmitting} />
              <small>This key is used to access your private chat.</small>
            </div>
          {/if}
        </form>
      </div>
      <div class="modal-footer">
        <button class="cancel" on:click={closeModal} disabled={isSubmitting}>[ Cancel ]</button>
        <button class="submit" on:click={handleSubmit} disabled={isSubmitting}>
          {#if isSubmitting}[ Creating... ]{:else}[ Create ]{/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
  }
  .modal-content {
    background: #1a1a1a;
    border: 1px solid #444;
    width: 90%;
    max-width: 500px;
    border-radius: 5px;
    font-family: "Courier New", Courier, monospace;
    color: #b3b3b3;
    display: flex;
    flex-direction: column;
  }
  .modal-header {
    padding: 10px 15px;
    border-bottom: 1px solid #444;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }
  .close-btn {
    background: none;
    border: none;
    color: #b3b3b3;
    font-size: 1.5em;
    cursor: pointer;
  }
  .modal-body {
    padding: 15px;
    flex-grow: 1;
  }
  .form-group {
    margin-bottom: 15px;
  }
  .form-group label {
    display: block;
    margin-bottom: 5px;
  }
  .form-group input[type="text"],
  .form-group input[type="password"] {
    width: 100%;
    background: #333;
    border: 1px solid #555;
    color: #f0f0f0;
    padding: 8px;
    border-radius: 3px;
  }
  .radio-group label {
    margin-right: 15px;
  }
  small {
    display: block;
    margin-top: 5px;
    color: #888;
  }
  .error-banner {
    background: #8b0000;
    color: #fff;
    padding: 10px;
    margin-bottom: 15px;
    text-align: center;
    border-radius: 3px;
  }
  .modal-footer {
    padding: 10px 15px;
    border-top: 1px solid #444;
    display: flex;
    justify-content: flex-end;
  }
  .modal-footer button {
    font-family: inherit;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 1em;
    margin-left: 15px;
  }
  .cancel { color: #f44336; }
  .submit { color: #4caf50; }
  .modal-footer button:disabled {
    color: #555;
    cursor: not-allowed;
  }
</style>
