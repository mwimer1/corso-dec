# Quick verification script for P0 hardening tests
# Run this after server is ready: pnpm dev

Write-Host "=== P0 Hardening Verification Tests ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test 1: Invalid sortBy (should return 200)
Write-Host "Test 2.1: Invalid sortBy field" -ForegroundColor Yellow
$url1 = "$baseUrl/api/v1/entity/projects?page=0&pageSize=50&sortBy=not_a_field&sortDir=desc"
Write-Host "URL: $url1"
Write-Host "Expected: 200 OK with data"
Write-Host ""
Write-Host "⚠️  Note: This test requires authentication. Open in browser while signed in."
Write-Host ""
Write-Host "Copy this URL to test in browser:"
Write-Host $url1 -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter to continue to next test..."
Read-Host

# Test 2: Invalid filter field (should return 200, field dropped)
Write-Host "Test 2.2: Invalid filter field" -ForegroundColor Yellow
$url2 = "$baseUrl/api/v1/entity/projects?page=0&pageSize=50&filters=%5B%7B%22field%22%3A%22not_a_field%22%2C%22op%22%3A%22eq%22%2C%22value%22%3A%22x%22%7D%5D"
Write-Host "URL: $url2"
Write-Host "Expected: 200 OK with data (invalid filter dropped)"
Write-Host ""
Write-Host "⚠️  Note: This test requires authentication. Open in browser while signed in."
Write-Host ""
Write-Host "Copy this URL to test in browser:"
Write-Host $url2 -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter to continue to next test..."
Read-Host

# Test 3: Invalid filters format (should return 400)
Write-Host "Test 2.3: Invalid filters format" -ForegroundColor Yellow
$url3 = "$baseUrl/api/v1/entity/projects?page=0&pageSize=50&filters=%7B%22bad%22%3A%22format%22%7D"
Write-Host "URL: $url3"
Write-Host "Expected: 400 Bad Request with INVALID_FILTERS error"
Write-Host ""
Write-Host "⚠️  Note: This test requires authentication. Open in browser while signed in."
Write-Host ""
Write-Host "Copy this URL to test in browser:"
Write-Host $url3 -ForegroundColor Green
Write-Host ""
Write-Host "=== All Test URLs Generated ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Ensure you're signed in at http://localhost:3000"
Write-Host "2. Open each URL above in browser"
Write-Host "3. Check Network tab in DevTools for status codes"
Write-Host "4. Check server terminal for warnings (Tests 2.1 & 2.2)"
Write-Host "5. Check browser console for schema warnings (Test 3 in verification guide)"

