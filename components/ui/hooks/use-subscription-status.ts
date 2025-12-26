// components/ui/hooks/use-subscription-status.ts
"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export function useSubscriptionStatus() {
  const { user } = useUser();
  const [planLabel, setPlanLabel] = useState<string>("Free");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // With Clerk Billing, subscription status is handled by Clerk's PricingTable
    // and stored in user metadata. No API call needed.
    if (!user) {
      setPlanLabel("Free");
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const getSubscriptionStatus = () => {
      try {
        const cacheKey = `plan:${user.id}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          if (!cancelled) {
            setPlanLabel(cached);
            setIsLoading(false);
          }
          return;
        }

        // With Clerk Billing, subscription status is managed through Clerk's PricingTable
        // The subscription status is handled automatically by Clerk components
        // For now, show "Free" unless explicitly set in user metadata
        const subscriptionStatus = (user.publicMetadata as {
          subscriptionStatus?: string;
        })?.subscriptionStatus;

        const formatted = subscriptionStatus
          ? subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)
          : "Free";

        if (!cancelled) {
          setPlanLabel(formatted);
          sessionStorage.setItem(cacheKey, formatted);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setPlanLabel("Free");
          setIsLoading(false);
        }
      }
    };

    getSubscriptionStatus();
    return () => { cancelled = true; };
  }, [user]);

  return { planLabel, isLoading };
}

