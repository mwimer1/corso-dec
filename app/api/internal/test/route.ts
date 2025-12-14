// Internal test endpoint - dev only
export const runtime = 'edge';

import { http } from '@/lib/api';

export async function GET(_req: Request) {
  // Gate for production - return 404 in production
  if (process.env.NODE_ENV === 'production') {
    return http.error(404, 'Not Found', { code: 'NOT_FOUND' });
  }

  return http.ok({ message: 'Test endpoint - dev only' });
}

