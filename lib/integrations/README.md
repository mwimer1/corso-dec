---
title: "Integrations"
last_updated: "2026-01-07"
category: "library"
status: "active"
description: "External service integrations (ClickHouse, OpenAI, Supabase)."
---

# Integrations

External service integrations (ClickHouse, OpenAI, Supabase).

## Runtime

**Runtime**: server ✅

*server-only import detected*

**Signals detected:**
- import 'server-only'

## Directory Structure

```
lib/integrations/
├── clickhouse/
│   ├── client.ts
│   ├── concurrency.ts
│   ├── entity-query.server.ts
│   ├── index.ts
│   ├── security.ts
│   ├── server.ts
│   └── utils.ts
├── database/
│   ├── scope.ts
│   └── sql-guard.ts
├── env/
│   └── index.ts
├── mockdb/
│   ├── duckdb.ts
│   ├── index.ts
│   └── init-server.ts
├── openai/
│   ├── chat-logging.ts
│   ├── responses.ts
│   └── server.ts
├── supabase/
│   └── server.ts
```

