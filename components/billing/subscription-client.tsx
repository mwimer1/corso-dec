'use client'
import { PricingTable, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import { useSubscription } from '@clerk/nextjs/experimental'
import Link from 'next/link'

export function SubscriptionClient() {
  const { data: sub, isLoading, error } = useSubscription()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Subscription</h1>

      <SignedOut>
        <p className="text-sm text-muted-foreground">Please sign in to manage your subscription.</p>
        <SignInButton />
      </SignedOut>

      <SignedIn>
        {isLoading && <div>Loading your subscription…</div>}
        {error && <div role="alert">Failed to load subscription: {error.message}</div>}

        {sub && (
          <div className="rounded-md border p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-base font-medium capitalize">{sub.status ?? 'active'}</p>
            </div>
            <Link href="/dashboard/account" className="underline">
              Manage in Account
            </Link>
          </div>
        )}

        <div>
          <h2 className="text-lg font-medium">Choose a plan</h2>
          <PricingTable />
        </div>
      </SignedIn>
    </div>
  )
}


