"use client";

import { greetingWithName } from '../utils/time-utils';

type ChatWelcomeProps = {
  firstName?: string;
  onPreset: (text: string) => void;
  className?: string;
};

const PRESETS: Array<{ icon: string; text: string }> = [
  { icon: '🧾', text: 'Show permits issued in the last 30 days' },
  { icon: '🏆', text: 'Top 10 contractors by total job value YTD' },
  { icon: '📈', text: 'Which project types are trending this quarter?' },
  { icon: '🏗️', text: 'Compare construction costs by project category' },
];

function ChatWelcome({ firstName, onPreset, className }: ChatWelcomeProps) {
  const greeting = greetingWithName(firstName?.trim());
  return (
    <div className={["w-full", className].filter(Boolean).join(' ')}>
        <div className="pt-4 md:pt-6 pb-6 text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">{greeting}</h1>
        <p className="mt-4 text-base text-muted-foreground max-w-3xl lg:max-w-4xl 2xl:max-w-5xl mx-auto">
          Ask a question about permits, company activity, or address history. Try a preset prompt below or type your
          own to get started.
        </p>
      </div>
      <div className="max-w-3xl lg:max-w-4xl 2xl:max-w-5xl mx-auto space-y-3">
          {PRESETS.map(({ icon, text }) => {
          const classes =
            "group w-full rounded-2xl border border-border bg-surface px-5 py-3.5 text-left " +
            "flex items-center gap-3 text-foreground " +
            "shadow-xs " +
            "transition-all duration-150 ease-out " +
            "hover:-translate-y-0.5 hover:shadow-md hover:border-border " +
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2";

          return (
            <button
              key={text}
              type="button"
              onClick={() => onPreset(text)}
              className={classes}
            >
              <span
                aria-hidden
                className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface-contrast text-base shadow-sm"
              >
                {icon}
              </span>
              <span className="text-base font-semibold text-foreground">{text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// NOTE: Default export only; imported by chat-window via named symbol.
export default ChatWelcome;


