// FILE: .stylelintrc.cjs
/** @type {import('stylelint').Config} */
module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-tailwindcss'],
  plugins: [
    'stylelint-order',
  ],
  rules: {
    // Ensure @import appears at the top (only @charset or empty @layer may precede)
    'no-invalid-position-at-import-rule': true,
    'selector-class-pattern': '^[a-z][a-z0-9-]*$',
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['apply', 'variants', 'responsive', 'tailwind', 'layer', 'screen'],
      },
    ],
    // Disallow the invalid ::root selector (should be :root)
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global'],
      },
    ],
    // Custom plugin-like checks using regex-based rules
    // 1) Ban ::root explicitly via selector-disallowed-list
    'selector-disallowed-list': [/^::root/],
    // 2) In non-token CSS, disallow raw hex colors to enforce tokens
    'color-no-hex': [
      true,
      {
        // Exempt token files where raw values are defined
        except: [
          /styles\/tokens\//,
        ],
      },
    ],
    // 3) In non-token CSS, disallow rgb()/hsl() unless using CSS variables
    'function-disallowed-list': [
      // Allow hsl(var(--...)) but not bare hsl()/rgb() without var
      /^hsl\((?!var\().*$/,
      /^rgb\(/,
    ],
    // 4) Disallow faint hardcoded border colors; require tokens like var(--border-subtle)
    'declaration-property-value-disallowed-list': {
      // Border properties: block ultra-light black variants used as faint borders
      '/^border(-.*)?$/': [
        /hsla?\(\s*0\s*,\s*0%\s*,\s*0%\s*,\s*0?\.?0?6\s*\)/i,
        /hsl\(\s*0deg\s+0%\s+0%\s*\/\s*0?\.?0?6\s*\)/i,
      ],
      // Disallow legacy token vars anywhere
      '/.*/': [
        /var\(--brand-blue[^)]*\)/i,
        /var\(--marketing-cta[^)]*\)/i,
        /var\(--surface-alt\)/i,
      ],
    },
    // Allow prefixed + unprefixed pairs when values differ
    'declaration-block-no-duplicate-properties': [true, {
      ignore: ['consecutive-duplicates-with-different-values']
    }],
    // Disable property ordering for now - vendor prefixes are handled manually
    'order/properties-order': null,
    // Enforce modern color function notation (rgb(r g b / a) instead of rgba(r, g, b, a))
    'color-function-notation': 'modern',
  },
  ignoreFiles: ['**/.next/**', '**/build/**', '**/node_modules/**'],
  overrides: [
    {
      files: ['styles/tokens/**/*.css'],
      rules: {
        // Tokens may contain raw values; relax color checks in tokens
        'color-no-hex': null,
        'function-disallowed-list': null,
      },
    },
    {
      files: ['**/*.module.css'],
      rules: {
        // Allow camelCase in CSS Modules class names
        'selector-class-pattern': null,
        // Permit single-line declaration blocks in CSS Modules
        'declaration-block-single-line-max-declarations': null,
      },
    },
  ],
};
