---
title: "Chat"
last_updated: "2026-01-03"
category: "components"
status: "active"
description: "UI components for the components system, following atomic design principles. Located in chat/."
---
# Chat Components

Chat interface components for conversational data exploration and querying.

## 📁 Structure

```
components/chat/
├── sections/          # Main chat interface sections
│   ├── chat-window.tsx    # Main chat window container
│   ├── chat-composer.tsx  # Message input composer
│   └── chat-page.tsx       # Full chat page layout
├── widgets/          # Chat-specific widgets
│   ├── message-item.tsx    # Individual message display
│   ├── chat-welcome.tsx    # Welcome screen with presets
│   ├── chat-table.tsx      # Table visualization in messages
│   └── follow-up-chips.tsx # Follow-up question suggestions
├── hooks/            # Chat-specific hooks
│   └── use-chat.ts         # Main chat state management
├── lib/              # Chat utilities
│   └── chat-mode.ts        # Chat mode types and utilities
├── utils/            # Helper utilities
│   └── time-utils.ts       # Time formatting utilities
├── chat.module.css   # Chat-specific styles (CSS module)
└── index.ts          # Public exports
```

## 🎨 Styling System

### CSS Module
The chat interface uses a CSS module (`chat.module.css`) for component-specific styles:

- **Responsive container widths**: Uses `--chat-container-max-w-*` tokens
- **Spacing**: Uses `--chat-composer-padding-*` and `--chat-message-gap` tokens
- **Layout**: Complex flex layouts for messages and composer

### Design Tokens
Chat-specific tokens are defined in `styles/tokens/chat.css`:

- **Container widths**: `--chat-container-max-w-sm/md/lg` (responsive breakpoints)
- **Spacing**: `--chat-composer-padding-x/y`, `--chat-message-gap`
- **Borders**: `--chat-composer-border`, `--chat-bubble-asst-border`
- **Colors**: `--chat-bubble-user-bg/fg`, `--chat-bubble-asst-bg/fg`

### Usage Example
```tsx
import styles from '../chat.module.css';

<div className={styles['chatWindow']}>
  <div className={styles['messagesContainer']}>
    {/* Messages */}
  </div>
  <div className={styles['composerContainer']}>
    {/* Composer */}
  </div>
</div>
```

## 🔧 Key Components

### ChatWindow
Main chat interface container that manages:
- Message list rendering
- Composer integration
- Message state
- Auto-scroll behavior

### ChatComposer
Message input component with:
- Auto-growing textarea
- Mode selection (auto/projects/companies/addresses)
- Send/stop controls
- IME composition support

### MessageItem
Individual message display with:
- User/assistant message styling
- Table visualization support
- Follow-up question chips
- Typing indicator

## 📚 Related Documentation

- [Styling Standards](../../.cursor/rules/styling-standards.mdc) - CSS module guidelines
- [Component Design System](../../.cursor/rules/component-design-system.mdc) - Component architecture

