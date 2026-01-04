// components/chat/lib/chat-presets.ts
// Preset prompts for different chat scopes

export type ChatScope = 'recommended' | 'projects' | 'companies' | 'addresses';

export interface ChatPreset {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}

/**
 * Recommended presets (general purpose, auto-detect scope)
 */
export const RECOMMENDED_PRESETS: ChatPreset[] = [
  {
    id: 'recent-activity',
    label: 'Show recent activity',
    prompt: 'Show permits issued in the last 30 days',
    icon: '📅',
  },
  {
    id: 'top-contractors',
    label: 'Top contractors this year',
    prompt: 'Top 10 contractors by total job value YTD',
    icon: '🏆',
  },
  {
    id: 'trending-types',
    label: 'Trending project types',
    prompt: 'Which project types are trending this quarter?',
    icon: '📈',
  },
  {
    id: 'cost-analysis',
    label: 'Cost analysis by category',
    prompt: 'Compare construction costs by project category',
    icon: '💰',
  },
];

/**
 * Project-specific presets
 */
export const PROJECTS_PRESETS: ChatPreset[] = [
  {
    id: 'projects-recent',
    label: 'Recent permits',
    prompt: 'Show permits issued in the last 30 days',
    icon: '🧾',
  },
  {
    id: 'projects-top-contractors',
    label: 'Top contractors YTD',
    prompt: 'Top 10 contractors by total job value YTD',
    icon: '🏆',
  },
  {
    id: 'projects-trending',
    label: 'Trending project types',
    prompt: 'Which project types are trending this quarter?',
    icon: '📈',
  },
  {
    id: 'projects-costs',
    label: 'Compare costs',
    prompt: 'Compare construction costs by project category',
    icon: '🏗️',
  },
];

/**
 * Company-specific presets
 */
export const COMPANIES_PRESETS: ChatPreset[] = [
  {
    id: 'companies-top',
    label: 'Top companies',
    prompt: 'Show me the top companies by project count',
    icon: '🏢',
  },
  {
    id: 'companies-activity',
    label: 'Company activity',
    prompt: 'Which companies have been most active this year?',
    icon: '📊',
  },
  {
    id: 'companies-value',
    label: 'Highest value projects',
    prompt: 'Which companies have the highest total project value?',
    icon: '💎',
  },
  {
    id: 'companies-trends',
    label: 'Company trends',
    prompt: 'What trends do you see in company activity?',
    icon: '📈',
  },
];

/**
 * Address-specific presets
 */
export const ADDRESSES_PRESETS: ChatPreset[] = [
  {
    id: 'addresses-history',
    label: 'Permit history',
    prompt: 'Show me the permit history for this address',
    icon: '📜',
  },
  {
    id: 'addresses-recent',
    label: 'Recent activity',
    prompt: 'What permits have been issued at this address recently?',
    icon: '🆕',
  },
  {
    id: 'addresses-value',
    label: 'Property value trends',
    prompt: 'How has property value changed over time?',
    icon: '💵',
  },
  {
    id: 'addresses-comparison',
    label: 'Compare addresses',
    prompt: 'Compare permit activity across similar addresses',
    icon: '🔍',
  },
];

/**
 * Get presets for a given scope
 */
export function getPresetsForScope(scope: ChatScope): ChatPreset[] {
  switch (scope) {
    case 'recommended':
      return RECOMMENDED_PRESETS;
    case 'projects':
      return PROJECTS_PRESETS;
    case 'companies':
      return COMPANIES_PRESETS;
    case 'addresses':
      return ADDRESSES_PRESETS;
    default:
      return RECOMMENDED_PRESETS;
  }
}
