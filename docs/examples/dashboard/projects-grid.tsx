// Example: Using the new unified EntityGridHost pattern
// This replaces the manual AG Grid setup with a simple, type-safe configuration

import { EntityGridHost, getEntityConfig } from '@/components/dashboard/entity';

// In a page component or dashboard layout
export default function ProjectsPage() {
  // Get the pre-configured entity configuration
  const config = getEntityConfig('projects');

  // Render the grid with all AG Grid features automatically configured
  return <EntityGridHost config={config} />;
}

// The configuration includes:
// - Column definitions with custom renderers
// - Server-side data fetching via createEntityFetcher('projects')
// - Default sorting and filtering
// - AG Grid Enterprise features (pagination, filtering, sorting, etc.)
// - Type safety through TypeScript interfaces
