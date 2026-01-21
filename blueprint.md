# blueprint

## overview
The application is a multi-window desktop environment built with Svelte. It features several "applications" that can be opened in windows, including a game launcher (Cyanide), a web proxy (Chromium), an AI chat (Fluoride), and a general chat application (Sulfur). The UI is styled with a dark, TUI/terminal aesthetic.

## style and design
- **Theme**: Dark mode, TUI-inspired.
- **Font**: "Courier New", Courier, monospace.
- **Layout**: The main application is split into a left navigation panel and a right content area for windows.
- **Windows**: Draggable and minimizable windows that contain the individual applications.
- **Sulfur Chat**: The chat application has a two-panel layout. A list of chat rooms is on the left, and the selected chat's messages are on the right. Modals are used for creating new chats and displaying information about newly created private chats.

## features

### Implemented
- **Window Management**: Users can open, close, minimize, and drag windows.
- **Cyanide**: Game launcher.
- **Chromium**: Web proxy.
- **Fluoride**: AI chat.
- **Sulfur (Chat)**:
    - **Multi-Room Chat**: Users can join different chat rooms.
    - **Public and Private Chats**: Supports both public and private chat rooms. Private rooms require a key.
    - **Chat Creation**: Users can create new public or private chat rooms via a modal.
    - **Private Key Handling**: When a private chat is created, the user is shown the key once in a popup with a copy-to-clipboard feature and a warning that the key will not be shown again.
    - **Real-time Messaging**: Messages are sent and received, with the chat view updating automatically.
    - **TUI-Style UI**: The entire chat interface is styled to look like a terminal application.
    - **Advanced Chat API**: The chat system was updated to use a more advanced chat API. This involved restructuring the UI into smaller components (`ChatList.svelte`, `ChatView.svelte`, `CreateChatModal.svelte`, `ChatCreatedPopup.svelte`), building a chat menu to display all available chats, implementing chat creation, adding a post-creation summary with private key handling, and creating a `src/chatApi.ts` module to handle all API calls.
    - **Message Pagination**: Implemented a "load more" feature to fetch messages in batches, improving initial load performance.

## plan for current change
The user wants to change the build process to output a single HTML file named `cyanide.html`.

1.  **DONE - Configure Vite Build Output**: In `vite.config.js`, I added a `build` configuration with `rollupOptions` to specify the output filenames for entry and asset files as `cyanide.js` and `cyanide.[ext]` respectively.
2.  **DONE - Configure Single File Plugin**: In `vite.config.js`, I configured the `viteSingleFile` plugin to inline all assets and remove the Vite module loader for a cleaner single-file output.
3.  **DONE - Update Build Script**: In `package.json`, I updated the `build` script to first run `vite build` and then rename the generated `dist/index.html` to `dist/cyanide.html`.
