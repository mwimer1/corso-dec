# Dashboard Auth Mode Verification Guide

## Quick Verification Checklist

### Prerequisites
1. **Restart dev server** after changing env vars (Next.js caches env at build time)
2. Set `.env.local`:
   ```bash
   NEXT_PUBLIC_AUTH_MODE=relaxed
   ALLOW_RELAXED_AUTH=true
   CORSO_USE_MOCK_DB=true
   DISABLE_RATE_LIMIT=true
   ```

### Step 1: Verify API Endpoint Directly

**Before testing the grid**, verify the API works:

1. Sign in to the app
2. Open browser DevTools → Network tab
3. Navigate to: `http://localhost:3000/api/v1/entity/projects?page=0&pageSize=50`
4. Check response:

**✅ Expected (Relaxed Mode):**
- Status: `200 OK`
- Response body: `{ "success": true, "data": { "data": [...], "total": N, ... } }`

**❌ If 403:**
- Check: Is `NEXT_PUBLIC_AUTH_MODE=relaxed` set?
- Check: Is `ALLOW_RELAXED_AUTH=true` set?
- Check: Did you restart the dev server?
- Check: Response body should show `"code": "NO_ORG_CONTEXT"` in strict mode

**❌ If 429:**
- Check: Is `DISABLE_RATE_LIMIT=true` set?
- Check: Did you restart the dev server?
- Check: Look for `x-ratelimit-*` headers in response

### Step 2: Verify Grid Loads Data

1. Navigate to: `http://localhost:3000/dashboard/projects`
2. Open DevTools → Network → XHR/fetch filter
3. Reload page once
4. Check:

**✅ Expected:**
- 1-2 requests to `/api/v1/entity/projects...` (initial load + possible SSRM initialization)
- Grid shows rows (not empty)
- No error banner

**❌ If empty grid but API returns 200:**
- Check: Grid column definitions match row data keys
- Check: Browser console for AG Grid errors
- Check: `fetchers.ts` response mapping

**❌ If request storm:**
- Check: Network tab shows repeated identical requests
- Check: `entity-grid.tsx` refresh logic (should only refresh on actual orgId change)
- Check: No infinite retry loops

### Step 3: Verify No Request Storm

**Critical check** - this catches the most common regression:

1. On `/dashboard/projects` page
2. DevTools → Network → XHR/fetch
3. Reload once
4. Count requests to `/api/v1/entity/projects...`

**✅ Expected:**
- 1-2 requests total (initial page load)
- Requests stop after initial load
- No repeated identical requests

**❌ If storm detected:**
- Note: Are requests identical (same URL params)?
- Note: Do they happen immediately (tight loop) or every few seconds (retry)?
- Check: `entity-grid.tsx` useEffect dependencies
- Check: `lastOrgIdRef` guard logic

### Step 4: Verify Strict Mode Still Works

1. Set `.env.local`:
   ```bash
   NEXT_PUBLIC_AUTH_MODE=strict
   # or remove NEXT_PUBLIC_AUTH_MODE entirely
   ```
2. **Restart dev server**
3. Navigate to `/dashboard/projects` (without org membership)

**✅ Expected:**
- Error banner: "No organization selected. (Strict mode.)"
- **No request storm** (grid should not spam requests)
- Status: `403` from API

**❌ If storm in strict mode:**
- Check: Grid refresh logic should skip refresh when `orgId === null` in strict mode
- Check: `entity-grid.tsx` useEffect guard

### Step 5: Verify Rate Limiter Bypass

1. Set `DISABLE_RATE_LIMIT=true`
2. **Restart dev server**
3. Make multiple rapid requests to `/api/v1/entity/projects`

**✅ Expected:**
- All requests return `200` (no 429)
- No `x-ratelimit-*` headers

**❌ If still getting 429:**
- Check: `lib/middleware/edge/rate-limit.ts` bypass logic
- Check: Is `NODE_ENV=development`?
- Check: Another rate limiter might be active (middleware, WAF, etc.)

## Troubleshooting

### API Returns 403 in Relaxed Mode

**Root cause:** Auth mode not being read or not enabled

**Check:**
1. `NEXT_PUBLIC_AUTH_MODE=relaxed` in `.env.local`
2. `ALLOW_RELAXED_AUTH=true` in `.env.local` (required opt-in)
3. Dev server restarted after env change
4. Check server logs for: `[entity route] Relaxed auth mode enabled`

**Fix:**
- Ensure both env vars are set
- Restart dev server completely
- Check `lib/shared/config/auth-mode.ts` logic

### API Returns 429 Despite DISABLE_RATE_LIMIT=true

**Root cause:** Rate limiter not bypassed or another limiter active

**Check:**
1. `DISABLE_RATE_LIMIT=true` in `.env.local`
2. `NODE_ENV=development` (bypass only works in dev, not test)
3. Response headers for `x-ratelimit-*` (indicates which limiter)
4. Server logs for rate limit warnings

**Fix:**
- Ensure `NODE_ENV=development` (not `test`)
- Check `lib/middleware/edge/rate-limit.ts` bypass condition
- Check for other rate limiters (middleware, WAF, etc.)

### Grid Empty But API Returns 200

**Root cause:** Data mapping issue between API and grid

**Check:**
1. API response shape: `{ data: { data: [...], total: N } }`
2. Fetcher mapping in `fetchers.ts`: `{ rows: dataArray, totalSearchCount: total }`
3. Column definitions match row object keys
4. Browser console for AG Grid errors

**Fix:**
- Verify column `field` names match API response keys
- Check `toColDef()` adapter mapping
- Verify `fetchers.ts` response parsing

### Request Storm (Repeated API Calls)

**Root cause:** Grid datasource refresh loop

**Check:**
1. Network tab: Are requests identical?
2. Timing: Immediate (loop) or every few seconds (retry)?
3. `entity-grid.tsx` useEffect dependencies
4. `lastOrgIdRef` guard logic

**Fix:**
- Ensure `lastOrgIdRef` prevents refresh when `orgId` unchanged
- Check useEffect dependencies (should include `isRelaxed`)
- Verify refresh only happens on actual orgId change (not null → null)

## Go/No-Go Decision

**✅ Go (merge P0) if ALL are true:**
- ✅ Relaxed mode returns `200` for `/api/v1/entity/projects`
- ✅ Grid shows rows (mock JSON data visible)
- ✅ Network tab shows no storm (1-2 requests max)
- ✅ Strict mode shows correct message without hammering
- ✅ Rate limiter bypass works in dev

**⛔ No-Go if ANY are true:**
- ❌ `429` still appears after `DISABLE_RATE_LIMIT=true` + relaxed mode
- ❌ `/api/v1/entity/projects` still `403` in relaxed mode (flag not read)
- ❌ Request storm persists (repeated identical requests)
- ❌ Grid empty despite `200` API response (mapping issue)

## Production Safety

**Guard Rails:**
1. `ALLOW_RELAXED_AUTH=true` required to enable relaxed mode (prevents accidental enable)
2. Warning logged in production if relaxed mode enabled
3. Defaults to `strict` if not set

**Never ship relaxed mode to production without:**
- Explicit approval
- Understanding security implications
- Proper tenant scoping (if using real DB)

