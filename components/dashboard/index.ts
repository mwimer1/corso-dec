// ===== DASHBOARD CONTEXT =====
// ===== LAYOUT =====
export * from './layout/dashboard-layout';
export * from './layout/dashboard-sidebar';
export * from './layout/dashboard-top-bar';

// ===== SIDEBAR =====
export { SidebarProvider, useSidebar } from './sidebar/sidebar-context';
export type { SidebarState } from './sidebar/sidebar-context';
export { SidebarItem } from './sidebar/sidebar-item';
export { SidebarRoot } from './sidebar/sidebar-root';
export { SidebarTooltip } from './sidebar/sidebar-tooltip';
export * from './sidebar/sidebar-tooltip-layer';
export { SidebarTop } from './sidebar/sidebar-top';
export { SidebarUserProfile } from './sidebar/sidebar-user-profile';

// ===== HEADER =====
export * from './corso-ai-mode';
export * from './header/dashboard-header';


// ===== DATA VISUALIZATION =====
// Widget components removed - analytics dashboard no longer needed

// Chat UI now lives under `@/components/chat` and is routed via `(entities)/chat`.

// ===== DATA MANAGEMENT =====
// AG Grid container (legacy) is deprecated; prefer EntityGrid via './entity'

// ===== ENTITY MANAGEMENT =====
// NOTE: Entity server-only builders and pages MUST NOT be exported from this
// client-facing barrel. Exporting server-only modules here would leak server
// code into client bundles and break Next.js runtime boundaries. Import the
// server helpers directly where needed, for example:
//   const { createEntityFetchData } = await import('@/lib/services/entity')
// Client-only helpers (if needed) should be exported from a dedicated client
// barrel under components/dashboard/entity/client.ts

// ===== UTILITY COMPONENTS =====
// Chat primitives are provided by `@/components/chat` and `@/hooks/chat`.

// ===== SERVER-ONLY COMPONENTS =====
// Server-only dashboard components and pages are NOT exported here to avoid
// leaking server code into client bundles. Import server-only helpers directly
// where needed:
// import { EntityListPage } from './entity/entity-list-page';


