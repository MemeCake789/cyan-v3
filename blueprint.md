# Cyan V3

Cyan V3 is a forward-thinking desktop environment designed to streamline your digital life. It combines a sleek, modern interface with powerful multitasking features, allowing you to manage your applications and workflows with ease.

## Current Style and Design

*   **Vibrant and Bold:** The interface features a dark, vibrant color palette that's both energetic and easy on the eyes.
*   **Expressive Typography:** We use a range of font sizes to create a clear visual hierarchy, from prominent hero text to easily scannable lists.
*   **Premium Feel:** A subtle noise texture on the main background adds a tactile, high-quality feel to the interface.
*   **Interactive Glow:** Buttons and other interactive elements have a shadow and a colored glow, making them feel responsive and engaging.
*   **TUI Aesthetic:** The Cyanide game launcher features a clean, modern Text-based User Interface (TUI) with monospace fonts, limited color palettes, and a structured, grid-based layout. The content is now properly aligned with the top bar.
*   **Compact Fullscreen Title Bar:** When a window is fullscreen, its title bar becomes more compact to maximize content area.

## Current Features

*   **Window Management:** A flexible windowing system allows you to open, close, and manage multiple applications in a clean, organized workspace. Windows can be minimized, fullscreened, and dragged. A UI info bit slides down saying `[esc] to exit fullscreen`, and disappears after 5 seconds. A "Back" button is displayed in the window's title bar when a game is running.
*   **Cyanide Game Launcher:** A TUI-inspired game launcher that fetches a list of games from an external source. It provides two views: a grid view with game cards and a list view. It also includes a search bar to filter games. Games can be favorited, and the list view has re-ordering animations. The component now handles its own padding to ensure proper alignment.
*   **Game Detail View:** Clicking on a game in either view opens a detail view with more information and a "Play" button. The game image in grid view is now properly sized to align with text and buttons. A "Back" button is also present in the grid view.
*   **Game Player:** When the "Play" button is clicked, the game loads in an iframe. The window title changes to reflect the game being played, and the top bar (search and view switcher) of the Cyanide app is hidden. Pressing `Esc` or clicking the "Back" button in the window title bar exits the game and returns to the game list.
*   **Responsive Design:** The interface is fully responsive, adapting seamlessly to different screen sizes for a consistent experience on both mobile and desktop.
*   **Flouride AI Chatbot:** A TUI-themed AI chatbot that uses `puter.js` to communicate with an AI model. It features a custom prompt to give the AI a unique personality and includes special formatting for displaying lenny faces in a separate column next to the chat messages.
*   **Intuitive Navigation:** A clear and simple navigation bar makes it easy to find and launch your favorite applications.
*   **Sulfur Chat Component:** A public chat component with a modern UI, featuring optimistic UI updates, username customization, and real-time message polling.
*   **Chromium Browser Proxy:** A specialized browser window that uses a proxy service to navigate the web and perform searches. It features a URL bar integrated into the window's title bar, along with backward and forward navigation and history tracking.

## Proposed Changes: Implement Chromium Browser Proxy

Add a new "Chromium" application that provides a proxy-based browsing experience.

### Steps:
1.  **Modify `Window.svelte`**: 
    *   Add a named slot `title-center` in the `title-bar` to allow components to inject custom UI (like a URL bar) into the center of the title bar.
    *   Ensure the layout of the title bar accommodates this new slot.
2.  **Create `Chromium.svelte`**:
    *   Implement state for the current URL, history (back/forward stacks), and search query.
    *   Create a method to handle navigation and search, appending queries to `http://sulfur-flax.vercel.app/rx?q=`.
    *   Provide the URL bar UI and navigation buttons (back/forward) to be placed in the window title bar.
    *   Use an `iframe` to display the proxied content.
3.  **Update `App.svelte`**:
    *   Import and register the `Chromium` component.
    *   Update the `openWindow` logic to handle the `proxy` type.
    *   In the window rendering loop, pass the necessary slots to `Window.svelte` for Chromium instances.
    *   Implement a way to sync state between the `Window` slot and the `Chromium` component (likely using a shared store or by lifting state to `App.svelte` for the URL bar).
