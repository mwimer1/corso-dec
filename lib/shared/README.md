---
title: Shared
description: >-
  Core lib utilities and functionality for the Corso platform. Located in
  shared/.
last_updated: '2025-12-31'
category: library
status: draft
---
# Shared Library

Core shared utilities and functionality for the Corso platform.

## Cache Utilities

The shared library provides caching utilities exported from the root barrel:

- **LRUCache**: High-performance Least-Recently-Used cache with O(1) operations
- **simpleCacheManager**: Generic in-memory cache manager with TTL support

Import from the root barrel: `import { LRUCache, simpleCacheManager } from '@/lib/shared'`

## Validation Utilities

The shared library provides validation helpers:

- **assertZodSchema**: Type-safe Zod schema validation with error handling

Import from the root barrel: `import { assertZodSchema } from '@/lib/shared'`

## Note

This README is manually maintained. The cache barrel (`lib/shared/cache/index.ts`) has been removed and consolidated into the root shared barrel for consistency and maintainability.
