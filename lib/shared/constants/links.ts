// lib/shared/constants/links.ts
/* lib/constants/ui/links.ts
   Centralized <Link href="..."> targets for navigation.
 */
export const APP_LINKS = {
  NAV: {
    HOME: '/',
    INSIGHTS: '/insights',
    PRICING: '/pricing',
    FAQ: '/pricing#faq',
    SIGNIN: '/sign-in',
    SIGNUP: '/sign-up',
    JOIN_WAITLIST: '/sign-up',
    BOOK_DEMO: 'https://calendly.com/corso-demo',
  },
  DASHBOARD: {
    PROJECTS: '/dashboard/projects',
    COMPANIES: '/dashboard/companies',
    ADDRESSES: '/dashboard/addresses',
    CHAT: '/dashboard/chat',
  },
  FOOTER: {
    PRIVACY: '/legal/privacy',
    TERMS: '/legal/terms',
    SECURITY: '/security',
    STATUS: '/status',
    CONTACT: '/contact',
  },
  EXTERNAL: {
    HELP_CENTER: 'https://help.getcorso.com',
  },
} as const;

// Helper types removed - they were unused

