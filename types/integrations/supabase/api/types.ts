 
/* cspell:ignore Supabase */  // spell‑checker – let “Supabase” pass

/**
 * Response shape returned by
 * `POST /auth/v1/token?grant_type=password` (or similar)
 * when exchanging a JWT with Supabase.
 */
export interface SupabaseApiJwtExchangeResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number; // seconds
  refresh_token: string;
  /** Raw user payload ‑ depends on your Supabase auth setup */
  user: unknown;
}

/**
 * Options that can be passed to a (generic) SQL‑execution helper.
 *
 * @template T – row‐transformer return type
 */
export interface SQLExecutionOptions<T = unknown> {
  /**
   * Milliseconds before the request is aborted  
   * (defaults to 30 000 ms if omitted).
   */
  timeout?: number;

  /** Throw if the query returns **zero** rows (default: false). */
  throwOnEmpty?: boolean;

  /**
   * Optional transformer applied to every row.
   *
   * The parameter’s name is deliberately prefixed with “_”;  
   * it is never *used* inside this type signature, but ESLint
   * would otherwise treat it as an unused identifier.
   */
   
  transform?: (_row: unknown) => T;
}

