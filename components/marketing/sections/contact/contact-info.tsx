// FILE: components/marketing/contact/contact-info.tsx
import { cn } from "@/styles";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import * as React from "react";
import type { ContactItemProps } from "./contact-item";
import { ContactItem } from "./contact-item";

interface ContactInfoProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ContactInfo = React.forwardRef<HTMLDivElement, ContactInfoProps>(
  ({ className, ...props }, ref) => {
    const contactItems: ContactItemProps[] = [
      {
        icon: <Mail className="h-md w-md" />,
        label: "Email",
        value: "hello@corso.com",
        href: "mailto:hello@corso.com",
      },
      {
        icon: <Phone className="h-md w-md" />,
        label: "Phone",
        value: "+1 (555) 123-4567",
        href: "tel:+15551234567",
      },
      {
        icon: <MapPin className="h-md w-md" />,
        label: "Address",
        value: "123 Business Ave, Suite 100\nAustin, TX 78701",
      },
      {
        icon: <Clock className="h-md w-md" />,
        label: "Business Hours",
        value: "Monday – Friday\n9:00 AM – 6:00 PM CST",
      },
    ];

    return (
      <div ref={ref} className={cn("space-y-lg", className)} {...props}>
        {/* Header */}
        <div className="space-y-sm">
          <h2 className="text-2xl font-bold text-high">
            Get in Touch
          </h2>
          <p className="text-low">
            Ready to transform your construction data? Let's discuss how Corso
            can help your business grow.
          </p>
        </div>

        {/* Contact Items */}
        <div className="space-y-md">
          {contactItems.map(({ icon, label, value, href }) => (
            <ContactItem
              key={label}
              icon={icon}
              label={label}
              value={value}
              {...(href && { href })}
            />
          ))}
        </div>

        <div className="rounded-lg border border-border-subtle bg-muted p-md">
          <h3 className="font-medium text-high">
            Need immediate assistance?
          </h3>
          <p className="mt-xs text-sm text-low">
            Schedule a demo call to see Corso in action and discuss your
            specific requirements.
          </p>
        </div>
      </div>
    );
  },
);
ContactInfo.displayName = "ContactInfo";
