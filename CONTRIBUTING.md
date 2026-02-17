# Contributing to GLTron

We want to make contributing to this project as easy and transparent as possible.

## Development Setup

1.  **No Bundler (Yet):** The project currently runs on vanilla ES6 modules. No `npm install` or `webpack` build step is required for now.
2.  **Local Server:** Always run the project via a local server (like Python SimpleHTTPServer or VS Code Live Server) to avoid CORS errors with textures and audio assets.

## Coding Standards

-   **Classes:** We use ES6 Classes for all game entities (`Player`, `Bot`, `GameManager`).
-   **Three.js:** We use the `three` module import map or relative paths in `src/`.
-   **State Management:** The game logic is centralized in `GameManager.js`.
-   **AI:** Any modification to the Bot logic should be done in `SmartBot.js`. Please ensure `handleInput()` remains the entry point.

## Pull Requests

1.  Fork the repo and create your branch from `main`.
2.  If you've added code that should be tested, add tests.
3.  Ensure your code follows the existing style.
4.  Issue that pull request!

## License

By contributing, you agree that your contributions will be licensed under its MIT License.