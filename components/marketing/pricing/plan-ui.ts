export type PlanKey = 'starter' | 'plus' | 'pro';
export type BillingCycle = 'monthly' | 'annual';

// UI-facing plan data (safe to render on client). Tie to billing config later if desired.
export const PRICING_UI: Record<PlanKey, {
  label: string;
  monthlyUsd: number;
  annualUsd: number; // per-month equivalent on annual (display only)
  tagline: string;
  features: string[];
  popular?: boolean;
}> = {
  starter: {
    label: 'CorsoAI',
    monthlyUsd: 20,
    annualUsd: 16, // illustrative 20% savings -> $16/mo billed annually
    tagline: 'AI Chat',
    features: [
      '50 CorsoAI chat queries per month',
      'Query billions of datapoints in seconds',
      'Exportable data tables right from the chat interface',
    ],
  },
  plus: {
    label: 'Plus',
    monthlyUsd: 50,
    annualUsd: 40,
    tagline: 'AI Chat + Projects',
    features: [
      '100 CorsoAI chat queries per month',
      '1,000 project exports per month',
      'Projects portal with 15+ years of permit history',
    ],
    popular: true,
  },
  pro: {
    label: 'Pro',
    monthlyUsd: 100,
    annualUsd: 80,
    tagline: 'AI Chat + Projects + Companies',
    features: [
      '250 CorsoAI chat queries per month',
      '2,500 project or company exports per month',
      'Projects portal with 15+ years of permit history',
      'Companies portal with granular activity metrics',
    ],
  },
};

export function formatPriceUSD(value: number) {
  return `$${value}`;
}

export function selectPlanHref(plan: PlanKey) {
  // If the app uses Next.js App Router, this is safe:
  // Use sign-in for auth gating; marketing selects should redirect to sign-up for new users
  return { pathname: '/sign-in', query: { plan } } as const;
}

