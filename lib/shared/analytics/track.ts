// Analytics disabled shim: satisfy imports without doing anything
export type TrackProps = { href?: string; name?: string; label?: string; [k: string]: unknown };

type TrackEventArg =
  | string
  | {
      name: string;
      props?: TrackProps;
    };

export function trackEvent(_arg: TrackEventArg, _props?: TrackProps): void {
  // no-op
}

// Overloads for trackNavClick compatibility
export function trackNavClick(name: string, href?: string): void;
export function trackNavClick(name: string, props?: TrackProps): void;
export function trackNavClick(props: TrackProps): void;
export function trackNavClick(
  a: string | TrackProps,
  b?: string | TrackProps
): void {
  if (typeof a === 'string') {
    // a = name/label; b may be href string OR props object
    if (typeof b === 'string') {
      // Legacy: (label, href)
      return trackEvent('nav_click', { label: a, href: b });
    }
    // (name, props)
    return trackEvent('nav_click', { label: a, ...(b ?? {}) });
  }
  // (props)
  return trackEvent('nav_click', a);
}

