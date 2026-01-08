/**
 * @fileoverview Organisms - Complex UI sections and complete features
 *
 * This barrel export provides convenient access to all organism components.
 * Organisms are complex components that combine atoms and molecules to form
 * distinct sections of an interface with business logic and state management.
 *
 * @see {@link ./README.md} for detailed documentation and usage examples
 */

// Server-safe components (can be used in server components - no client dependencies)
export * from './server-only';

// Layout utilities (shared layout helpers for responsive design)
export * from './layout-utils';

// Core organism components (alphabetized for consistency)

// 📊 Data & Tables
// data-display removed - unused per audit
export * from './result-panel'; // Container for search/query results
// Note: Table components moved to @/components/dashboard/table

// 📈 Data Visualization
// Chart components removed: analytics-chart (removed earlier), line-chart and pie-chart are unused and removed.
// Chart loader/helpers/types/base/shell removed to eliminate unused chart code.

// 🧭 Navigation & Layout
export * from './public-layout'; // Shared public/marketing layout

 // Unified footer system with CTA, main navigation, and legal sections
// Footer system components (individual exports)
export { default as Footer } from './footer-system/footer';
// Navbar public surface: export only the main entry to avoid leaking
// internal navbar modules that can create self-import cycles.
export * from './navbar/navbar';
// Internal navbar helpers remain importable via the local internal barrel:
// import { ... } from './navbar/internal';
// Note: navbar/internal module was removed - internal helpers are now in navbar/index.ts


export * from './full-width-section'; // Full-width layout sections with backgrounds

// 💬 User Interaction
export * from './faq'; // Collapsible FAQ section with variants
// file-upload removed - unused per audit

// 👤 User Management
// account-menu and auth-secure removed - unused per audit
// Removed: user-profile exports - superseded by Clerk UserProfile

// 🔧 System & Utilities
export * from './app-error-boundary'; // React error boundary wrapper with logging
export * from './error-fallback'; // User-friendly error state display


export * from './footer';
export * from './site-footer-shell';


