'use client';

import nextDynamic from "next/dynamic";

const UserProfile = nextDynamic(
  () => import("@clerk/nextjs").then(mod => ({ default: mod.UserProfile })),
  {
    loading: () => (
      <div className="p-8">
        <div className="animate-pulse motion-reduce:animate-none motion-reduce:transition-none space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      </div>
    ),
    ssr: false
  }
);

// eslint-disable-next-line import/no-unused-modules -- Used by page.tsx in same directory
export function UserProfileClient() {
  return (
    <UserProfile
      routing="path"
      path="/dashboard/account"
      appearance={{
        elements: {
          card: "p-lg shadow-panel rounded-lg",
          rootBox: "w-full max-w-2xl",
        },
      }}
    />
  );
}

