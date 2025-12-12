// components/ui/atoms/icon/icons/mail-icon.tsx
import { COMMON_ICON_STROKE_ATTRS, createIcon } from "../icon-base";

export const MailIcon = createIcon("MailIcon", (
  <>
    <path
      d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
      {...COMMON_ICON_STROKE_ATTRS}
    />
    <path
      d="M22 6L12 13L2 6"
      {...COMMON_ICON_STROKE_ATTRS}
    />
  </>
));

