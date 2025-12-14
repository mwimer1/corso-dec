---
category: "documentation"
last_updated: "2025-12-14"
status: "draft"
title: "Health"
description: "Documentation and resources for documentation functionality. Located in api/health/."
---
## Overview

Health check endpoints provide operational monitoring capabilities for the Corso application and its dependencies. These endpoints are designed for load balancers, monitoring systems, and operational tooling.

## Endpoints

### General Health Check (`/api/health`)

**Purpose**: Canonical application health endpoint for general service availability monitoring.

- **Path**: `/api/health`
- **Methods**: GET, HEAD, OPTIONS
- **Runtime**: Edge (fast responses, no database dependencies)
- **Authentication**: None (public endpoint)
- **Rate Limiting**: None (health check endpoint)

#### Response Format (GET)

```json
{
  "status": "ok",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "nodeVersion": "v20.10.0",
  "environment": "production",
  "platform": "linux",
  "arch": "x64"
}
```

### ClickHouse Health Check (`/api/health/clickhouse`)

**Purpose**: Database connectivity health check for ClickHouse data warehouse operations.

- **Path**: `/api/health/clickhouse`
- **Methods**: GET, HEAD, OPTIONS
- **Runtime**: Node.js (required for ClickHouse client)
- **Authentication**: None (public endpoint)
- **Rate Limiting**: None (health check endpoint)

#### Response Format (GET)

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-28T12:00:00.000Z",
    "service": "clickhouse",
    "responseTime": "45ms"
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": {
    "code": "CLICKHOUSE_UNHEALTHY",
    "message": "ClickHouse health check failed",
    "details": {
      "message": "Connection timeout after 5000ms",
      "responseTime": "5001ms",
      "timestamp": "2025-10-28T12:00:00.000Z"
    }
  }
}
```

## Health Check Logic

### General Health Check
- Returns static application metadata
- No external dependencies
- Fast Edge runtime execution
- Includes runtime environment information

### ClickHouse Health Check
- Creates ClickHouse client connection
- Executes `SELECT 1` query to verify connectivity
- Validates response format and timing
- Includes performance metrics (response time)

## Monitoring Integration

### Load Balancers
```nginx
# Example nginx health check configuration
location /api/health {
    proxy_pass http://app;
    proxy_connect_timeout 5s;
    proxy_read_timeout 5s;
}
```

### Kubernetes Readiness/Liveness Probes
```yaml
# deployment.yaml
readinessProbe:
  httpGet:
    path: /api/health
    port: 80
  initialDelaySeconds: 30
  periodSeconds: 10

livenessProbe:
  httpGet:
    path: /api/health/clickhouse
    port: 80
  initialDelaySeconds: 60
  periodSeconds: 30
```

### Monitoring Tools
Both endpoints support standard HTTP status monitoring:
- `200 OK` = Healthy
- `5xx` = Unhealthy

## Troubleshooting

### ClickHouse Connection Issues

1. **Environment Variables**
   - Verify `CLICKHOUSE_URL` is set and accessible
   - Check `CLICKHOUSE_READONLY_USER` credentials
   - Confirm `CLICKHOUSE_PASSWORD` is correct
   - Validate `CLICKHOUSE_DATABASE` exists

2. **Network Connectivity**
   - Test network reachability to ClickHouse instance
   - Verify firewall and security group rules
   - Check DNS resolution

3. **Authentication**
   - Ensure user has SELECT permissions
   - Verify password encoding if special characters
   - Check for expired credentials

4. **Resource Constraints**
   - Monitor ClickHouse server resources (CPU, memory, disk)
   - Check connection pool limits
   - Verify query timeout settings (`CLICKHOUSE_TIMEOUT`)

## Performance Characteristics

- **General Health**: Sub-millisecond response time
- **ClickHouse Health**: 10-100ms typical response time
- **No Caching**: Real-time status (appropriate for health checks)
- **Thread Safe**: Singleton ClickHouse client pattern

## Development Notes

- General health endpoint runs on Edge runtime (no Node.js dependencies)
- ClickHouse health requires Node.js runtime for database client
- Both endpoints include structured logging for operational visibility
- Error responses include detailed diagnostic information

## Related Endpoints

- `/api/v1/entity/[entity]/query` - Data operations that depend on ClickHouse health
- `/api/health` - General application health (covered in this document)

---

**Last updated:** 2025-10-28

