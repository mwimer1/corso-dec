
export default {
  plugins: {
    tailwindcss: { config: 'tailwind.config.ts' },
    'postcss-import': {},
    'tailwindcss/nesting': {},
    autoprefixer: {},
    cssnano:
      process.env['NODE_ENV'] === 'production' // v2025-06-10-audit
        ? {
            preset: [
              'default',
              {
                discardComments: {
                  removeAll: true,
                },
                minifyFontValues: {
                  removeQuotes: false,
                },
              },
            ],
          }
        : false,
  },
};
