# Cyan V3

Cyan V3 is a forward-thinking desktop environment designed to streamline your digital life. It combines a sleek, modern interface with powerful multitasking features, allowing you to manage your applications and workflows with ease.

## Current Style and Design

*   **Vibrant and Bold:** The interface features a dark, vibrant color palette that's both energetic and easy on the eyes.
*   **Expressive Typography:** We use a range of font sizes to create a clear visual hierarchy, from prominent hero text to easily scannable lists.
*   **Premium Feel:** A subtle noise texture on the main background adds a tactile, high-quality feel to the interface.
*   **Interactive Glow:** Buttons and other interactive elements have a soft shadow and a colored glow, making them feel responsive and engaging.
*   **TUI Aesthetic:** The Cyanide game launcher features a clean, modern Text-based User Interface (TUI) with monospace fonts, limited color palettes, and a structured, grid-based layout.

## Current Features

*   **Window Management:** A flexible windowing system allows you to open, close, and manage multiple applications in a clean, organized workspace.
*   **Cyanide Game Launcher:** A TUI-inspired game launcher that fetches a list of games from an external source. It provides two views: a grid view with game cards and a list view. It also includes a search bar to filter games.
*   **Responsive Design:** The interface is fully responsive, adapting seamlessly to different screen sizes for a consistent experience on both mobile and desktop.
*   **Intuitive Navigation:** A clear and simple navigation bar makes it easy to find and launch your favorite applications.

## Plan for a Slick New Window System

I'm about to give your app a major upgrade with a new windowing system inspired by your vision. Here’s the plan:

1.  **`Window.svelte` Component:** I'll start by creating a reusable Svelte component for the windows. It will have a sleek title bar, buttons to minimize, maximize, and close, and a flexible content area.
2.  **`windows.js` Store:** To keep everything organized, I'll set up a Svelte store. This will manage the state of all your windows, making it easy to add, remove, and update them as you work.
3.  **Drag-and-Drop:** I'll add intuitive drag-and-drop functionality so you can rearrange your windows however you like.
    *   **Animations:** I'll use Svelte's built-in transitions to create smooth, expressive animations for opening, closing, and moving windows, including flip animations for the grid and list views in the Cyanide game launcher.
5.  **Modern Look:** I'll polish the design with a dark, modern theme, clean lines, and a professional finish that matches your vision.
6.  **Cyanide Game Launcher:** I will create a new component called `Cyanide.svelte` that will:
    *   Fetch a list of games from a JSON file.
    *   Display the games in two different views: a grid view and a list view.
    *   Be styled with a modern TUI (Text-based User Interface) look, avoiding cheesy hacker themes.
    *   The grid view will feature game cards with pixelated images and details.
    *   The list view will be a table with sortable columns.
    *   The component will be integrated into the main `App.svelte` file.