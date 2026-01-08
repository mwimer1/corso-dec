// components/ui/atoms/icon/icons/up-arrow-icon.tsx
import { COMMON_ICON_STROKE_ATTRS, createIcon } from "../icon-base";

export const ArrowUpIcon = createIcon(
  "ArrowUpIcon",
  (
    <path
      d="M12 19V5M5 12l7-7 7 7"
      {...COMMON_ICON_STROKE_ATTRS}
    />
  )
);
