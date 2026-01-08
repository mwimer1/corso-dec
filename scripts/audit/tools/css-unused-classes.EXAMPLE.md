# CSS Unused Classes Detector - Example Output

## Example Finding JSON

For a CSS module with an unused class, here's what the finding looks like:

### High Confidence (Warn Severity)

```json
{
  "tool": "css-unused-classes",
  "ruleId": "css/unused-class",
  "severity": "warn",
  "file": "components/button/button.module.css",
  "line": 15,
  "col": 3,
  "message": "Unused CSS class: unusedButton",
  "hint": "This class appears unused. Remove it or add a suppression comment.",
  "fingerprint": "css-unused-classes|css/unused-class|components/button/button.module.css|unusedButton",
  "data": {
    "className": "unusedButton",
    "confidence": "high"
  }
}
```

### Low Confidence (Info Severity)

When dynamic access is detected, unused classes are marked as `info` severity:

```json
{
  "tool": "css-unused-classes",
  "ruleId": "css/unused-class",
  "severity": "info",
  "file": "components/dynamic/dynamic.module.css",
  "line": 20,
  "col": 5,
  "message": "Unused CSS class: maybeUsed",
  "hint": "This class may be unused, but detection confidence is low due to dynamic access or parse errors.",
  "fingerprint": "css-unused-classes|css/unused-class|components/dynamic/dynamic.module.css|maybeUsed",
  "data": {
    "className": "maybeUsed",
    "confidence": "low"
  }
}
```

### Dynamic Access Detection

When dynamic access patterns are found, an info-level finding is emitted:

```json
{
  "tool": "css-unused-classes",
  "ruleId": "css/dynamic-access",
  "severity": "info",
  "file": "components/dynamic/dynamic.module.css",
  "message": "CSS module has dynamic class access - unused class detection may be incomplete",
  "hint": "Dynamic access patterns like styles[variable] prevent accurate unused class detection",
  "fingerprint": "css-unused-classes|css/dynamic-access|components/dynamic/dynamic.module.css"
}
```

### Parse Error

If CSS parsing fails:

```json
{
  "tool": "css-unused-classes",
  "ruleId": "css/parse-error",
  "severity": "warn",
  "file": "components/broken/broken.module.css",
  "message": "Failed to parse CSS module: Unexpected token",
  "fingerprint": "css-unused-classes|css/parse-error|components/broken/broken.module.css"
}
```

## Example CSS Module

```css
/* components/button/button.module.css */

.button {
  padding: 1rem;
}

/* css-audit-ignore unused-class */
.legacyButton {
  padding: 0.5rem;
}

.unusedButton {
  padding: 2rem; /* This will be flagged as unused */
}

.composedButton {
  composes: button;
  /* This will be marked as used if .button is used */
}
```

## Example TypeScript Usage

```typescript
// components/button/Button.tsx
import styles from './button.module.css';

// ✅ Used: styles.className
<div className={styles.button} />

// ✅ Used: styles['className']
<div className={styles['composedButton']} />

// ✅ Used: destructuring
const { button } = styles;
<div className={button} />

// ❌ Dynamic access (lowers confidence)
const className = getClassName();
<div className={styles[className]} /> // Emits dynamic-access finding

// ✅ Ignored: cn() helper automatically handles styles.className
import { cn } from '@/lib/utils';
<div className={cn(styles.button, 'extra-class')} />
```

## Suppression Examples

### Class-level suppression

```css
/* css-audit-ignore unused-class */
.legacyButton {
  /* This class will be ignored even if unused */
}
```

### File-level suppression

```css
/* css-audit-ignore-file unused-classes */

.button {
  /* All classes in this file are ignored */
}
```

## Baseline Behavior

- Only `warn`-level unused class findings are baselined
- `info`-level findings (low confidence) are never baselined
- Dynamic access findings are never baselined
- Parse errors are never baselined
