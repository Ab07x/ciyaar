
# Testing the Smart TV UI

The Smart TV interface is located at `/tv`.

## How to Test

1.  **Open in Browser**: Navigate to `http://localhost:3000/tv`.
2.  **Simulate TV Remote**:
    *   Use your keyboard `Arrow Keys` (Up, Down, Left, Right).
    *   Use `Tab` to jump focus (though arrows are preferred for spatial nav, standard tab-based focusing works).
    *   Use `Enter` to select/click.
3.  **Guest Mode**: If you are not logged in, you will see a QR Code overlay. Click "Browse as Guest" to bypass it.
4.  **Responsiveness**: The UI is fixed-viewport optimized for 1080p+ screens (`min-h-screen`, `overflow-hidden` on body).

## Features Implemented
*   **Sidebar Navigation**: Fixed left menu for easy access.
*   **Large Cards**: Movie posters zoom and highlight on focus (`:focus` states).
*   **Detail Page**: `/tv/movies/[slug]` features large typography and clear Call-to-Action buttons.
*   **Performance**: Uses Next.js Image optimization.

## Deployment to TV
*   **Samsung Tizen**: Wrap the URL in a Tizen Web App project.
*   **LG WebOS**: Wrap the URL in a WebOS Web App project.
*   **Browser**: Simply visit the URL on the TV browser.
