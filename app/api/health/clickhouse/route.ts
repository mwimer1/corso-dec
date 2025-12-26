// Alias route: delegates to canonical /api/public/health/clickhouse implementation
// This provides backward compatibility and aligns with OpenAPI documentation
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export { GET, HEAD, OPTIONS } from '../../public/health/clickhouse/route';

