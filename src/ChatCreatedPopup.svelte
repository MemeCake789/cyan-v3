<script lang="ts">
  import { newlyCreatedChat } from './stores';

  let keyCopied = false;

  function close() {
    $newlyCreatedChat = null;
    keyCopied = false;
  }

  function copyKey() {
    if (!$newlyCreatedChat?.key) return;
    navigator.clipboard.writeText($newlyCreatedChat.key).then(() => {
      keyCopied = true;
      setTimeout(() => keyCopied = false, 2000);
    });
  }
</script>

{#if $newlyCreatedChat}
  <div class="modal-backdrop" on:click={close}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <span>Chat Created Successfully</span>
      </div>
      <div class="modal-body">
        <p>Your new chat room is ready.</p>
        <div class="info-group">
          <label>Name:</label>
          <span>{$newlyCreatedChat.name}</span>
        </div>
        <div class="info-group">
          <label>Chat ID:</label>
          <span>{$newlyCreatedChat.chatId}</span>
        </div>

        {#if $newlyCreatedChat.type === 'private' && $newlyCreatedChat.key}
          <div class="key-section">
            <div class="warning">
              ⚠️ Please save your secret key. You will not be able to see it again.
            </div>
            <label for="chat-key-display">Secret Key:</label>
            <div class="key-input-wrapper">
              <input id="chat-key-display" type="text" readonly value={$newlyCreatedChat.key} />
              <button on:click={copyKey}>
                {#if keyCopied}Copied!{:else}Copy{/if}
              </button>
            </div>
          </div>
        {/if}
      </div>
      <div class="modal-footer">
        <button class="submit" on:click={close}>[ Close ]</button>
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
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 20; /* Higher than create modal */
  }
  .modal-content {
    background: #1a1a1a;
    border: 1px solid #4caf50;
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
    font-weight: bold;
    color: #4caf50;
    text-align: center;
  }
  .modal-body {
    padding: 20px;
  }
  .info-group {
    display: flex;
    margin-bottom: 10px;
  }
  .info-group label {
    font-weight: bold;
    color: #888;
    width: 100px;
  }
  .key-section {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px dashed #444;
  }
  .warning {
    background: #444;
    border-left: 3px solid #ffeb3b;
    padding: 10px;
    margin-bottom: 15px;
    font-size: 0.9em;
  }
  .key-input-wrapper {
    display: flex;
  }
  .key-input-wrapper input {
    flex-grow: 1;
    background: #333;
    border: 1px solid #555;
    color: #f0f0f0;
    padding: 8px;
    border-radius: 3px 0 0 3px;
  }
  .key-input-wrapper button {
    font-family: inherit;
    background: #4caf50;
    color: #000;
    border: 1px solid #555;
    border-left: none;
    padding: 0 15px;
    cursor: pointer;
    border-radius: 0 3px 3px 0;
    font-weight: bold;
  }
  .modal-footer {
    padding: 10px 15px;
    border-top: 1px solid #444;
    display: flex;
    justify-content: center;
  }
  .modal-footer button {
    font-family: inherit;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 1em;
    color: #4caf50;
  }
</style>
