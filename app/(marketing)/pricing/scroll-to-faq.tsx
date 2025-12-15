"use client";

// Client-only helper that scrolls to the #faq anchor when the page loads
// or when the hash changes to "#faq". Extracted to a dedicated
// client component to avoid invoking React hooks in a Server Component context
// during prerender/build.
import * as React from "react";

export default function ScrollToFAQ(): null {
  const scrollToFAQ = React.useCallback(() => {
    if (typeof window !== "undefined" && window.location.hash === "#faq") {
      const timer = setTimeout(() => {
        const faqElement = document.getElementById("faq");
        if (faqElement) {
          faqElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);

      return timer;
    }

    return undefined;
  }, []);

  React.useEffect(() => {
    // Handle initial load with hash
    let timer = scrollToFAQ();

    // Handle hash changes (e.g., clicking FAQ link from navbar)
    const handleHashChange = () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = scrollToFAQ();
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [scrollToFAQ]);

  return null;
}


