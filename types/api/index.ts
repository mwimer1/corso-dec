// Expose OpenAPI contract types via a stable barrel.
// This keeps imports consistent: import type { paths, operations } from '@/types/api';
export type {
    components, operations, paths
} from './generated/openapi';


