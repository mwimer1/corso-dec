import { EntityGridHost, getEntityConfig } from '@/components/dashboard/entity';
import { isChatEntity, isGridEntity } from '@/lib/entities/registry';
import { EntityParamSchema } from '@/lib/validators/entity';
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Route config: use plain literals (no `as const`) so Next.js static analysis can read them.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type EntitySlug = string;

const ENTITY_CONFIG: Record<string, { title: string; subtitle: string; loadingText: string; pageSize: number }> = {
  addresses: {
    title: "Addresses",
    subtitle: "Browse and manage all addresses.",
    loadingText: "Loading addresses table...",
    pageSize: 10,
  },
  companies: {
    title: "Companies",
    subtitle: "Browse and manage all companies.",
    loadingText: "Loading companies table...",
    pageSize: 10,
  },
  projects: {
    title: "Projects",
    subtitle: "Browse and manage all projects.",
    loadingText: "Loading projects table...",
    pageSize: 10,
  },
  chat: {
    title: "Chat",
    subtitle: "AI-powered data exploration.",
    loadingText: "Loading chat interface...",
    pageSize: 10,
  },
};


export async function generateMetadata({ params }: { params: Promise<{ entity: EntitySlug }> }): Promise<Metadata> {
  const data = EntityParamSchema.safeParse(await params);
  if (!data.success) notFound();

  const { entity } = data.data;
  const config = ENTITY_CONFIG[entity];
  if (!config) notFound();

  return {
    title: `${config.title} | Dashboard | Corso`,
    description: `View and manage all ${entity} in your dashboard.`,
  };
}

export default async function EntityPage({ params }: { params: Promise<{ entity: string }> }) {
  const parsed = EntityParamSchema.safeParse(await params);
  if (!parsed.success) return notFound();

  const { entity } = parsed.data;

  if (isChatEntity(entity)) {
    const { ChatPage } = await import('@/components/chat/sections/chat-page');
    return <ChatPage /> as unknown as JSX.Element;
  }

  if (isGridEntity(entity)) {
    const config = ENTITY_CONFIG[entity];
    if (!config) return notFound();

    const gridConfig = getEntityConfig(entity as 'projects' | 'addresses' | 'companies');
    return <EntityGridHost config={gridConfig} /> as unknown as JSX.Element;
  }

  return notFound();
}


