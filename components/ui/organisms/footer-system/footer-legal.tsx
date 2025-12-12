import { APP_LINKS  } from '@/lib/shared';
import Link from "next/link";
import React from "react";

export const FooterLegal: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <div className="w-full bg-[hsl(var(--footer-legal))] text-background border-t border-white/10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center sm:justify-between py-2 gap-2 text-xs text-background/70">
        <div className="whitespace-nowrap">
          © {year} Corso Inc. All rights reserved.
        </div>
        <div className="flex gap-4">
          <Link
            href={APP_LINKS.FOOTER.TERMS}
            className="hover:underline underline-offset-4 transition-colors hover:text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded"
          >
            Terms & Conditions
          </Link>
          <Link
            href={APP_LINKS.FOOTER.PRIVACY}
            className="hover:underline underline-offset-4 transition-colors hover:text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
};

