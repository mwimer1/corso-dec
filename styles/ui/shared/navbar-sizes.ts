// Shared navbar geometry to prevent drift across atoms/molecules/organisms
// Keep values aligned with current design (Framer-parity)

// (Removed) NAV_ITEM was internal and unused across domains. Avoid leaking as public API.
// Inline the values to keep the functions working.

/** @public — used across navbar component family */
export function navDesktopClasses(): string {
  return `h-[30px] px-[14px] py-[6px] rounded-[10px] text-[16px] leading-[20px] font-medium`;
}

/** @public — used across navbar component family */
export function navMobileItemClasses(): string {
  return `h-[48px] px-[40px] py-[12px] w-full justify-start text-[16px] leading-[20px] font-medium border-b border-border`;
}

/** @public — used across navbar component family */
export function navMobileCtaClasses(): string {
  return `h-[36px] px-[9px] py-[7px] rounded-[10px] text-[14px]`;
}


