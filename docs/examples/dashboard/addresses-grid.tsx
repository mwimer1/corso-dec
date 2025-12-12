// Example: Using the new unified EntityGridHost pattern
// This replaces the manual AG Grid setup with a simple, type-safe configuration

import { EntityGridHost, getEntityConfig } from '@/components/dashboard/entity';

// In a page component or dashboard layout
export default function AddressesPage() {
  // Get the pre-configured entity configuration
  const config = getEntityConfig('addresses');

  // Render the grid with all AG Grid features automatically configured
  return <EntityGridHost config={config} />;
}

// The configuration includes:
// - Column definitions with custom renderers (property types, addresses, financial data)
// - Server-side data fetching via createEntityFetcher('addresses')
// - Default sorting by job value and job count
// - AG Grid Enterprise features (pagination, filtering, sorting, etc.)
// - Type safety through TypeScript interfaces
