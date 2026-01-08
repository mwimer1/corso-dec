// components/marketing/legal/TermsContent.tsx
import type { HTMLAttributes } from "react";

type TermsContentProps = HTMLAttributes<HTMLDivElement>;

export function TermsContent({
  className,
  ...rest
}: TermsContentProps) {
  return (
    <div className={className} {...rest}>
      <h1>Terms of Service</h1>
      <p>Last updated: October 1, 2025</p>
      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using Corso, you confirm that you have read, understand, and agree to be bound by these Terms of Service.
      </p>
      <h2>2. Use of the Service</h2>
      <p>
        You may use the Service only in compliance with these Terms and all applicable laws. You are responsible for your account activity and maintaining the confidentiality of your credentials.
      </p>
      <h2>3. Subscriptions and Billing</h2>
      <p>
        Paid plans are billed according to the pricing disclosed at checkout. Unless cancelled, subscriptions renew automatically. You can cancel at any time from your account settings; cancellations take effect at the end of the current billing period.
      </p>
      <h2>4. Acceptable Use</h2>
      <p>
        You will not misuse the Service, attempt to gain unauthorized access, or use it to infringe intellectual property, violate privacy, or engage in unlawful activity.
      </p>
      <h2>5. Intellectual Property</h2>
      <p>
        Corso and all associated trademarks, logos, and content are owned by Corso or its licensors. These Terms do not grant you any rights to our intellectual property except as expressly provided.
      </p>
      <h2>6. Disclaimers and Limitation of Liability</h2>
      <p>
        The Service is provided on an “as is” and “as available” basis without warranties of any kind. To the maximum extent permitted by law, Corso will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.
      </p>
      <h2>7. Modifications</h2>
      <p>
        We may update these Terms from time to time. Material changes will be communicated by updating the “Last updated” date or by additional notice where required.
      </p>
      <h2>8. Contact</h2>
      <p>
        Questions about these Terms? Contact us at <a href="mailto:legal@getcorso.com">legal@getcorso.com</a>.
      </p>
    </div>
  );
}
