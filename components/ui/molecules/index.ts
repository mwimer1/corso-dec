// ===== ALERTS & MESSAGES =====
// Removed unused components: alert-box, alert-system

// ===== AUTHENTICATION =====
export * from './auth-card';

// ===== DATA DISPLAY =====


// Removed unused component: basic-card
// Removed unused component: EmptyState (main component)
// Removed unused component: info-panel

// ===== DIALOGS & OVERLAYS =====
// Removed unused component: confirm-dialog

// ===== FORMS & INPUTS =====
// Removed unused component: category-filter, form-library
export * from './select';
export * from './text-area';

// ===== LAYOUT & STRUCTURE =====
export * from './page-header';

// ===== LOADING & SKELETONS =====
export * from './loading-states';
export * from './skeleton-suite';
export { SkeletonTable } from './skeleton-suite';

// ===== NAVIGATION =====
export * from './nav-item';

// ===== PRICING =====
export * from './pricing-card';

// ===== PROGRESS =====
// Removed unused component: progress-indicator

// ===== ANIMATIONS =====
// Removed: LottieAnimation component

// ===== TABS =====
// Tab switcher components (individual exports)
export { TabSwitcher, type TabItem } from './tab-switcher/tab-switcher';
// ===== TABS SYSTEM COMPONENTS =====
// Advanced tab system with context management and accessibility

// Legacy Tabs API pruned; TabSwitcher internals not exported

// ===== USAGE NOTES =====
// 1. Use TabsProvider + TabList + Tab + TabPanel for complex tab systems
// 2. Use simple Tabs component for basic tab functionality
// 3. All components include design system variants and full accessibility support



// ===== NAV ANALYTICS =====
export * from './link-track';

// ===== METRICS =====
export * from './metric-card';

// ===== READING PROGRESS =====
export * from './reading-progress';


