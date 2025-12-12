export type DocStatus = 'stable' | 'draft' | string;

export function normalizeDocStatus(raw: unknown): DocStatus {
  const statusSource = typeof raw === 'string' ? raw : '';
  const normalized = (statusSource ?? '').toString();
  const parts = normalized.replace(/^['"]|['"]$/g, '').split('#');
  return (parts[0] ?? '').trim().toLowerCase();
}

export const isStable = (s: DocStatus) => s === 'stable';

