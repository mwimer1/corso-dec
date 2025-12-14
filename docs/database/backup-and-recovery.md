---
title: "Database"
description: ">-"
last_updated: "2025-12-14"
category: "documentation"
status: "draft"
---
# Backup & Recovery Strategy

> **Comprehensive guide for database backups, recovery procedures, and disaster recovery planning**

## 📋 Overview

This document outlines the comprehensive backup and recovery strategy for the Corso platform, covering Supabase (PostgreSQL), ClickHouse, and related infrastructure components.

## 🎯 Backup Strategy

### Backup Types

#### 1. Automated Backups (Production)

**Supabase Managed Backups:**
- **Frequency:** Daily automated backups
- **Retention:** 7 days (configurable via Supabase dashboard)
- **Storage:** Managed by Supabase infrastructure
- **Point-in-Time Recovery:** Available for Pro plans and above
- **Location:** Supabase-managed secure storage

**Backup Schedule:**
- Daily full backups at 02:00 UTC
- Continuous WAL (Write-Ahead Log) archiving for point-in-time recovery
- Automatic backup verification

**Access:**
- View backups via Supabase Dashboard → Database → Backups
- Restore via Supabase Dashboard or API
- Download backups via Supabase CLI (if enabled)

#### 2. Manual Backups

**Local Development:**
```bash
# Create full database dump
supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql

# Create schema-only dump
supabase db dump --schema-only > schema_$(date +%Y%m%d_%H%M%S).sql

# Create data-only dump
supabase db dump --data-only > data_$(date +%Y%m%d_%H%M%S).sql

# Create dump of specific tables
supabase db dump --table projects --table users > tables_$(date +%Y%m%d_%H%M%S).sql
```

**Production (via Supabase CLI):**
```bash
# Link to production project
supabase link --project-ref <project-id>

# Create backup
supabase db dump --linked > production_backup_$(date +%Y%m%d_%H%M%S).sql

# Create backup with compression
supabase db dump --linked | gzip > production_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Production (via psql):**
```bash
# Full database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Custom format (recommended for large databases)
pg_dump -Fc $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).dump

# Schema-only backup
pg_dump --schema-only $DATABASE_URL > schema_$(date +%Y%m%d_%H%M%S).sql

# Data-only backup
pg_dump --data-only $DATABASE_URL > data_$(date +%Y%m%d_%H%M%S).sql
```

#### 3. Migration-Based Backups

**Schema Version Control:**
- All schema changes are version-controlled in `supabase/migrations/`
- Migrations serve as schema backup and recovery mechanism
- Can recreate schema from scratch using migrations

**Migration Backup:**
```bash
# Backup migration files
tar -czf migrations_backup_$(date +%Y%m%d_%H%M%S).tar.gz supabase/migrations/

# Verify migration integrity
supabase db diff --linked
```

## 🔄 Recovery Procedures

### Full Database Restore

#### From Supabase Dashboard

1. **Navigate to Backups:**
   - Supabase Dashboard → Database → Backups
   - Select backup to restore

2. **Initiate Restore:**
   - Click "Restore" button
   - Confirm restore operation
   - Monitor restore progress

3. **Verify Restore:**
   - Check database connectivity
   - Verify critical tables and data
   - Run health checks

#### From SQL Dump

**Local Development:**
```bash
# Reset database
supabase db reset

# Restore from dump
psql -h localhost -p 55432 -U postgres -d postgres < backup.sql

# Or using Supabase CLI
supabase db reset
cat backup.sql | supabase db execute
```

**Production (via Supabase CLI):**
```bash
# Restore from dump (WARNING: This will overwrite production data)
supabase db reset --linked
psql $DATABASE_URL < backup.sql

# Restore from custom format
pg_restore -d $DATABASE_URL backup.dump
```

**Production (via psql):**
```bash
# Restore from SQL dump
psql $DATABASE_URL < backup.sql

# Restore from custom format
pg_restore -d $DATABASE_URL backup.dump

# Restore specific tables
pg_restore -d $DATABASE_URL -t projects -t users backup.dump
```

### Point-in-Time Recovery (PITR)

**Supabase Point-in-Time Recovery:**
- Available for Pro plans and above
- Restore to any point in time within retention period
- Uses WAL (Write-Ahead Log) archiving

**Procedure:**
1. Navigate to Supabase Dashboard → Database → Backups
2. Select "Point-in-Time Recovery"
3. Choose target timestamp
4. Initiate recovery
5. Verify recovered database

**Limitations:**
- Requires WAL archiving enabled
- Limited by retention period
- May require additional storage

### Partial Restore

#### Restore Specific Tables

```bash
# Restore specific tables from dump
pg_restore -d $DATABASE_URL -t projects -t users backup.dump

# Restore from SQL dump (extract specific tables)
grep -A 10000 "CREATE TABLE public.projects" backup.sql | psql $DATABASE_URL
```

#### Restore Specific Schema

```bash
# Restore specific schema
pg_restore -d $DATABASE_URL -n public backup.dump

# Restore from SQL dump (extract schema)
grep -A 50000 "CREATE SCHEMA public" backup.sql | psql $DATABASE_URL
```

### Schema-Only Recovery

**From Migrations:**
```bash
# Recreate schema from migrations
supabase db reset --linked

# Apply all migrations
supabase db push --linked
```

**From Schema Dump:**
```bash
# Restore schema only
psql $DATABASE_URL < schema_backup.sql
```

## 🚨 Disaster Recovery

### Disaster Recovery Plan

#### 1. Data Loss Scenario

**Immediate Actions:**
1. **Assess Impact:**
   - Identify affected tables/data
   - Determine data loss scope
   - Check last known good backup

2. **Stop Data Modifications:**
   - Pause write operations if possible
   - Prevent further data loss
   - Document current state

3. **Restore from Backup:**
   - Identify most recent valid backup
   - Restore to staging environment first
   - Verify data integrity
   - Restore to production

4. **Verify Recovery:**
   - Run data integrity checks
   - Verify critical business data
   - Test application functionality
   - Monitor for issues

#### 2. Database Corruption

**Symptoms:**
- Query errors
- Data inconsistencies
- Connection failures
- Checksum errors

**Recovery Steps:**
1. **Isolate Issue:**
   - Identify affected tables/schemas
   - Check database logs
   - Run integrity checks

2. **Restore Affected Components:**
   - Restore from backup
   - Rebuild indexes if needed
   - Verify data consistency

3. **Prevent Recurrence:**
   - Investigate root cause
   - Update monitoring
   - Improve backup frequency if needed

#### 3. Complete Database Failure

**Recovery Steps:**
1. **Assess Infrastructure:**
   - Check Supabase status
   - Verify network connectivity
   - Review error logs

2. **Restore from Backup:**
   - Use most recent full backup
   - Restore to new database instance if needed
   - Update connection strings

3. **Recreate Infrastructure:**
   - Apply all migrations
   - Restore data from backup
   - Verify all components

4. **Post-Recovery:**
   - Run comprehensive tests
   - Monitor for issues
   - Document incident

### Recovery Time Objectives (RTO) & Recovery Point Objectives (RPO)

**Current Targets:**
- **RTO (Recovery Time Objective):** 4 hours
  - Time to restore service after disaster
  - Includes backup restoration and verification

- **RPO (Recovery Point Objective):** 24 hours
  - Maximum acceptable data loss
  - Based on daily backup frequency

**Improvement Opportunities:**
- Increase backup frequency for critical data
- Implement continuous replication for zero RPO
- Reduce RTO with automated recovery procedures

## 📊 Backup Verification

### Backup Integrity Checks

**Verify Backup File:**
```bash
# Check SQL dump integrity
head -n 100 backup.sql | grep -q "PostgreSQL database dump" && echo "Valid dump" || echo "Invalid dump"

# Verify custom format dump
pg_restore --list backup.dump > /dev/null && echo "Valid dump" || echo "Invalid dump"

# Check backup size (should be reasonable)
ls -lh backup.sql
```

**Test Restore:**
```bash
# Create test database
createdb test_restore

# Restore to test database
psql test_restore < backup.sql

# Verify restore
psql test_restore -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Cleanup
dropdb test_restore
```

### Automated Backup Verification

**Recommended Checks:**
- Verify backup file exists and is non-empty
- Check backup file size (should be > 0)
- Verify backup timestamp (should be recent)
- Test restore to staging environment
- Verify critical tables exist after restore

## 🔐 Backup Security

### Backup Storage

**Security Requirements:**
- Encrypt backups at rest
- Secure backup storage location
- Limit access to backup files
- Rotate backup encryption keys
- Audit backup access

**Storage Locations:**
- **Production:** Supabase-managed secure storage
- **Local:** Encrypted local storage (if storing locally)
- **Offsite:** Secure cloud storage (if required)

### Backup Access Control

**Access Policies:**
- Only authorized personnel can access backups
- Use least-privilege access model
- Log all backup access
- Require multi-factor authentication for backup operations

## 📅 Backup Retention Policy

### Retention Schedule

| Backup Type | Retention Period | Rationale |
|-------------|------------------|-----------|
| Daily Backups | 7 days | Cover weekly recovery needs |
| Weekly Backups | 4 weeks | Monthly recovery point |
| Monthly Backups | 12 months | Long-term recovery and compliance |
| Point-in-Time Recovery | 7 days | Recent point-in-time recovery |

### Backup Cleanup

**Automated Cleanup:**
- Supabase manages automated backup retention
- Old backups automatically deleted per retention policy
- Manual backups should be cleaned up periodically

**Manual Cleanup:**
```bash
# List old backups
ls -lt backup_*.sql | tail -n +8

# Remove backups older than 7 days
find . -name "backup_*.sql" -mtime +7 -delete
```

## 🔧 ClickHouse Backup Considerations

### ClickHouse Backup Strategy

**Current Status:**
- ClickHouse backups are managed separately
- No automated backup system currently configured
- Manual backup procedures recommended

**Recommended Approach:**
```bash
# Backup ClickHouse data
clickhouse-client --query "BACKUP DATABASE default TO Disk('backups', 'backup_$(date +%Y%m%d_%H%M%S)')"

# Restore from backup
clickhouse-client --query "RESTORE DATABASE default FROM Disk('backups', 'backup_20251214_120000')"
```

**Backup Frequency:**
- Daily backups for production ClickHouse
- Weekly backups for development/staging
- Retention: 30 days for production, 7 days for development

## 🔄 Environment & Configuration Backups

### Environment Variables

**Backup Procedure:**
```bash
# Export environment variables (without secrets)
env | grep -E "^[A-Z_]+=" > env_backup_$(date +%Y%m%d_%H%M%S).txt

# Backup from Vercel
vercel env pull .env.backup

# Backup from Supabase
supabase secrets list --linked > secrets_backup_$(date +%Y%m%d_%H%M%S).txt
```

**Security Note:**
- Never commit secrets to version control
- Use secure secret management (Vercel, Supabase Secrets)
- Rotate secrets regularly

### Configuration Files

**Backup Configuration:**
```bash
# Backup Supabase config
cp supabase/config.toml supabase/config.toml.backup

# Backup package.json
cp package.json package.json.backup

# Backup all config files
tar -czf config_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  supabase/config.toml \
  package.json \
  tsconfig.json \
  .env.example
```

## 📝 Backup Procedures Checklist

### Daily Backup Verification

- [ ] Verify automated backup completed successfully
- [ ] Check backup file size and timestamp
- [ ] Verify backup is accessible
- [ ] Review backup logs for errors

### Weekly Backup Review

- [ ] Review backup retention policy
- [ ] Verify backup restoration procedure
- [ ] Test restore to staging environment
- [ ] Review backup storage usage
- [ ] Update backup documentation if needed

### Monthly Backup Audit

- [ ] Review all backup procedures
- [ ] Verify backup security measures
- [ ] Test disaster recovery procedures
- [ ] Review and update RTO/RPO targets
- [ ] Document any changes to backup strategy

## 🔗 Related Documentation

- [Supabase Database Configuration](../supabase/README.md) - Database setup and migrations
- [Materialized View Refresh Strategy](./materialized-view-refresh-strategy.md) - MV refresh procedures
- [Operational Guide](../operations/operational-guide.md) - Day-to-day operations
- [Security Implementation](../security/security-implementation.md) - Security procedures

## 📞 Emergency Contacts

**Database Issues:**
- Supabase Support: [Supabase Dashboard](https://app.supabase.com)
- Emergency Escalation: [Contact DevOps Team]

**Backup Issues:**
- Backup Administrator: [Contact Backup Admin]
- Infrastructure Team: [Contact Infrastructure Team]

## 🚀 Quick Reference

### Backup Commands

```bash
# Local backup
supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql

# Production backup
supabase db dump --linked > production_backup_$(date +%Y%m%d_%H%M%S).sql

# Schema-only backup
supabase db dump --schema-only > schema_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Commands

```bash
# Local restore
supabase db reset
psql -h localhost -p 55432 -U postgres -d postgres < backup.sql

# Production restore (WARNING: Overwrites data)
supabase db reset --linked
psql $DATABASE_URL < backup.sql
```

### Verification Commands

```bash
# Verify backup
head -n 100 backup.sql | grep -q "PostgreSQL database dump" && echo "Valid"

# Test restore
createdb test_restore && psql test_restore < backup.sql && dropdb test_restore
```
