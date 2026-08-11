# AGENTS.md

This file provides guidance to AI agents who are working on the code in this repository.

## Context

This repository contains an app built with the Attio App SDK.

### What the app does

Google Sheets integration for Attio. Allows users to create, find, update, and sync rows in Google Sheets spreadsheets directly from Attio workflow automations. Authentication uses Google OAuth (user connection).

### App SDK entry points in use

| Entry point | Description |
| ----------- | ----------- |
| Workflow blocks | `create-row`, `find-matching-row`, `find-matching-rows`, `find-or-create-row`, `update-row` — each has a `block.ts` (definition), `configurator.tsx` (UI), and `execute.ts` (server-side logic) |

### What is the App SDK?

The App SDK is a set of components and functionality to build apps that are embedded directly in the Attio CRM platform.

#### App SDK capabilities

- Use React to render components provided by the `attio/client` package.
- Run server-side code and make API calls to external services using `.server.ts` files.
- Store API tokens using the connections system.
- Receive incoming requests from third-party services via webhooks.
- Subscribe to events e.g. connection.added
- Manage form rendering, validation and submission with `useForm()`.
- Manage data fetching and async caching with `useAsyncCache()` and `useQuery()`.

## Source folder structure

| Path | Description |
| ---- | ----------- |
| `src/app.ts` | App entrypoint |
| `src/blocks/` | Workflow blocks — one subdirectory per block (`create-row`, `find-matching-row`, `find-matching-rows`, `find-or-create-row`, `update-row`) |
| `src/google-sheets/` | Google Sheets API client — request handling, retries, column/row/tab utilities |
| `src/google-sheets/drive/` | Google Drive API calls (listing spreadsheets) |
| `src/google-sheets/helpers/` | Pure utility functions (column resolution, range utils) |
| `src/google-sheets/rows/` | Row-level operations (append, find, update, read) |
| `src/providers/` | Dynamic data providers (spreadsheet ID, sheet name) |
| `src/server-functions/` | Server-side functions called from configurators (get spreadsheet, list tabs, list spreadsheets) |
| `src/utils/` | Shared utilities (error handling, logger) |

## External service

**Google Sheets API** (REST) and **Google Drive API** (REST). Auth: Google OAuth user connection. Docs: https://developers.google.com/sheets/api and https://developers.google.com/drive/api.

## Environment

Code for the app may run either in a client-side or server-side context.

### Client-side code

Client-side code runs in the browser. However, it runs inside a safe sandbox, using a custom JS runtime. This means that:

- You MUST NOT render HTML tags directly e.g. `<div>Hello</div>`. Instead, you MUST only use components provided by the App SDK.
- You MUST NOT use custom styles or CSS. Only use the pre-styled components provided by the App SDK.
- You MUST NOT try to read the DOM directly.
- Some browser APIs may not be available.
- `fetch` calls are not allowed. You MUST NOT call `fetch` directly and should instead use `fetch` via server-side functions.

Files which render React components MUST use the `.tsx` extension.

### Server-side code

Server-side code runs in files ending in:

- `.server.ts`
- `.webhook.ts`
- `.event.ts`

Workflow block files will also run in the server (excluding configurators).

Code that any of the above files import will also run in a server-side environment.

Server-side code DOES NOT run in Node.js but instead in a custom JS runtime. While many Node.js APIs are supported, some are not and you may need to factor this into your decision to use certain packages.

## Using the Attio App SDK

Attio provides three packages to help you build apps:

1. `attio/client` - for client-side imports
2. `attio/server` - for server-side imports
3. `attio` - for shared/environment-agnostic imports

IMPORTANT: Before importing from these packages, you MUST always check one of the following to confirm that your import is correct:

1. Existing examples in the codebase
2. TypeScript type definitions and JSDoc strings for the package
3. The Attio SDK documentation

If you are unsure about an import, always check explicitly and do not guess.

## Coding guidelines

- You SHOULD use Zod to validate data from public APIs.
- You SHOULD only include properties in Zod schemas that we explicitly need.
- You SHOULD use try/catch around calls to `.json()`.
- You SHOULD use console.error to capture information about unexpected errors.
- You MUST NOT log sensitive information such as email addresses or passwords.
- You MUST handle API errors gracefully. Do not throw an error within a React component, but instead return a clear fallback UI.
- API wrappers MUST NOT leak transport-layer details (e.g. HTTP status codes) to callers — return a domain error such as `NOT_FOUND` instead.
- When `getUserConnection()` / `getWorkspaceConnection()` is called, you MUST NOT wrap it in a try/catch. These functions throw special errors that power the connection dialogs in the UI.
- You SHOULD prefer named arguments over positional arguments when using 3 or more arguments.
- You MUST NOT use `any` when typing your code. Type errors MUST be fixed properly as usage of `any` is a likely source of bugs.
- You SHOULD order functions/values within code so that all values are defined before being used. Default export should go at the bottom of a file.

### App-specific guidelines

- Google Sheets API rate-limits aggressively. Always go through `src/google-sheets/retry.ts` for retryable operations.
- Column resolution logic lives in `src/google-sheets/helpers/column-resolve.ts` — do not duplicate it.
- Auth is a **user connection** (OAuth). Use `getUserConnection()`, not `getWorkspaceConnection()`.

### Error messages (user-facing)

- Never dump raw JSON, HTTP status codes, or square brackets in UI error messages.
- Never expose transport-layer details — say "An unexpected error occurred when calling the Google Sheets API" not "429 from sheets.googleapis.com".
- Auth errors MUST name the missing scope and tell the user where to configure it.

### Testing

- Where appropriate, use Vitest to run tests.
- Aim to implement unit testing where it helps increase confidence in the correctness of code.
- Do not test React components using react testing library or similar.
- When passing functions/classes to describe, pass the value directly, do not specify a name in quotes e.g. `describe(myFn, () => {/* ... */})`, not `describe("myFn", () => {/* ... */})`.

## Validation

- You MUST validate all your changes using the commands provided in package.json.
- Run and fix lint rules: `pnpm run lint:fix`
- Validate unused code: `pnpm run knip`
- Run tests: `pnpm run test`
- Validate the build: `pnpm run build`
