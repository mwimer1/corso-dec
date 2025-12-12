import * as React from "react";

export function FaqSectionFrame({ children }: { children: React.ReactNode }) {
  return (
    <section id="faq" className="scroll-mt-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="">{children}</div>
      </div>
    </section>
  );
}


