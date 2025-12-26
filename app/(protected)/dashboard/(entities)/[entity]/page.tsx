import { EntityGridHost, getEntityConfig } from '@/components/dashboard/entities';
import { isChatEntity, isGridEntity } from '@/lib/services/entities/registry';
import { EntityParamSchema } from '@/lib/validators/entity';
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

// Route config: use plain literals (no `as const`) so Next.js static analysis can read them.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper to derive title from entity ID (capitalize first letter)
function getEntityTitle(entity: string): string {
  return entity.charAt(0).toUpperCase() + entity.slice(1);
}

export async function generateMetadata({ params }: { params: Promise<{ entity: string }> }): Promise<Metadata> {
  const data = EntityParamSchema.safeParse(await params);
  if (!data.success) notFound();

  const { entity } = data.data;
  // Validate entity exists in registry via getEntityConfig
  try {
    getEntityConfig(entity as 'projects' | 'addresses' | 'companies');
  } catch {
    notFound();
  }

  const title = getEntityTitle(entity);
  return {
    title: `${title} | Dashboard | Corso`,
    description: `View and manage all ${entity} in your dashboard.`,
  };
}

export default async function EntityPage({ params }: { params: Promise<{ entity: string }> }) {
  const parsed = EntityParamSchema.safeParse(await params);
  if (!parsed.success) return notFound();

  const { entity } = parsed.data;

  // Chat entity is handled separately at /dashboard/chat
  if (isChatEntity(entity)) {
    return notFound();
  }

  if (isGridEntity(entity)) {
    // Use registry as single source of truth
    const gridConfig = getEntityConfig(entity as 'projects' | 'addresses' | 'companies');
    return <EntityGridHost config={gridConfig} /> as unknown as React.JSX.Element;
  }

  return notFound();
}

