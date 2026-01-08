'use client';
import { Button } from '@/components/ui/atoms';
import { LinkTrack } from '@/components/ui/molecules';
import { APP_LINKS  } from '@/lib/shared';
import { navbarStyleVariants } from '@/styles/ui/organisms/navbar-variants';
import { containerMaxWidthVariants } from '@/styles/ui/shared/container-base';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import AnimatedPill from '../../widgets/animated-pill';
import cls from './hero.module.css';
import { underlineAccent } from "@/styles/ui/shared/underline-accent";

interface HeroProps { children?: ReactNode }

export default function Hero({ children }: HeroProps) {
  const [underlineVisible, setUnderlineVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(()=>setUnderlineVisible(true),200);
    return ()=>clearTimeout(t);
  },[]);

  const underline = underlineAccent({ show: underlineVisible, color: 'primary', duration: 'slow' });

  return (
    <section className={cls['hero']}>
      <div className={[
        cls['container'],
        containerMaxWidthVariants({ maxWidth: '7xl', centered: true, responsive: true })
      ].join(' ')}>
        {children}
        {/* Attention CTA pill above the H1 */}
        <AnimatedPill
          text="Construction data made easy"
          href="/redefine"
        />
        <h1 className={cls['title']}>
          Intelligence<br/>for the{' '}
          <span className={underline.wrap()}>
            built world.
            <span className={underline.line()} />
          </span>
        </h1>
        <h2 className={cls['subtitle']}>
          Corso eliminates guesswork, translating complex data into a competitive edge.
        </h2>
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
            className={navbarStyleVariants().button()}
          >
            <LinkTrack href={APP_LINKS.NAV.SIGNUP} label="hero:start-for-free">
              Start for free
            </LinkTrack>
          </Button>
        </div>
      </div>
    </section>
  );
}


