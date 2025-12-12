// components/marketing/legal/CookiesContent.tsx
import type { HTMLAttributes } from "react";

type CookiesContentProps = HTMLAttributes<HTMLDivElement>;

export function CookiesContent({
  className,
  ...rest
}: CookiesContentProps) {
  return (
    <div className={className} {...rest}>
      <h1>Cookie Notice</h1>
      <p>Last updated: October 1, 2025</p>
      <h2>What Are Cookies?</h2>
      <p>Cookies are small text files stored on your device to help operate and improve the Service.</p>
      <h2>How We Use Cookies</h2>
      <p>We use essential cookies for authentication and security, and optional analytics cookies to understand product usage.</p>
      <h2>Your Choices</h2>
      <p>You can manage cookies via your browser settings. Disabling certain cookies may affect functionality.</p>
      <h2>Contact</h2>
      <p>
        Questions? Contact <a href="mailto:privacy@getcorso.com">privacy@getcorso.com</a>.
      </p>
    </div>
  );
}
