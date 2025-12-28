# Entity Grid Renderers

## Purpose

Cell renderers and value formatters for entity grid columns (currency, dates, status badges, etc.).

## Key Files

- `value-formatter.ts` - Value formatting utilities
- Cell renderer components (if present)

## Usage

Used by column definitions in `lib/entities/<entity>/columns.config.ts` to format cell values.

## Features

- Currency formatting
- Date/time formatting
- Status badge rendering
- Custom cell renderers (favicons, links, etc.)

## Client/Server Notes

- Formatters are pure functions (server-safe)
- Renderers are client components (React components)
