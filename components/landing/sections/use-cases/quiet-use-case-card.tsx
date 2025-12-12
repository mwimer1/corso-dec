'use client';

import type { UseCase, UseCaseKey } from '@/lib/marketing/client';
import { memo } from 'react';
import cls from './use-cases.module.css';

type Props = {
  kind: UseCaseKey;
  data: UseCase;
};

export const QuietUseCaseCard = memo(function QuietUseCaseCard({ kind, data }: Props) {
  return (
    <article className={`${cls['tile']} ${cls[`theme-${kind}`]}`}>
      {/* Subtle accent bar */}
      <div className={cls['accentBar']} aria-hidden="true" />

      <header className={cls['tileHeader']}>
        <h3 className={cls['title']}>{data.title}</h3>
        <p className={cls['subtitle']}>{data.subtitle}</p>
      </header>

      <p className={cls['desc']} title={data.description}>{data.description}</p>

      <ul className={cls['list']} aria-label="Key benefits">
        {data.benefits.slice(0, 3).map((b) => (
          <li key={b} className={cls['benefitText']}>
            {b}
          </li>
        ))}
      </ul>

      <div className={cls['impactText']}>
        <strong>Impact:</strong> {data.impact}
      </div>
    </article>
  );
});
