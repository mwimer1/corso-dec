import { zUseCaseMap, type UseCase, type UseCaseKey } from '@/lib/marketing/client';

export const DEFAULT_USE_CASES: Record<UseCaseKey, UseCase> = {
  insurance: {
    title: 'Insurance Brokers',
    subtitle: 'Prospect the moment coverage is needed',
    description:
      'Permit signals expose real buying windows. Reach owners the week projects are approved and convert when intent is highest.',
    benefits: [
      'Alerts for remodel & new‑build permits in your territory',
      'Auto‑enrich owners and route by agent/region',
      'Trigger cadences the same week a permit hits',
    ],
    impact: 'Agencies report 20–35% more qualified conversations and 10–18% higher close rates.',
  },
  suppliers: {
    title: 'Building Materials Suppliers',
    subtitle: 'Win the order before the PO',
    description:
      'See projects early, influence specs, and engage contractors while decisions are still open.',
    benefits: [
      'Notify reps when target contractors pull permits',
      'Faster quotes with project & property context',
      'Track share‑of‑wallet by contractor and region',
    ],
    impact: 'Suppliers see 6–12% revenue lift and shorter sales cycles.',
  },
  construction: {
    title: 'Contractors & Builders',
    subtitle: 'Be first to every job',
    description:
      'Find active projects by trade and time outreach to approvals to win more work.',
    benefits: [
      'Permit‑matched leads by trade & territory',
      'Auto‑route, dedupe, and track follow‑ups',
      'ROI from lead → booked job',
    ],
    impact: 'Teams see 20–30% more leads and 15–25% faster booking.',
  },
  developers: {
    title: 'Developers & Real Estate',
    subtitle: 'Build smarter with data-driven insights',
    description:
      'Access comprehensive building permit data to identify development opportunities, track market trends, and make informed investment decisions.',
    benefits: [
      'Early identification of development opportunities',
      'Market trend analysis and competitive intelligence',
      'Property value assessment and investment timing',
    ],
    impact: 'Developers report 25–40% better market timing and 15–30% improved project ROI.',
  },
} as const;

// Lightweight runtime guard (dev only) so content shape changes don't silently regress
// NODE_ENV check allowed for dev-only validation
if (process.env.NODE_ENV !== 'production') {
  try {
    zUseCaseMap.parse(DEFAULT_USE_CASES);
  } catch (e) {
    console.error('[UseCaseExplorer] Invalid DEFAULT_USE_CASES:', e);
  }
}



