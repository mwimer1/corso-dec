// app/api/v1/csp-report/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getEnvEdge, http, readJsonOnce, withErrorHandlingEdge as withErrorHandling, withRateLimitEdge as withRateLimit } from "@/lib/api/edge";
import { RATE_LIMIT_30_PER_MIN } from "@/lib/middleware";
import { handleCors } from '@/lib/middleware/http/cors';
import {
    cspViolationBodySchema,
    legacyCspReportSchema,
    reportToBatchSchema,
    type CspViolation,
} from "@/lib/validators/security/csp";

const post = withErrorHandling(
  withRateLimit((async (req: Request) => {
    const ct = (req.headers.get("content-type") ?? "").toLowerCase();
    let reports: CspViolation[] = [];

    // Only attempt to parse JSON for supported content types
    if (!ct.includes("application/reports+json") &&
        !ct.includes("application/csp-report") &&
        !ct.includes("application/json")) {
      return http.badRequest("Unsupported content type", { code: "UNSUPPORTED_CONTENT_TYPE" });
    }

    let json: unknown;
    try {
      json = await readJsonOnce(req);
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_JSON') {
        // No/invalid JSON: don't spam logs; just exit fast
        return http.noContent({
          headers: { 'Access-Control-Allow-Origin': '*' },
        });
      }
      throw error;
    }

    // Reporting API (application/reports+json): [{ type, body, ... }]
    if (ct.includes("application/reports+json")) {
      const parsed = reportToBatchSchema.safeParse(json);
      if (!parsed.success) return http.badRequest("Invalid CSP report", { code: "INVALID_CSP_REPORT" });
      reports = parsed.data
        .filter((r) => r.type === "csp-violation" && r.body)
        .map((r) => r.body)
        .map((b: unknown) => cspViolationBodySchema.safeParse(b))
        .filter((res) => res.success)
        .map((res) => res.data);
    }
    // Legacy (application/csp-report): { "csp-report": { ... } }
    else if (ct.includes("application/csp-report") || (json && typeof json === "object" && "csp-report" in (json as any))) {
      const parsed = legacyCspReportSchema.safeParse(json);
      if (!parsed.success) return http.badRequest("Invalid CSP report", { code: "INVALID_CSP_REPORT" });
      reports = [parsed.data["csp-report"]];
    }
    // Accept permissive JSON too: { ...violation body... }
    else if (ct.includes("application/json")) {
      const parsed = cspViolationBodySchema.safeParse(json);
      if (!parsed.success) return http.badRequest("Invalid CSP report", { code: "INVALID_CSP_REPORT" });
      reports = [parsed.data];
    } else {
      return http.badRequest("Unsupported content type", { code: "UNSUPPORTED_CONTENT_TYPE" });
    }

    if (reports.length === 0) {
      return http.badRequest("Empty CSP report", { code: "EMPTY_CSP_REPORT" });
    }

    const env = getEnvEdge();

    // Optional fan-out to internal ingestion (non-blocking)
    if (env.CSP_FORWARD_URI) {
      try {
        // keepalive lets the browser finish even on page unload
        fetch(env.CSP_FORWARD_URI, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reports }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        // ignore fan-out errors
      }
    }

    // Dev visibility with noise reduction (Node runtime; use validated server env)
    if (env.NODE_ENV !== "production" && env.CSP_REPORT_LOG !== 'false') {
      // Suppress known dev-only sources (Next DevTools & React DOM chunk)
      const DEV_SUPPRESS_RE = /_next\/static\/chunks\/.*(next-devtools|react-dom)/i;
      // CSP_REPORT_MAX_LOGS is provided as a number in the validated env; coerce defensively
      const MAX_LOGS_PER_POST = Number((env.CSP_REPORT_MAX_LOGS as unknown as number | undefined) ?? 2); // cap console noise

      const filtered = reports.filter((report) => {
        const src = report['source-file'] || '';
        return !DEV_SUPPRESS_RE.test(src);
      });

      // Log concise summaries, capped
      let logged = 0;
      for (const report of filtered) {
        if (logged >= MAX_LOGS_PER_POST) break;
        const summary = {
          dir: report['violated-directive'] || report['effective-directive'],
          blocked: report['blocked-uri'],
          source: report['source-file'],
          line: report['line-number'],
          col: report['column-number'],
          disp: report['disposition'],
        };
        if (Math.random() < 0.2) console.warn('[csp]', summary); // sample logs ~20%
        logged++;
      }
    }

    // Always 204 to avoid browser retries/backpressure
    return http.noContent({
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }) as any, RATE_LIMIT_30_PER_MIN)
);

export const POST = post;

// CORS preflight handler (Edge)
export const OPTIONS = (req: Request) => {
  const res = handleCors(req);
  return res ?? http.noContent();
};

