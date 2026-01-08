/**
 * @fileoverview Mocks Domain Barrel Export
 * @description Mock data utilities for development and testing
 * @runtime Mixed (Client-safe + Server-only exports)
 */

// Entity data mocking utilities (server-only)
export * from './entity-data.server';

// Client-safe utilities and types
export * from './mappers/projects.adapter';
export * from './normalize';
export * from './shared';


