---
status: "draft"
last_updated: "2026-01-03"
category: "documentation"
title: "Qa"
description: "Documentation and resources for documentation functionality. Located in qa/."
---
# Manual Verification Guide - P0 Hardening

## ✅ Step 1: Environment Verification

**Status:** All required settings confirmed in `.env.local`:
- ✅ `NEXT_PUBLIC_AUTH_MODE=relaxed`
- ✅ `ALLOW_RELAXED_AUTH=true`
- ✅ `CORSO_USE_MOCK_DB=true`
- ✅ `DISABLE_RATE_LIMIT=true`

**Dev Server:** Starting... (check terminal output for "Ready" message)

---

## 🔍 Step 2: API Verification Tests

**Important:** Make sure you're **signed in** before testing these URLs. The API requires authentication (userId), but org is optional in relaxed mode.

### Test 2.1: Invalid sortBy should not break (200 OK)

**Browser URL (copy-paste ready):**
```
http://localhost:3000/api/v1/entity/projects?page=0&pageSize=50&sortBy=not_a_field&sortDir=desc
```

**Expected Results:**
- ✅ HTTP Status: **200 OK**
- ✅ Response body contains: `{ "data": [...], "total": N, "page": 0, "pageSize": 50 }`
- ✅ Server console shows warning: `[entity route] Invalid sortBy field "not_a_field" for entity "projects"...`
- ✅ Sort is ignored (uses default sort, data still returns)

**What to check:**
1. Open URL in browser (must be signed in)
2. Check browser DevTools → Network tab → Status should be 200
3. Check Response → Should have data array
4. Check server terminal → Should see warning message

---

### Test 2.2: Invalid filter field should be dropped (200 OK)

**Browser URL (URL-encoded, copy-paste ready):**
```
http://localhost:3000/api/v1/entity/projects?page=0&pageSize=50&filters=%5B%7B%22field%22%3A%22not_a_field%22%2C%22op%22%3A%22eq%22%2C%22value%22%3A%22x%22%7D%5D
```

**Decoded filters parameter:** `[{"field":"not_a_field","op":"eq","value":"x"}]`

**Expected Results:**
- ✅ HTTP Status: **200 OK**
- ✅ Response body contains data (invalid filter is silently dropped)
- ✅ Server console shows warning: `[entity route] Invalid filter fields for entity "projects": not_a_field...`

**What to check:**
1. Open URL in browser (must be signed in)
2. Check browser DevTools → Network tab → Status should be 200
3. Check Response → Should have data array (filter was dropped)
4. Check server terminal → Should see warning about invalid filter field

---

### Test 2.3: Invalid filters format should return 400

**Browser URL (URL-encoded, copy-paste ready):**
```
http://localhost:3000/api/v1/entity/projects?page=0&pageSize=50&filters=%7B%22bad%22%3A%22format%22%7D
```

**Decoded filters parameter:** `{"bad":"format"}` (invalid - not an array)

**Expected Results:**
- ✅ HTTP Status: **400 Bad Request**
- ✅ Response body: `{ "success": false, "error": { "code": "INVALID_QUERY", "message": "Invalid query parameters" } }`

**What to check:**
1. Open URL in browser (must be signed in)
2. Check browser DevTools → Network tab → Status should be 400
3. Check Response → Should have error with code "INVALID_QUERY"
4. Server terminal → No warning needed (400 is expected)

---

## 🔍 Step 3: Schema Warning Verification (Dev-Only)

**This test temporarily modifies code - remember to revert!**

### 3.1 Temporarily break a column field

1. Open: `components/dashboard/entities/projects/config.ts`
2. Find the `defaultSortModel` (line 19) or any column in `PROJECTS_COLUMNS`
3. Temporarily change a field name to something fake, e.g.:
   ```typescript
   // BEFORE:
   defaultSortModel: [{ colId: 'effective_date', sort: 'desc' }],
   
   // TEMPORARY CHANGE:
   defaultSortModel: [{ colId: 'fake_field_that_does_not_exist', sort: 'desc' }],
   ```
   OR change a column accessor in `lib/entities/projects/columns.config.ts`:
   ```typescript
   // BEFORE:
   { id: 'effective_date', label: 'Date', accessor: 'effective_date', ... },
   
   // TEMPORARY CHANGE:
   { id: 'effective_date', label: 'Date', accessor: 'fake_field_that_does_not_exist', ... },
   ```

### 3.2 Reload and check console

1. Navigate to: `http://localhost:3000/dashboard/projects`
2. Open browser DevTools → Console tab
3. Reload the page

**Expected Results:**
- ✅ **ONE** console warning appears: `⚠️ [projects] Schema mismatch detected: Column fields not found in row data`
- ✅ Warning includes: missing fields list + sample row keys
- ✅ Grid still loads rows (validation is non-blocking)
- ✅ No duplicate warnings (validation runs once per datasource)

### 3.3 Revert the temporary change

1. Revert the change you made in step 3.1
2. Reload the page
3. Warning should disappear

---

## 🔍 Step 4: Request Storm Sanity Check

### 4.1 Test on dashboard page

1. Navigate to: `http://localhost:3000/dashboard/projects`
2. Open browser DevTools → **Network tab**
3. Filter by: **Fetch/XHR** (to see only API calls)
4. **Clear the network log** (trash icon)
5. **Reload the page** (F5 or Cmd+R)

**Expected Results:**
- ✅ **1-2 requests** to `/api/v1/entity/projects` total
- ✅ Requests stop after initial load (no infinite loop)
- ✅ No repeated/infinite requests in Network tab
- ✅ Grid renders successfully

**What to look for:**
- Count the number of `/api/v1/entity/projects` requests
- Verify they stop after page load
- If you see more than 2-3 requests, that might indicate a loop (investigate)

---

## 📋 Verification Checklist

Use this checklist to track your progress:

- [ ] **Step 2.1:** Invalid sortBy returns 200 + warning
- [ ] **Step 2.2:** Invalid filter field returns 200 + warning (field dropped)
- [ ] **Step 2.3:** Invalid filters format returns 400
- [ ] **Step 3:** Schema warning appears once when field mismatch exists
- [ ] **Step 3:** Grid still loads with schema warning (non-blocking)
- [ ] **Step 3:** Temporary change reverted
- [ ] **Step 4:** No request storm (1-2 requests max on page load)

---

## 🐛 If Tests Fail

If any test fails, collect this information:

1. **Failing URL:** (copy the exact URL you tested)
2. **HTTP Status Code:** (200, 400, 500, etc.)
3. **Response Body:** (copy the response JSON)
4. **Server Console Output:** (any warnings/errors from terminal)
5. **Network Tab:** (number of requests observed)

Then paste this information and I'll help debug.

---

## ✅ Next Steps After Verification

If all tests pass:
1. ✅ Implementation verified - proceed to next roadmap items
2. **Next PR:** Saved search persistence + results count polish
3. **Following PR:** Smoke tests (integration + E2E)
4. **Following PR:** Quickstart docs

---

## 📝 Quick Reference: All Test URLs

**Test 2.1 (Invalid sortBy):**
```
http://localhost:3000/api/v1/entity/projects?page=0&pageSize=50&sortBy=not_a_field&sortDir=desc
```

**Test 2.2 (Invalid filter field):**
```
http://localhost:3000/api/v1/entity/projects?page=0&pageSize=50&filters=%5B%7B%22field%22%3A%22not_a_field%22%2C%22op%22%3A%22eq%22%2C%22value%22%3A%22x%22%7D%5D
```

**Test 2.3 (Invalid filters format):**
```
http://localhost:3000/api/v1/entity/projects?page=0&pageSize=50&filters=%7B%22bad%22%3A%22format%22%7D
```

**Dashboard Page (Steps 3 & 4):**
```
http://localhost:3000/dashboard/projects
```
