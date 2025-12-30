// components/ui/atoms/icon/icons/hamburger-icon.tsx
import * as React from "react";
import { COMMON_ICON_STROKE_ATTRS, createIcon } from "../icon-base";

export const HamburgerIcon = createIcon(
  "HamburgerIcon",
  (
    <React.Fragment>
      <path
        d="M4 7h16"
        {...COMMON_ICON_STROKE_ATTRS}
      />
      <path
        d="M4 12h16"
        {...COMMON_ICON_STROKE_ATTRS}
      />
      <path
        d="M4 17h16"
        {...COMMON_ICON_STROKE_ATTRS}
      />
    </React.Fragment>
  )
);



