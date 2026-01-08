import { addressesConfig } from './addresses/config';
import { companiesConfig } from './companies/config';
import { projectsConfig } from './projects/config';

export { default as EntityGrid } from './shared/entity-grid';
export { default as EntityGridHost } from './shared/entity-grid-host';

export const registry = {
  projects: projectsConfig,
  addresses: addressesConfig,
  companies: companiesConfig,
} as const;

export const getEntityConfig = (id: keyof typeof registry) => registry[id];



