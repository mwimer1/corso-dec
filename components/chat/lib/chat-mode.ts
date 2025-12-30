/**
 * Chat mode type definitions and constants.
 * Centralizes mode options and labels for consistent usage across chat components.
 */

export type ChatMode = 'projects' | 'companies' | 'addresses';

/**
 * Chat mode options with id and label for UI components.
 */
export const CHAT_MODE_OPTIONS: Array<{ id: ChatMode; label: string }> = [
  { id: 'projects', label: 'Projects' },
  { id: 'companies', label: 'Companies' },
  { id: 'addresses', label: 'Addresses' },
];

/**
 * Mapping of chat mode to display label.
 */
export const CHAT_MODE_LABEL: Record<ChatMode, string> = {
  projects: 'Projects',
  companies: 'Companies',
  addresses: 'Addresses',
};

/**
 * Type guard to check if a string is a valid ChatMode.
 * @param x - String to check
 * @returns True if x is a valid ChatMode
 */
export function isChatMode(x: string): x is ChatMode {
  return x === 'projects' || x === 'companies' || x === 'addresses';
}

