 
/* cspell:ignore Corso BESTPRACTICES */

/** Generic domain event structure */
export interface DomainEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
  source?: string;
}

/** Event‑handler signature */
export type EventHandler<T = unknown> = (
  _event: DomainEvent<T> // v2025‑06‑10‑audit
) => void | Promise<void>;

/* ── Chat‑specific payloads ────────────────────────────────────────── */

export interface ChatMessageProcessedPayload {
  userId: string;
  content: string;
  messageId?: string;
}

export interface ChatAIErrorPayload {
  userId?: string;
  message: string;
}

