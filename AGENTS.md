# Agent Guidelines for SassyNic

## Build/Lint/Test Commands
- **Format code**: `npm run format` (runs Prettier on all files)
- **Pre-commit hook**: Automatically formats `*.{js,json,css,html}` via husky + lint-staged
- **No test suite**: Project has no automated tests; manual testing in Chrome browser required
- **Installation**: Load unpacked extension from `SassyNic-Student/` or `SassyNic-Universal/` in Chrome

## Code Style & Conventions
- **Tech Stack**: Pure Vanilla HTML, CSS, JavaScript (Chrome Extension API) - **NO frameworks/libraries**
- **Formatting**: Prettier enforced (semi: true, singleQuote: true, tabWidth: 2, printWidth: 100, trailingComma: 'es5', arrowParens: 'always')
- **Naming**: camelCase for variables/functions, snake_case for some object properties/classes
- **Error Handling**: Use try-catch blocks; alert error codes like `'1003_EXTRACTION_NO_CLASES'` or `'2001_OTP_NOT_FOUND'`
- **Comments**: Minimal; use JSDoc format for functions: `@param {Type} name - description` and `@returns {Type} description`
- **Imports**: ES6 modules with `export function` for helpers in `scripts/helpers/`
- **DOM Queries**: Use `querySelector`/`querySelectorAll` with optional chaining (`element?.textContent`)
- **Chrome API**: Use callbacks for `chrome.runtime.onMessage`, `chrome.tabs.query`, `chrome.tabs.sendMessage`
- **Async Patterns**: Use `fetch().then()` chains or try-catch for async operations
- **Console Logging**: Use `console.log()` and `console.error()` for debugging

## Project Context
- Chrome Extension for MMU students to generate timetables from CliC website data
- Main directories: `SassyNic-Student/extension/` (student version), `SassyNic-Universal/extension/` (universal version)
- Key files: `extraction.js`, `background.js`, `auto_enrollment.js`, helpers in `scripts/helpers/`
- Algorithms: Backtracking + Genetic Algorithm's Fitness Function for timetable generation
- **Copilot Instructions**: Keep responses simple and neat with TL;DR tables where applicable
