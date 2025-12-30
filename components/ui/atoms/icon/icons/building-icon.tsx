// components/ui/atoms/icon/icons/building-icon.tsx
"use client";
import * as React from "react";
import { COMMON_ICON_STROKE_ATTRS, createIcon } from "../icon-base";

export const BuildingIcon = createIcon("BuildingIcon", (
  <React.Fragment>
    <path
      d="M3 21H21"
      {...COMMON_ICON_STROKE_ATTRS}
    />
    <path
      d="M5 21V7L13 3V21"
      {...COMMON_ICON_STROKE_ATTRS}
    />
    <path
      d="M19 21V11L13 7"
      {...COMMON_ICON_STROKE_ATTRS}
    />
    <path
      d="M9 9H9.01"
      {...COMMON_ICON_STROKE_ATTRS}
    />
    <path
      d="M9 13H9.01"
      {...COMMON_ICON_STROKE_ATTRS}
    />
    <path
      d="M9 17H9.01"
      {...COMMON_ICON_STROKE_ATTRS}
    />
  </React.Fragment>
));
