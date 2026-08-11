# Google Sheets

Google Sheets app for Attio, built with the [App SDK](https://docs.attio.com/sdk/overview).

## Overview

Automate Google Sheets directly from Attio workflow automations. Create rows from CRM data, find and update existing rows, or look up records to sync information between Attio and your spreadsheets — all without leaving your workflow.

## Features

- **Create row** — append or prepend a new row to any sheet in a spreadsheet
- **Find matching row** — locate the first row matching column criteria
- **Find matching rows** — locate all rows matching column criteria
- **Find or create row** — upsert: find an existing row or create one if absent
- **Update row** — update column values in an existing row

## Headers

Every block treats row 1 as a header row by default: its values name the columns, and it is
never matched or overwritten. Columns are picked from a dropdown of those names, and a column
letter (`A`–`ZZ`) can be entered instead at any time — useful when a header is blank or
duplicated. Header names match regardless of case and surrounding whitespace.

Turn off **First row is a header row** for sheets that start straight into data. Row 1 then
becomes an ordinary, matchable row, prepending inserts above it, and columns must be
referenced by letter — the dropdown switches to listing letters annotated with each column's
first value.

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm run dev
```

## Commands

| Command                 | Description              |
| ----------------------- | ------------------------ |
| `pnpm run dev`          | Start dev server         |
| `pnpm run build`        | Build + type-check       |
| `pnpm run lint`         | Run ESLint               |
| `pnpm run lint:fix`     | Run ESLint with auto-fix |
| `pnpm run format`       | Format with Prettier     |
| `pnpm run format:check` | Check formatting         |
| `pnpm run test`         | Run tests                |
| `pnpm run knip`         | Check for dead code      |

## Source folder structure

| Path | Description |
| ---- | ----------- |
| `src/blocks/` | Workflow blocks — one subdirectory per block |
| `src/google-sheets/` | Google Sheets & Drive API client (requests, retries, columns, rows, tabs) |
| `src/providers/` | Dynamic data providers (spreadsheet ID, sheet name) |
| `src/server-functions/` | Server-side functions called from block configurators |
| `src/utils/` | Shared utilities (error handling, logger) |
