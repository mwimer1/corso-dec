'use client';
import { Button } from '@/components/ui/atoms';
import { LinkTrack } from '@/components/ui/molecules';
import { APP_LINKS } from '@/lib/shared';
import { cn } from '@/styles';
import { navbarStyleVariants } from '@/styles/ui/organisms/navbar-variants';
import { underlineAccent } from "@/styles/ui/shared/underline-accent";
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import AnimatedPill from '../../widgets/animated-pill';
import cls from './hero.module.css';

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
    <div className={cn(cls['hero'], "flex flex-col items-center justify-center text-center")}>
      {children}
      {/* Attention CTA pill above the H1 */}
      <AnimatedPill
        text="Construction data made easy"
        href="/redefine"
      />
      <h1 className={cls['title']}>
        Intelligence
        <br />
        {' '}for the{' '}
        <span className={underline.wrap()}>
          built world.
          <span className={underline.line()} />
        </span>
      </h1>
      <p className={cn(cls['subtitle'], "max-w-prose mx-auto")}>
        Corso eliminates guesswork, translating complex
        <br />
        {' '}data into a competitive edge.
      </p>
      <div className={cls['buttons']}>
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
      {/* Teaser element to guide users to scroll */}
      <div className="mt-sm flex flex-col items-center" aria-label="Scroll to see more">
        <ChevronDown 
          className="h-6 w-6 text-muted-foreground animate-bounce" 
          aria-hidden="true"
        />
      </div>
    </div>
  );
}


