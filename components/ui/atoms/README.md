# Atoms

Basic UI building blocks - the smallest reusable components in the design system.

## Purpose

Atoms are fundamental components that cannot be broken down further without losing their meaning. They form the foundation of the design system and are used to build molecules and organisms.

## Public Exports

From `components/ui/atoms/index.ts`:

- **Buttons & Actions**: `Button`, `Toggle`, `Slider`
- **Form Controls**: `Input`, `Label`, `Select` (via molecules)
- **Layout**: `Card`, `CardContent`, `CardDescription`, `CardFooter`, `CardHeader`, `CardTitle`
- **Feedback**: `Spinner`, `Skeleton`, `Progress`, `ProgressIndicator`
- **Navigation**: `Link`, `SkipNavLink`, `RouteLoading`
- **Branding**: `Logo`
- **Icons**: `IconBase`, icon components from `icon/icons`
- **Badges**: `Badge`

## Usage in App Routes

Atoms are used throughout the application:

- **Dashboard**: Buttons, Cards, Spinners in entity pages (`/dashboard/(entities)/[entity]`)
- **Chat**: Buttons, Inputs in chat interface (`/dashboard/chat`)
- **Marketing**: Buttons, Cards, Links in landing pages (`/`, `/pricing`)
- **Auth**: Buttons, Inputs in sign-in/sign-up (`/sign-in`, `/sign-up`)

## Styling

- **Tailwind CSS**: Primary styling approach
- **CVA Variants**: Component variants in `styles/ui/atoms/**`
- **Design Tokens**: Uses CSS custom properties from `styles/tokens`

## Server/Client Notes

Most atoms are **client components** (require `"use client"`):
- `Button`, `Input`, `Toggle`, `Slider` - Interactive components
- `Spinner`, `Progress` - Animated components

Some atoms are **server-safe**:
- `Card`, `CardContent`, etc. - Presentational only
- `Logo` - Static image component

## Internal-Only

No internal-only modules in atoms (all exports are public).
