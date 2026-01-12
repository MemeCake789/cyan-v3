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

## plan for current change
The user wants to update the `@src/Sulfur.svelte` component to use a new, more advanced chat API.

1.  **DONE - Restructure the UI**: Split the `Sulfur.svelte` component into smaller pieces: `ChatList.svelte` for the room list, `ChatView.svelte` for messages, `CreateChatModal.svelte` for the creation form, and `ChatCreatedPopup.svelte` for the post-creation summary.
2.  **DONE - Build the Chat Menu**: Created `ChatList.svelte` to fetch and display all available chats from the `/api/chat?action=get_all_chats` endpoint. It allows selection of a chat and prompts for a key if the chat is private.
3.  **DONE - Implement Chat Creation**: Built `CreateChatModal.svelte`, a form to create new public or private chats by posting to `/api/chat` with the `create_chat` action.
4.  **DONE - Add Post-Creation Summary**: Created `ChatCreatedPopup.svelte` to display the new chat's ID and, for private chats, the secret key with a copy button and a security warning.
5.  **DONE - Update to the New API**: Created a `src/chatApi.ts` module to handle all API calls. All components now use this module for fetching and sending data according to the new API documentation. This includes getting messages, sending messages, and creating chats, all with proper handling for private key authentication via the `x-chat-key` header.
6.  **DONE - TUI Styling**: Enhanced the TUI styling across all the new chat components, using borders, a monospace font, and a dark color scheme to create a cohesive terminal-like experience.