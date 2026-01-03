'use client';
import { Button } from '@/components/ui/atoms';
import { LinkTrack } from '@/components/ui/molecules';
import { APP_LINKS } from '@/lib/shared';
import { cn } from '@/styles';
import { navbarStyleVariants } from '@/styles/ui/organisms/navbar-variants';
import { underlineAccent } from "@/styles/ui/shared/underline-accent";
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import AnimatedPill from '../../widgets/animated-pill';
import styles from './hero.module.css';

interface HeroProps { children?: ReactNode }

export default function Hero({ children }: HeroProps) {
  const [underlineVisible, setUnderlineVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(()=>setUnderlineVisible(true),200);
    return ()=>clearTimeout(t);
  },[]);

  const underline = underlineAccent({ show: underlineVisible, color: 'primary', duration: 'slow' });

  // Changed from <section> to <div> to avoid nested sections (parent FullWidthSection already renders <section>)
  return (
    <div className={cn(styles['hero'], "flex flex-col items-center justify-center text-center")}>
      {children}
      {/* Attention CTA pill above the H1 */}
      <AnimatedPill
        text="Construction data made easy"
        href="/redefine"
      />
      <h1 className={styles['title']}>
        Intelligence
        <br />
        {' '}for the{' '}
        <span className={underline.wrap()}>
          built world.
          <span className={underline.line()} />
        </span>
      </h1>
      <p className={cn(styles['subtitle'], "max-w-prose mx-auto")}>
        Corso eliminates guesswork, translating complex
        <br />
        {' '}data into a competitive edge.
      </p>
      <div className={styles['buttons']}>
        <Button
          asChild
          variant="secondary"
          className={navbarStyleVariants().button()}
        >
          <LinkTrack href={APP_LINKS.NAV.BOOK_DEMO} label="hero:talk-to-sales" target="_blank">
            Talk to sales
          </LinkTrack>
        </Button>
        <Button
          asChild
          variant="default"
          className={navbarStyleVariants().button()}
        >
          <LinkTrack href={APP_LINKS.NAV.SIGNUP} label="hero:start-free">
            Start free
          </LinkTrack>
        </Button>
      </div>
    </div>
  );
}


