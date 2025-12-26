# Marketing Components

Marketing page sections for pricing, contact, and legal pages.

## Purpose

Provides reusable components for marketing pages including pricing displays, contact forms, and legal content.

## Public Exports

From `components/marketing/index.ts`:

- **Layout**: `MarketingContainer`
- **Contact**: `ContactFormWrapper`, `ContactInfo`, `ContactItem`, `ContactLayout`
- **Legal**: `CookiesContent`, `LegalContentWrapper`, `LegalPageSection`, `LegalSection`, `PrivacyContent`, `TermsContent`
- **Pricing**: `PricingFAQ`, `PricingHeader`, `PricingPage`
- **Widgets**: `AnimatedLightningIcon`, `FaqSectionFrame`
- **Re-exports**: Insights components for backward compatibility

## Usage in App Routes

Marketing components are used in:

- **Pricing page**: `PricingPage`, `PricingHeader`, `PricingFAQ` in `/pricing` route
- **Contact page**: `ContactLayout`, `ContactFormWrapper`, `ContactInfo` in `/contact` route
- **Legal pages**: `LegalPageSection`, `PrivacyContent`, `TermsContent`, `CookiesContent` in `/privacy`, `/terms`, `/cookies` routes

## Styling

- **Tailwind CSS**: Primary styling approach
- **CVA Variants**: Component variants in `styles/ui/**`
- **Design Tokens**: Uses CSS custom properties from design system

## Server/Client Notes

- **Server components**: Most marketing sections are server-rendered for SEO
- **Client components**: Interactive widgets and forms require client-side interactivity
- **Content**: Legal content is statically rendered for performance
