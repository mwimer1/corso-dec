"use client";

import * as React from 'react';
import EntityGrid from './entity-grid';
import type { EntityGridConfig } from '@/types/entity-grid';

export default function EntityGridHost({ config }: { config: EntityGridConfig }) {
  const gridRef = React.useRef<any>(null);
  const [, setSearchCount] = React.useState<string | null>(null);

  return (
    <div className="h-full w-full">
      <EntityGrid
        config={config}
        gridRef={gridRef}
        setSearchCount={setSearchCount}
        onStateUpdated={() => { /* no-op */ }}
        className="h-full w-full"
      />
    </div>
  );
}


