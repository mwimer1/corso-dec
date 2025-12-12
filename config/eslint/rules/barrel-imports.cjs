module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/lib/shared/constants/*'],
            message:
              "Use the barrel '@/lib/shared/constants' instead of deep imports.",
          },
        ],
      },
    ],
  },
};
