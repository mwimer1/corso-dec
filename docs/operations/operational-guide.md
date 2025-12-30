---
title: Operations
description: >-
  Documentation and resources for documentation functionality. Located in
  operations/.
last_updated: '2025-12-30'
category: documentation
status: stable
---
# Operational Guide

> **Complete guide to deployment, monitoring, troubleshooting, and day-to-day operations of the Corso platform.**

## 📋 Quick Reference

**Key Operational Commands:**
```bash
# Health checks
curl https://your-domain.com/api/health
curl https://your-domain.com/api/health/clickhouse

# View logs (Vercel)
vercel logs

# Check environment
pnpm validate:env

# Run quality gates
pnpm quality:local
```

## 🚀 Deployment

### Deployment Platforms

**Primary Platform**: Vercel (Next.js optimized)
- Automatic deployments from `main` branch
- Preview deployments for pull requests
- Edge network for global distribution

### Pre-Deployment Checklist

- [ ] All tests pass (`pnpm test`)
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Bundle size within limits (`pnpm bundlesize`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Security headers verified
- [ ] OpenAPI spec updated (`pnpm openapi:gen`)

### Environment Variables

**Required for Production:**
- `CLERK_SECRET_KEY` - Clerk authentication
- `CLERK_PUBLISHABLE_KEY` - Clerk public key
- `DATABASE_URL` - Supabase connection string
- `CLICKHOUSE_URL` - ClickHouse connection
- `OPENAI_API_KEY` - AI features (if enabled)
- `NEXT_PUBLIC_SITE_URL` - Public site URL

**See `.env.example` for complete list**

### Deployment Process

1. **Merge to Main**: Code merged to `main` triggers automatic deployment
2. **Build**: Next.js build runs with production optimizations
3. **Quality Gates**: CI runs all quality checks
4. **Deploy**: Vercel deploys to production
5. **Health Check**: Automated health checks verify deployment

### Rollback Procedure

```bash
# Vercel rollback
vercel rollback [deployment-url]

# Or via Vercel dashboard
# Deployments → Select deployment → Rollback
```

## 📊 Monitoring & Health Checks

### Health Endpoints

**Primary Health Check**
```bash
GET /api/health
```
- **Purpose**: Basic application health
- **Runtime**: Edge (fast response)
- **Response**: `{ status: "ok", timestamp: "..." }`

**Database Health Check**
```bash
GET /api/health/clickhouse
```
- **Purpose**: ClickHouse connectivity
- **Runtime**: Node.js
- **Response**: `{ status: "ok", database: "connected" }` or error

### Monitoring Metrics

**Key Metrics to Monitor:**
- **Response Times**: API endpoint latency (p50, p95, p99)
- **Error Rates**: 4xx and 5xx error percentages
- **Database Performance**: Query execution times
- **Bundle Size**: JavaScript bundle sizes
- **Core Web Vitals**: LCP, FID, CLS

### Logging

**Structured Logging**
- All logs use structured format
- Log levels: `error`, `warn`, `info`, `debug`
- Sensitive data automatically masked

**Accessing Logs**
```bash
# Vercel logs
vercel logs [deployment-url]

# Local development
# Logs appear in terminal where `pnpm dev` is running
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Authentication Failures

**Symptoms**: 401 errors on protected routes

**Diagnosis**:
```bash
# Check Clerk configuration
echo $CLERK_SECRET_KEY
echo $CLERK_PUBLISHABLE_KEY

# Verify middleware configuration
cat middleware.ts
```

**Solutions**:
- Verify Clerk keys are set correctly
- Check middleware public routes configuration
- Verify session token validity

#### 2. Database Connection Issues

**Symptoms**: 500 errors, timeout errors

**Diagnosis**:
```bash
# Test ClickHouse connection
curl https://your-domain.com/api/health/clickhouse

# Check connection string
echo $CLICKHOUSE_URL
```

**Solutions**:
- Verify `CLICKHOUSE_URL` is correct
- Check network connectivity
- Verify database credentials
- Check connection pool limits

#### 3. Bundle Size Exceeded

**Symptoms**: Build fails with bundle size errors

**Diagnosis**:
```bash
# Analyze bundle size
pnpm bundlesize

# Visual analysis
ANALYZE=true pnpm build
```

**Solutions**:
- Use dynamic imports for large components
- Remove unused dependencies
- Optimize images
- Split code by route

#### 4. Rate Limiting Issues

**Symptoms**: 429 errors on API endpoints

**Diagnosis**:
- Check rate limit configuration in route handlers
- Review rate limit headers in responses
- Check for rate limit bypass attempts

**Solutions**:
- Adjust rate limits if legitimate traffic
- Implement exponential backoff in clients
- Review rate limit key strategy

### Debugging Production Issues

**Enable Source Maps**
```typescript
// next.config.mjs
productionBrowserSourceMaps: true,
experimental: {
  serverSourceMaps: true,
}
```

**Error Tracking**
- Check Vercel error logs
- Review structured logging output
- Check database error logs

## 🔐 Security Operations

### Security Monitoring

**Key Security Checks:**
- Authentication failures (excessive 401s)
- Authorization failures (excessive 403s)
- Rate limit violations
- SQL injection attempts
- Unusual traffic patterns

### Incident Response

**Security Incident Procedure:**
1. **Identify**: Review logs and error patterns
2. **Contain**: Block malicious IPs if needed
3. **Assess**: Determine scope and impact
4. **Remediate**: Fix vulnerabilities
5. **Document**: Record incident and resolution

### Security Headers Verification

```bash
# Check security headers
curl -I https://your-domain.com/

# Expected headers:
# - Strict-Transport-Security
# - X-Frame-Options
# - X-Content-Type-Options
# - X-XSS-Protection
# - Referrer-Policy
# - Permissions-Policy
```

## 📈 Performance Monitoring

### Core Web Vitals

**Targets:**
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

**Monitoring:**
- Lighthouse CI runs on every PR
- Real User Monitoring (RUM) via analytics
- Synthetic monitoring via health checks

### Database Performance

**Query Performance:**
- Monitor query execution times
- Track slow queries (> 100ms)
- Review connection pool usage
- Optimize frequently accessed queries

**Performance Metrics:**
- Query execution time (p50, p95, p99)
- Connection pool utilization
- Query cache hit rate
- Database connection errors

## 🔄 Maintenance Procedures

### Regular Maintenance Tasks

**Weekly:**
- Review error logs
- Check bundle size trends
- Review security alerts
- Verify backup procedures

**Monthly:**
- Dependency updates
- Security patches
- Performance optimization review
- Documentation updates

**Quarterly:**
- Full security audit
- Performance optimization pass
- Dependency audit
- Architecture review

### Database Maintenance

**ClickHouse:**
- Monitor disk usage
- Review query performance
- Optimize table structures
- Clean up old data (if applicable)

**Supabase:**
- Monitor connection pool
- Review query performance
- Check backup status
- Verify replication (if enabled)

## 🚨 Emergency Procedures

### Service Outage

1. **Assess**: Check health endpoints
2. **Identify**: Review logs and error patterns
3. **Contain**: Isolate affected services
4. **Communicate**: Notify stakeholders
5. **Resolve**: Fix root cause
6. **Verify**: Confirm service restoration
7. **Document**: Record incident details

### Data Loss Prevention

**Backup Strategy:**
- Automated database backups
- Version control for code
- Environment variable backups
- Configuration backups

**Recovery Procedures:**
- Database restore from backups
- Code rollback via Git
- Environment variable restoration
- Configuration restoration

## 📚 Related Documentation

- [Monitoring Guide](../monitoring/monitoring-guide.md) - Health checks, metrics, and observability
- [Performance Optimization Guide](../performance/performance-optimization-guide.md) - Performance monitoring and optimization
- [Production Readiness Checklist](../production/production-readiness-checklist.md) - Pre-deployment verification
- [Security Implementation](../security/security-implementation.md) - Security procedures and incident response
- [API Documentation](../../app/api/README.md) - API endpoints and health checks
- [Development Setup Guide](../development/setup-guide.md) - Development environment

## 🏷️ Tags

`#operations` `#deployment` `#monitoring` `#troubleshooting` `#incident-response` `#maintenance` `#production`

---

Last updated: 2025-01-15
