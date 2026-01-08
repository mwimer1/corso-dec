# CSS Overlapping Rules Detector - Example Output

## Example Finding JSON

### Duplicate Declaration Blocks (Cross-File)

#### Info Severity (Same Selector)

```json
{
  "tool": "css-overlapping-rules",
  "ruleId": "css/duplicate-declarations",
  "severity": "info",
  "file": "components/button/button.module.css",
  "message": "Duplicate declaration block found in 2 file(s)",
  "hint": "Consider consolidating into a shared utility class or CSS variable. Files: components/button/button.module.css, components/link/link.module.css",
  "fingerprint": "css-overlapping-rules|css/duplicate-declarations|padding:1rem;margin:0|components/button/button.module.css",
  "data": {
    "signature": "padding:1rem;margin:0",
    "fileCount": 2,
    "selectorCount": 1,
    "otherFiles": ["components/link/link.module.css"],
    "selectors": [".action"],
    "recommendation": "Consider extracting to shared utility or token"
  }
}
```

#### Warn Severity (Different Selectors)

```json
{
  "tool": "css-overlapping-rules",
  "ruleId": "css/duplicate-declarations",
  "severity": "warn",
  "file": "components/card/card.module.css",
  "message": "Duplicate declaration block found in 3 file(s) with 2 different selector(s)",
  "hint": "Consider consolidating into a shared utility class or CSS variable. Found in 3 files: components/card/card.module.css, components/modal/modal.module.css, components/panel/panel.module.css",
  "fingerprint": "css-overlapping-rules|css/duplicate-declarations|background:hsl(var(--background));border-radius:0.5rem;padding:1rem|components/card/card.module.css",
  "data": {
    "signature": "background:hsl(var(--background));border-radius:0.5rem;padding:1rem",
    "fileCount": 3,
    "selectorCount": 2,
    "otherFiles": ["components/modal/modal.module.css", "components/panel/panel.module.css"],
    "selectors": [".card", ".container"],
    "recommendation": "Consider extracting to shared utility or token"
  }
}
```

### Conflicting Selector (Same File)

```json
{
  "tool": "css-overlapping-rules",
  "ruleId": "css/conflicting-selector",
  "severity": "warn",
  "file": "components/form/form.module.css",
  "message": "Selector \".input\" appears 3 time(s) with conflicting declarations",
  "hint": "Conflicting properties: padding: 0.5rem vs 0.75rem; border-color: hsl(var(--border)) vs hsl(var(--primary)). Consolidate into a single rule.",
  "fingerprint": "css-overlapping-rules|css/conflicting-selector|components/form/form.module.css|.input",
  "data": {
    "selector": ".input",
    "occurrenceCount": 3,
    "conflicts": [
      {
        "property": "padding",
        "values": ["0.5rem", "0.75rem"]
      },
      {
        "property": "border-color",
        "values": ["hsl(var(--border))", "hsl(var(--primary))"]
      }
    ]
  }
}
```

## Example CSS Files

### Duplicate Declaration Blocks

**File 1: components/button/button.module.css**
```css
.action {
  padding: 1rem;
  margin: 0;
}
```

**File 2: components/link/link.module.css**
```css
.action {
  padding: 1rem;
  margin: 0;
}
```

**Finding**: Info-level finding in both files suggesting consolidation.

### Conflicting Selector

**File: components/form/form.module.css**
```css
.input {
  padding: 0.5rem;
  border-color: hsl(var(--border));
}

/* ... other rules ... */

.input {
  padding: 0.75rem;  /* Conflict: different padding */
  border-color: hsl(var(--primary));  /* Conflict: different border-color */
}
```

**Finding**: Warn-level finding indicating selector appears multiple times with conflicting declarations.

## Changed Mode Behavior

In `--changed` mode:
- Only analyzes CSS files that have changed
- For cross-file duplicates, only reports if at least one of the duplicate files has changed
- This prevents noise from existing duplicates while still catching new duplicates introduced by changes

## Recommendations

### For Duplicate Declarations

1. **Extract to shared utility class**: If the same styles appear in multiple files, create a shared utility class in `styles/ui/patterns/`
2. **Use CSS variables**: For repeated values, extract to design tokens in `styles/tokens/`
3. **Consolidate in one file**: Move duplicate styles to a shared location and import where needed

### For Conflicting Selectors

1. **Merge rules**: Combine multiple rules with the same selector into a single rule
2. **Check specificity**: Ensure the intended cascade order is correct
3. **Refactor structure**: If selectors are intentionally repeated, document why and consider a different approach
