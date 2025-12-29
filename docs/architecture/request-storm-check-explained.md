---
status: "active"
last_updated: "2025-12-29"
category: "documentation"
title: "Architecture"
description: "Documentation and resources for documentation functionality. Located in architecture/."
---
# Request Storm Check - Explained

## What is a "Request Storm"?

A "request storm" is when the grid makes **too many API requests** (like 10, 20, 50+ requests) instead of just 1-2 requests when the page loads.

This can happen if:
- The datasource keeps getting recreated
- There's an infinite loop in the data fetching logic
- Error handling causes retries that loop forever
- State changes trigger repeated refreshes

## What We're Checking

We want to verify that when you load `/dashboard/projects`, the grid makes **only 1-2 API requests** and then **stops** - no infinite loops.

## How to Check

### Step 1: Open the Dashboard
1. Navigate to: `http://localhost:3000/dashboard/projects`
2. Make sure the page fully loads (grid shows data)

### Step 2: Open DevTools Network Tab
1. Press `F12` (or right-click → Inspect)
2. Click the **Network** tab
3. Filter by **Fetch/XHR** (to see only API calls, not images/CSS)

### Step 3: Clear and Reload
1. Click the **Clear** button (trash icon) to clear the network log
2. Press `F5` or `Cmd+R` to reload the page
3. Watch the Network tab

### Step 4: Count the Requests
Look for requests to: `/api/v1/entity/projects`

**Good (Pass):**
- You see **1-2 requests** total
- They happen when the page loads
- Then **nothing else** - requests stop

**Bad (Fail - Request Storm):**
- You see **5+ requests**
- Requests keep coming even after page loads
- Requests appear repeatedly/infinitely

## What This Test Proves

This verifies that:
- ✅ The datasource is created once (not recreated in a loop)
- ✅ Error handling doesn't cause infinite retries
- ✅ State changes don't trigger unnecessary refreshes
- ✅ The retry cooldown (2 seconds) prevents rapid retries

---

## About Column Ordering

The column ordering functionality is **separate** from the request storm check. If you can't reorder columns, that might be:
- A UI/UX issue (columns might be locked)
- An AG Grid configuration issue
- A different feature that needs to be implemented

The request storm check is **only** about verifying API requests don't loop infinitely.

