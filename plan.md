# Flouride AI Chatbot Plan

This document outlines the plan to create the Flouride AI chatbot, a TUI-themed chat application using `puter.js`.

## 1. Overview

The goal is to create a Svelte component called `Flouride.svelte` that will house the AI chat functionality. This component will have a terminal-like interface (TUI) and will use `puter.js` to interact with an AI model.

## 2. Features

*   **TUI-style interface:** The chat will look like a command-line interface.
*   **AI interaction:** Users can send messages to the AI and receive responses.
*   **Custom prompt:** The AI will use the provided system prompt to maintain a specific personality.
*   **Lenny face formatting:** The app will correctly parse and display lenny faces in a separate column next to the chat messages.
*   **Downloadable:** The entire application will be contained within a single HTML file, making it easily downloadable and usable offline (with the exception of the AI chat functionality, which requires an internet connection).

## 3. Implementation Steps

### Step 1: Create `Flouride.svelte` Component

I will create a new Svelte component named `Flouride.svelte` in the `src/` directory. This component will contain all the logic and UI for the chatbot.

### Step 2: Implement the TUI Layout

I'll use simple HTML and CSS to create a layout that resembles a terminal. This will include:
*   A container with a dark background and monospace font.
*   A scrollable area for the chat history.
*   An input field for the user to type their messages.

### Step 3: Integrate `puter.js`

I will add the `puter.js` script to the `index.html` file.

```html
<script src="https://js.puter.com/v2/"></script>
```

In `Flouride.svelte`, I will use the `puter.ai.chat()` function to send the user's message and the system prompt to the AI.

### Step 4: Manage Chat State

I'll use a Svelte store or a local component variable to manage the chat history. The history will be an array of objects, where each object represents a message and includes the sender (user or AI) and the content.

### Step 5: Handle Lenny Face Formatting

I will create a function that processes the AI's response to identify and extract the lenny faces in the `{[lenny face]}` format. The extracted lenny face will be stored separately from the message content.

When rendering the chat history, I will display the message and the lenny face in separate columns to achieve the desired layout.

### Step 6: Integrate `Flouride.svelte` into `App.svelte`

I will import and use the `Flouride.svelte` component within the main `App.svelte` file so it's displayed when the application loads. I will also make it a window using the `Window.svelte` component, so it can be moved around and closed.

### Step 7: Update `windows.js`

I will update the `windows.js` file to include the new `Flouride` app, so it can be opened from the Cyanide bar.

By following these steps, I will create a functional and visually appealing AI chatbot with the specified features.
