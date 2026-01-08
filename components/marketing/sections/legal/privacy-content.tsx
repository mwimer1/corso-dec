// components/marketing/legal/PrivacyContent.tsx
import type { HTMLAttributes } from "react";

type PrivacyContentProps = HTMLAttributes<HTMLDivElement>;

export function PrivacyContent({
  className,
  ...rest
}: PrivacyContentProps) {
  return (
    <div className={className} {...rest}>
      <h1>Privacy Policy</h1>
      <p>Last updated: October 1, 2025</p>
      <h2>1. Information We Collect</h2>
      <p>
        We collect information you provide (such as account and contact details), usage information (such as interactions and device data), and limited cookie data for authentication and analytics.
      </p>
      <h2>2. How We Use Information</h2>
      <p>
        We use your information to provide and improve the Service, personalize features, ensure security, and comply with legal obligations. We do not sell your personal information.
      </p>
      <h2>3. Sharing</h2>
      <p>
        We may share data with service providers under contract who process it on our behalf, subject to confidentiality and security obligations, or when required by law.
      </p>
      <h2>4. Data Retention</h2>
      <p>
        We retain personal data only as long as necessary for the purposes described or as required by law, after which it is deleted or anonymized.
      </p>
      <h2>5. Your Rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct, delete, or port your data, and to object or restrict certain processing. Contact us to exercise these rights.
      </p>
      <h2>6. Contact</h2>
      <p>
        Privacy questions? Contact us at <a href="mailto:privacy@getcorso.com">privacy@getcorso.com</a>.
      </p>
    </div>
  );
}
