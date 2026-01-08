import * as React from "react";

export function FaqSectionFrame({ children }: { children: React.ReactNode }) {
  return (
    <section id="faq" className="scroll-mt-24">
      {children}
    </section>
  );
}


