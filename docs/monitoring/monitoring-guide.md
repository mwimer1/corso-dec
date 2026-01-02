---
title: "Monitoring"
description: "Documentation and resources for documentation functionality. Located in monitoring/."
last_updated: "2026-01-02"
category: "documentation"
status: "stable"
---
# Monitoring & Observability Guide

> **Complete guide to monitoring, health checks, metrics collection, and observability for the Corso platform**

## 📋 Quick Reference

**Key Commands:**
```bash
# Health checks
curl https://your-domain.com/api/health
curl https://your-domain.com/api/health/clickhouse

# View logs (Vercel)
vercel logs

# Check environment
pnpm validate:env
```

## 🎯 Monitoring Strategy

### Three Pillars of Observability

1. **Logs**: Structured logging for debugging and auditing
2. **Metrics**: Quantitative measurements of system behavior
3. **Traces**: Request flow through distributed systems

### Monitoring Layers

**Application Layer:**
- API response times
- Error rates
- Request throughput
- Business metrics

**Infrastructure Layer:**
- Server health
- Database connectivity
- Network latency
- Resource utilization

**User Experience Layer:**
- Core Web Vitals
- Page load times
- User interactions
- Error rates

## 🏥 Health Checks

### Primary Health Check

**Endpoint:** `GET /api/health`

**Purpose:** Basic application health verification

**Runtime:** Edge (fast response)

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2025-01-15T10:00:00.000Z",
    "uptime": null,
    "version": "1.0.0",
    "nodeVersion": null,
    "environment": "production",
    "platform": null,
    "arch": null
  }
}
```

**Edge Runtime Note:** This endpoint runs on Edge runtime for optimal performance. System information fields (`uptime`, `platform`, `arch`, `nodeVersion`) are not available in Edge runtime and will be `null`. The required fields (`status`, `timestamp`, `version`, `environment`) are always available and sufficient for health monitoring.

**Usage:**
```bash
# Basic health check
curl https://api.corso.app/api/health

# HEAD request (lightweight)
curl -I https://api.corso.app/api/health
```

**Monitoring:**
- Use for service availability monitoring
- Set up alerts for non-200 responses
- Monitor response times (< 100ms target)
- **Note:** `uptime` field is `null` in Edge runtime; use external monitoring tools for server uptime metrics

### Database Health Check

**Endpoint:** `GET /api/health/clickhouse`

**Purpose:** ClickHouse database connectivity verification

**Runtime:** Node.js (database operations)

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-15T10:00:00.000Z",
    "service": "clickhouse",
    "responseTime": "45ms"
  }
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": {
    "code": "CLICKHOUSE_UNHEALTHY",
    "message": "ClickHouse health check failed",
    "details": {
      "message": "Connection timeout",
      "responseTime": "5000ms",
      "timestamp": "2025-01-15T10:00:00.000Z"
    }
  }
}
```

**Usage:**
```bash
# Database health check
curl https://api.corso.app/api/health/clickhouse

# HEAD request
curl -I https://api.corso.app/api/health/clickhouse
```

**Monitoring:**
- Alert on 500 responses
- Monitor response times (< 200ms target)
- Track connection failures

### Health Check Best Practices

**Frequency:**
- Primary: Every 30 seconds
- Database: Every 60 seconds

**Alerting:**
- Alert after 2 consecutive failures
- Escalate after 5 consecutive failures
- Include response time in alerts

**Integration:**
- Load balancer health checks
- Uptime monitoring services
- CI/CD deployment verification

## 📊 Metrics Collection

### Structured Logging

**Logger Usage:**
```typescript
import { logger } from '@/lib/monitoring';

// Info logs
logger.info('Operation completed', {
  userId: 'user_123',
  operation: 'data-query',
  duration: 150,
});

// Warning logs
logger.warn('Rate limit approaching', {
  key: 'user_123',
  remaining: 5,
});

// Error logs
logger.error('Operation failed', {
  error: error.message,
  stack: error.stack,
  context: { userId: 'user_123' },
});
```

**Log Format:**
```json
{
  "timestamp": "2025-01-15T10:00:00.000Z",
  "level": "info",
  "msg": "[Component] Operation completed: data-query",
  "requestId": "req_123",
  "context": {
    "userId": "user_123",
    "duration": 150
  }
}
```

### Request Context

**Request ID Tracking:**
```typescript
import { runWithRequestContext } from '@/lib/monitoring';

export async function handler(req: NextRequest) {
  const requestId = getRequestId(req);
  
  return runWithRequestContext({ requestId }, async () => {
    // All logs within this context include requestId
    logger.info('Processing request');
    // ... handler logic
  });
}
```

**Benefits:**
- Trace requests across services
- Correlate logs with requests
- Debug distributed systems

### Performance Metrics

**Response Time Tracking:**
```typescript
export async function GET(req: NextRequest) {
  const startTime = performance.now();
  
  try {
    // Handler logic
    const result = await processRequest();
    
    const duration = Math.round(performance.now() - startTime);
    logger.info('Request completed', {
      duration: `${duration}ms`,
      endpoint: '/api/v1/example',
    });
    
    return http.ok(result);
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logger.error('Request failed', {
      duration: `${duration}ms`,
      error: error.message,
    });
    throw error;
  }
}
```

**Key Metrics:**
- Response time (p50, p95, p99)
- Request rate (requests/second)
- Error rate (errors/requests)
- Success rate (successful/requests)

### Business Metrics

**User Activity:**
```typescript
logger.info('User action', {
  userId: 'user_123',
  action: 'dashboard_view',
  entity: 'projects',
  timestamp: new Date().toISOString(),
});
```

**Feature Usage:**
```typescript
logger.info('Feature used', {
  userId: 'user_123',
  feature: 'ai_sql_generation',
  success: true,
  duration: 2500,
});
```

## 🔔 Alerting

### Alert Configuration

**Critical Alerts:**
- Service down (health check failures)
- Database connectivity issues
- High error rates (> 5%)
- Response time degradation (> 2s p95)

**Warning Alerts:**
- Elevated error rates (> 1%)
- Response time increase (> 1s p95)
- Rate limit approaching
- Resource utilization high

### Alert Channels

**Production Alerts:**
- Email notifications
- Slack/Teams integration
- PagerDuty (critical only)
- SMS (critical only)

**Development Alerts:**
- Console logs
- Development dashboard
- Local notifications

### Alert Best Practices

**Alert Fatigue Prevention:**
- Use appropriate severity levels
- Group related alerts
- Set reasonable thresholds
- Include context in alerts

**Alert Content:**
- Clear description
- Relevant metrics
- Suggested actions
- Links to dashboards

## 📈 Dashboards

### Key Dashboards

**System Health:**
- Health check status
- Uptime percentage
- Response times
- Error rates

**Performance:**
- API response times (p50, p95, p99)
- Request throughput
- Database query times
- Cache hit rates

**Business Metrics:**
- User activity
- Feature usage
- Conversion rates
- User engagement

### Dashboard Tools

**Recommended:**
- Vercel Analytics (built-in)
- Custom dashboards (Grafana, Datadog)
- Real-time monitoring (Vercel dashboard)

## 🔍 Logging Best Practices

### Log Levels

**Debug:** Development-only detailed information
```typescript
logger.debug('Detailed debug info', { data });
```

**Info:** General operational information
```typescript
logger.info('Operation completed', { duration: 150 });
```

**Warn:** Warning conditions
```typescript
logger.warn('Deprecated API used', { endpoint: '/old-api' });
```

**Error:** Error conditions
```typescript
logger.error('Operation failed', { error: error.message });
```

### Structured Data

**✅ CORRECT: Structured logging**
```typescript
logger.info('User action', {
  userId: 'user_123',
  action: 'dashboard_view',
  entity: 'projects',
  timestamp: new Date().toISOString(),
});
```

**❌ INCORRECT: String concatenation**
```typescript
logger.info(`User ${userId} viewed ${entity} dashboard`);
```

### Sensitive Data

**Never Log:**
- Passwords
- API keys
- Tokens
- Personal information (PII)
- Credit card numbers

**Masking:**
```typescript
logger.info('User login', {
  userId: 'user_123',
  email: maskEmail('user@example.com'), // user@***.com
  // Never log password
});
```

## 🛠️ Instrumentation

### Next.js Instrumentation

**File:** `instrumentation.ts`

**Purpose:** Server startup monitoring setup

**Current Setup:**
```typescript
export async function register() {
  const env = getEnvEdge(['NODE_ENV', 'NEXT_RUNTIME']);
  const isMonitoringEnabled = env.NODE_ENV === 'production';
  
  if (isMonitoringEnabled) {
    // Performance monitoring configuration
  }
}
```

### Custom Instrumentation

**API Route Instrumentation:**
```typescript
import { logger, runWithRequestContext } from '@/lib/monitoring';

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const startTime = performance.now();
  
  return runWithRequestContext({ requestId }, async () => {
    try {
      // Handler logic
      const result = await processRequest();
      
      const duration = Math.round(performance.now() - startTime);
      logger.info('Request completed', {
        duration: `${duration}ms`,
        status: 'success',
      });
      
      return http.ok(result);
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      logger.error('Request failed', {
        duration: `${duration}ms`,
        error: error.message,
      });
      throw error;
    }
  });
}
```

## 📊 Metrics Export

### Prometheus Metrics (Future)

**Potential Implementation:**
```typescript
// lib/monitoring/metrics/prometheus.ts
export function recordMetric(name: string, value: number, labels?: Record<string, string>) {
  // Export to Prometheus
}
```

### Custom Metrics Endpoint

**Future Enhancement:**
```typescript
// app/api/metrics/route.ts
export async function GET() {
  return http.ok({
    requests: { total: 1000, errors: 5 },
    responseTime: { p50: 150, p95: 500, p99: 1000 },
    database: { queries: 500, avgTime: 45 },
  });
}
```

## 🔗 Integration Points

### Error Tracking

**Sentry Integration:**
- Error capture and reporting
- Performance monitoring
- Release tracking
- User context

**Current Status:**
- Sentry package installed
- Integration hooks available
- Configuration via feature flags

### Analytics

**User Analytics:**
- Page views
- User interactions
- Feature usage
- Conversion tracking

**Performance Analytics:**
- Core Web Vitals
- Page load times
- API response times
- Error rates

## 📚 Best Practices

### ✅ DO

- Use structured logging
- Include request context
- Track performance metrics
- Monitor health endpoints
- Set up appropriate alerts
- Mask sensitive data
- Use appropriate log levels

### ❌ DON'T

- Log sensitive information
- Use string concatenation for logs
- Ignore error rates
- Skip health checks
- Over-alert (alert fatigue)
- Log in production without structure
- Ignore performance degradation

## 🔗 Related Documentation

- [Performance Guide](../performance/performance-optimization-guide.md) - Performance optimization and Core Web Vitals
- [Operational Guide](../operations/operational-guide.md) - Deployment, troubleshooting, and day-to-day operations
- [Production Readiness](../production/production-readiness-checklist.md) - Production deployment checklist
- [Error Handling Guide](../error-handling/error-handling-guide.md) - Error patterns and structured logging

---

**Last updated:** 2025-01-15
