# Git LFS Files - Remaining Files to Add

This document lists the remaining files that need to be added (23 files remaining).

## ✅ Database CSV Files (3 files) - COMPLETED
1. ✅ `db/addresses.csv` - Added
2. ✅ `db/companies.csv` - Added
3. ✅ `db/projects.csv` - Added

## 📸 Image Files (5 files) - NEXT TO ADD
4. `public/demos/addresses-interface.png`
   - **Download Link**: https://github.com/Corso222/corso-mvp/blob/main/public/demos/addresses-interface.png
   - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/public/demos/addresses-interface.png

5. `public/demos/companies-interface.png`
   - **Download Link**: https://github.com/Corso222/corso-mvp/blob/main/public/demos/companies-interface.png
   - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/public/demos/companies-interface.png

6. `public/demos/corso-ai-interface.png`
   - **Download Link**: https://github.com/Corso222/corso-mvp/blob/main/public/demos/corso-ai-interface.png
   - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/public/demos/corso-ai-interface.png

7. `public/demos/projects-interface.png`
   - **Download Link**: https://github.com/Corso222/corso-mvp/blob/main/public/demos/projects-interface.png
   - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/public/demos/projects-interface.png

8. `public/insights/insights-construction-trends.png`
   - **Download Link**: https://github.com/Corso222/corso-mvp/blob/main/public/insights/insights-construction-trends.png
   - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/public/insights/insights-construction-trends.png

## 📄 Supabase Migration SQL Files (18 files) - REMAINING
9. `supabase/migrations/20240101000000_add_chat_messages_table.sql`
   - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/supabase/migrations/20240101000000_add_chat_messages_table.sql

10. `supabase/migrations/20240429000000_create_saved_tables.sql`
    - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/supabase/migrations/20240429000000_create_saved_tables.sql

11. `supabase/migrations/20250115000000_add_checkout_sessions_table.sql`
    - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/supabase/migrations/20250115000000_add_checkout_sessions_table.sql

12. `supabase/migrations/20250129000000_create_saved_searches_table.sql`
    - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/supabase/migrations/20250129000000_create_saved_searches_table.sql

13. `supabase/migrations/20250501231031_add_saved_views_table.sql`
    - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/supabase/migrations/20250501231031_add_saved_views_table.sql

14. `supabase/migrations/20250502061640_add_saved_views_and_watchlists.sql`
    - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/supabase/migrations/20250502061640_add_saved_views_and_watchlists.sql

15. `supabase/migrations/20250503000000_add_rls_user_payment_api_keys.sql`
    - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/supabase/migrations/20250503000000_add_rls_user_payment_api_keys.sql

16. `supabase/migrations/20250612000100_create_set_rls_context_function.sql`
    - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/supabase/migrations/20250612000100_create_set_rls_context_function.sql

17. `supabase/migrations/20250613000100_add_clerk_webhook_events_table.sql`
    - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/supabase/migrations/20250613000100_add_clerk_webhook_events_table.sql

18. `supabase/migrations/202506141600_dev_metrics.sql`
    - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/supabase/migrations/202506141600_dev_metrics.sql

19. `supabase/migrations/20250615000001_enable_rls_all_remaining.sql`
    - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/supabase/migrations/20250615000001_enable_rls_all_remaining.sql

20. `supabase/migrations/20250615000002_idx_projects.sql`
    - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/supabase/migrations/20250615000002_idx_projects.sql

21. `supabase/migrations/20250615000003_audit_log.sql`
    - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/supabase/migrations/20250615000003_audit_log.sql

22. `supabase/migrations/20250616000000_enable_rls_org_isolation.sql`
    - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/supabase/migrations/20250616000000_enable_rls_org_isolation.sql

23. `supabase/migrations/20250813120000_add_missing_tenant_indexes.sql`
    - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/supabase/migrations/20250813120000_add_missing_tenant_indexes.sql

24. `supabase/migrations/20250813121000_mv_projects_daily_counts.sql`
    - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/supabase/migrations/20250813121000_mv_projects_daily_counts.sql

25. `supabase/migrations/20250814090000_presence_v2.sql`
    - **Raw Link**: https://raw.githubusercontent.com/Corso222/corso-mvp/main/supabase/migrations/20250814090000_presence_v2.sql

## Summary
- **Total Files**: 26
- **✅ CSV Files**: 3 (COMPLETED)
- **📸 PNG Files**: 5 (REMAINING)
- **📄 SQL Files**: 18 (REMAINING)
- **Remaining**: 23 files

## How to Add These Files Manually

### Option 1: Download from Old Repository
1. Go to: https://github.com/Corso222/corso-mvp
2. Navigate to each file path above
3. Click "Raw" or "Download" button
4. Save to the corresponding path in your local repository
5. Add and commit:
   ```bash
   git add <file-path>
   git commit -m "Add LFS file: <filename>"
   git push
   ```

### Option 2: Re-enable LFS Tracking (After Adding Budget)
If you add LFS budget to the new repository and want to track these files in LFS again:

```bash
# Re-enable LFS tracking
git lfs track "*.csv"
git lfs track "*.sql"
git lfs track "*.png"

# Add the files
git add .gitattributes
git add db/*.csv
git add supabase/migrations/*.sql
git add public/demos/*.png
git add public/insights/*.png

# Commit and push
git commit -m "Re-add LFS files"
git push
```

### Option 3: Add as Regular Files (No LFS)
If you don't want to use LFS (these files are small enough):

```bash
# Just add them as regular files (LFS tracking already removed)
git add db/*.csv
git add supabase/migrations/*.sql
git add public/demos/*.png
git add public/insights/*.png

git commit -m "Add database and migration files"
git push
```

