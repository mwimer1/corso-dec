// styles/index.ts
// Main styles barrel export - Consolidated UI variants and utilities
// Keep only what's actually consumed cross-domain.

export { latoVariable } from './fonts';
export { cn } from './utils';

// ---- Consolidated UI variant exports (previously in styles/ui/index.ts)
// Re-exports required by components (dashboard, tables, forms, sections)
export {
    accountMenuVariants, contactFormVariants,
    // Dashboard shell
    dashboardShellVariants,
    // FAQ, contact, account menu, file upload, result panel
    faqVariants, fileUploadVariants,
    // Full-width sections
    fullWidthSectionContainerVariants,
    fullWidthSectionGuidelinesVariants,
    fullWidthSectionVariants, resultPanelVariants
} from "./ui/organisms";

export type {
    AccountMenuVariantProps, ContactFormVariantProps, FullWidthSectionContainerVariantProps,
    FullWidthSectionGuidelinesVariantProps,
    FullWidthSectionVariantProps, ResultPanelVariantProps
} from "./ui/organisms";

// ---- Back-compat: dashboardNavbar historically pointed at navbarLayout
export { navbarLayout as dashboardNavbar } from "./ui/organisms";


