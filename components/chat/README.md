# Chat Components

Components and utilities for the Corso chat interface.

## Directory Structure

- **`sections/`** - Main chat sections (chat-window, chat-composer, chat-page)
- **`components/`** - Chat-specific UI components (model dropdown, preset dropdown, scope buttons)
- **`widgets/`** - Reusable chat widgets (chat-table, chat-welcome, follow-up-chips, message-item)
- **`hooks/`** - Chat-specific React hooks (use-chat)
- **`lib/`** - Chat utilities and types (chat-mode, chat-presets)
- **`utils/`** - Helper utilities (time-utils)

## Design Tokens

Chat-specific design tokens are defined in `styles/tokens/chat.css`:

- **Container widths**: `--chat-container-max-w-sm`, `--chat-container-max-w-md`, `--chat-container-max-w-lg`
- **Spacing**: `--chat-bubble-padding`, `--chat-message-gap`, `--chat-composer-padding-x/y`
- **Border radius**: `--chat-bubble-radius`, `--chat-composer-radius`
- **Colors**: `--chat-bubble-user-bg/fg`, `--chat-bubble-asst-bg/fg/border`

## Styling

The chat interface uses a CSS module (`chat.module.css`) for component-specific styles:

```tsx
import styles from './chat.module.css';

// Use bracket notation for TypeScript compatibility
<div className={styles['chatWindow']}>
  <div className={styles['messagesContainer']}>
    <div className={styles['messagesList']}>
      {/* Messages */}
    </div>
  </div>
</div>
```

### Token Usage in Chat Styles

```css
/* components/chat/chat.module.css */
.messagesList {
  max-width: var(--chat-container-max-w-sm);
  padding: var(--space-md) var(--space-lg);
}

@media (min-width: 1024px) {
  .messagesList {
    max-width: var(--chat-container-max-w-md);
  }
}
```

The CSS module uses design tokens for:
- Container widths (responsive breakpoints)
- Spacing (padding, gaps)
- Colors (via semantic tokens like `--background`, `--foreground`, `--border`)
- Border radius (via chat-specific tokens)
