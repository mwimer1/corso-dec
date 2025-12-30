---
title: "Qa"
description: "Documentation and resources for documentation functionality. Located in qa/."
last_updated: "2025-12-30"
category: "documentation"
status: "draft"
---
# P0 Hardening Verification Steps

> **DEPRECATED:** This checklist is retained for historical context. Use [Manual Verification Guide](./manual-verification-guide.md) instead for current verification procedures.

## ✅ Step 1: Code Status
**Status: COMPLETE**
- Code is committed on `main` branch
- Latest commit: `fd3fd8a` - "refactor(dashboard): update entity grid and API route implementation"
- Schema validator correctly handles ColGroupDef (uses `'field' in colDef` check)

## 🔍 Step 2: Manual Verification URLs

### Prerequisites
```bash
# Ensure dev server is running
pnpm dev

# Ensure .env.local has:
NEXT_PUBLIC_AUTH_MODE=relaxed
ALLOW_RELAXED_AUTH=true
CORSO_USE_MOCK_DB=true
DISABLE_RATE_LIMIT=true
```

### Test 2.1: Invalid sortBy should not break
**URL:**
```
http://localhost:3000/api/v1/entity/projects?page=0&pageSize=50&sortBy=not_a_field&sortDir=desc
```

**Expected:**
- ✅ HTTP 200 status
- ✅ Response contains `{ data: [...], total: N }`
- ✅ Dev warning in server console: `[entity route] Invalid sortBy field "not_a_field" for entity "projects"...`
- ✅ Sort is ignored (uses default sort)

---

### Test 2.2: Invalid filter field should be dropped
**URL:**
```
http://localhost:3000/api/v1/entity/projects?page=0&pageSize=50&filters=[{"field":"not_a_field","op":"eq","value":"x"}]
```

**Note:** URL encode the filters parameter if testing in browser:
```
http://localhost:3000/api/v1/entity/projects?page=0&pageSize=50&filters=%5B%7B%22field%22%3A%22not_a_field%22%2C%22op%22%3A%22eq%22%2C%22value%22%3A%22x%22%7D%5D
```

**Expected:**
- ✅ HTTP 200 status
- ✅ Response contains data (invalid filter is dropped)
- ✅ Dev warning in server console: `[entity route] Invalid filter fields for entity "projects": not_a_field...`

---

### Test 2.3: Invalid filters format should return 400
**URL:**
```
http://localhost:3000/api/v1/entity/projects?page=0&pageSize=50&filters={"bad":"format"}
```

**URL encoded:**
```
http://localhost:3000/api/v1/entity/projects?page=0&pageSize=50&filters=%7B%22bad%22%3A%22format%22%7D
```

**Expected:**
- ✅ HTTP 400 status
- ✅ Response contains `{ success: false, error: { code: "INVALID_FILTERS", ... } }`

---

## 🔍 Step 3: Schema Warning Verification

1. **Temporarily edit a colDef field:**
   ```typescript
   // In components/dashboard/entities/projects/config.ts (or any entity config)
   // Find a column accessor and temporarily change it to something fake
   // Example: Change 'effective_date' to 'fake_field_that_does_not_exist'
   ```

2. **Reload `/dashboard/projects`**

3. **Check browser console:**
   - ✅ Should see ONE warning: `⚠️ [projects] Schema mismatch detected: Column fields not found in row data`
   - ✅ Warning includes missing fields list
   - ✅ Grid still loads rows (validation is non-blocking)

4. **Revert the temporary change**

---

## 🔍 Step 4: Request Storm Sanity Check

1. Open `/dashboard/projects` in browser
2. Open DevTools → Network tab → Filter: Fetch/XHR
3. Reload the page
4. **Expected:**
   - ✅ 1-2 requests to `/api/v1/entity/projects`
   - ✅ Requests stop after initial load
   - ✅ No repeated/infinite requests

---

## 📋 Step 5: Commit/PR Status

**Status: Already committed to main**

If you need to create a PR from a feature branch instead, use:

```bash
# Create feature branch
git checkout -b fix/entity-schema-whitelist

# Cherry-pick or re-apply changes
# Then create PR with title:
# "fix(entity): schema dev warnings + whitelist sort/filter fields"
```

---

## ✅ Verification Checklist

- [x] Code committed to main
- [ ] Invalid sortBy returns 200 + warning
- [ ] Invalid filter field returns 200 + warning (field dropped)
- [ ] Invalid filters format returns 400
- [ ] Schema warning appears once in dev when field mismatch exists
- [ ] Grid still loads with schema warning (non-blocking)
- [ ] No request storm (1-2 requests max on page load)
- [ ] ColGroupDef safely skipped (no false warnings)

---

## 🐛 Edge Cases Verified

1. **ColGroupDef handling:** ✅ Uses `'field' in colDef` check
2. **Duplicate config loads:** ✅ Optimized with conditional loading and `Promise.all` when both sortBy and filters present
3. **Logging noise:** ✅ Only logs in dev mode (`NODE_ENV !== 'production'`)
4. **Validator false positives:** ✅ Only validates ColDef with `field` property (skips ColGroupDef)
