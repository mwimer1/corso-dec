import React from "react";
import { SiteFooterShell } from "../site-footer-shell";
import { FooterCTA } from "./footer-cta";
import { FooterLegal } from "./footer-legal";
import { FooterMain } from "./footer-main";

type FooterProps = {
  /** Show the blue CTA band */
  showCTA?: boolean;
  /** Pass-through props for CTA customization */
  ctaProps?: React.ComponentProps<typeof FooterCTA>;
  /** Footer shell variant - controls height behavior */
  variant?: 'fillViewport' | 'hero' | 'content';
};

const Footer: React.FC<FooterProps> = ({
  showCTA = true,
  ctaProps,
  variant = 'fillViewport',
}) => {
  return (
    <>
      <SiteFooterShell variant={variant}>
        {showCTA && <FooterCTA {...ctaProps} />}
        <FooterMain />
      </SiteFooterShell>
      <FooterLegal />
    </>
  );
};

export default Footer;

