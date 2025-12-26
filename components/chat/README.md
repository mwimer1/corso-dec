# Chat Components

AI chat interface components for conversational interactions.

## Purpose

Provides the chat UI for AI-powered conversations, including message display, composer, and chat management.

## Public Exports

From `components/chat/index.ts`:

- **Main Components**: `ChatPage`, `ChatWindow`
- **Widgets**: `ChatTable`, `ChatWelcome`, `FollowUpChips`
- **Hooks**: `useChat` - Chat state management hook

## Usage in App Routes

Chat components are used in:

- **Dashboard chat**: `ChatPage`, `ChatWindow` in `/dashboard/chat` route
- **Message display**: `ChatTable` for displaying conversation history
- **Welcome state**: `ChatWelcome` for empty chat states
- **Follow-up suggestions**: `FollowUpChips` for suggested queries

## Styling

- **Tailwind CSS**: Primary styling approach
- **CVA Variants**: Component variants in `styles/ui/**`
- **Design Tokens**: Uses CSS custom properties from design system

## Hooks

- **`useChat`**: Located in `components/chat/hooks/use-chat.ts`
  - Manages chat state (messages, processing status, errors)
  - Handles message sending with streaming support
  - Provides chat history persistence
  - Used by `ChatWindow` and other chat components

## Server/Client Notes

- **Client components**: All chat components require client-side interactivity (`"use client"` directive)
- **Real-time updates**: Components handle real-time message updates and user interactions
- **Hooks**: Chat hooks are client-only and use React state management

