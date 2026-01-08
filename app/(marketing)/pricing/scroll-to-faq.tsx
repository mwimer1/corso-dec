"use client";

// Client-only helper that scrolls to the #faq anchor when the page loads
// and the current URL includes the "#faq" hash. Extracted to a dedicated
// client component to avoid invoking React hooks in a Server Component context
// during prerender/build.
import * as React from "react";

export default function ScrollToFAQ(): null {
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#faq") {
      const timer = setTimeout(() => {
        const faqElement = document.getElementById("faq");
        if (faqElement) {
          faqElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, []);

  return null;
}


