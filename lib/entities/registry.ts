// lib/entities/registry.ts
export function isGridEntity(x: string): x is 'projects' | 'companies' | 'addresses' {
  return (['projects', 'companies', 'addresses'] as readonly string[]).includes(x);
}

// Chat entity is routed specially (lazy import of ChatPage)
export function isChatEntity(x: string): x is 'chat' {
  return x === 'chat';
}

// All entity types (for type safety and validation)
export const ALL_ENTITIES = ['projects', 'companies', 'addresses', 'chat'] as const;
export type EntityType = typeof ALL_ENTITIES[number];

