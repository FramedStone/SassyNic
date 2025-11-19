# Agent Guidelines for SassyNic

## Build/Lint/Test Commands
- **Format code**: `npm run format` (runs Prettier)
- **Pre-commit hook**: Automatically formats `*.{js,json,css,html}` via lint-staged
- **No test suite**: Project has no automated tests; manual testing in Chrome required

## Code Style & Conventions
- **Tech Stack**: Pure Vanilla HTML, CSS, JavaScript (Chrome Extension API) - NO frameworks
- **Formatting**: Use Prettier (semi: true, singleQuote: true, tabWidth: 2, printWidth: 100)
- **Naming**: camelCase for variables/functions, snake_case for some class properties
- **Error Handling**: Use try-catch blocks, alert error codes (e.g., '1003_EXTRACTION_NO_CLASES')
- **Comments**: JSDoc format for functions with `@param` and `@returns`
- **Imports**: Use ES6 exports (`export function`) for helper modules
- **DOM Queries**: Use `querySelector`/`querySelectorAll` with optional chaining (`?.`)
- **Chrome API**: Use callbacks for `chrome.runtime.onMessage`, `chrome.tabs.query`
- **Algorithms**: Implements Backtracking and Genetic Algorithm's Fitness Function

## Project Context
- Chrome Extension for MMU students to generate timetables from CliC data
- Main dirs: `SassyNic-Student/extension/` (student version), `SassyNic-Universal/extension/` (universal)
- Key files: `extraction.js`, `background.js`, helpers in `scripts/helpers/`
- Keep responses simple and neat with TL;DR tables where applicable
