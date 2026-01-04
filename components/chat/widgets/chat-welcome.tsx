"use client";

import { Logo } from '@/components/ui/atoms/logo';
import { greetingWithName } from '../utils/time-utils';

type ChatWelcomeProps = {
  firstName?: string;
  onPreset: (text: string) => void;
  className?: string;
};

function ChatWelcome({ firstName, onPreset: _onPreset, className }: ChatWelcomeProps) {
  const greeting = greetingWithName(firstName);
  
  return (
    <div className={["w-full", className].filter(Boolean).join(' ')}>
      <div className="pt-8 md:pt-12 lg:pt-16 pb-4 text-center mb-4">
        <div className="flex items-center justify-center">
          <Logo width={200} height={67} />
        </div>
        {/* Greeting text */}
        <div className="mt-6 mb-2">
          <h2 className="text-xl font-medium text-foreground">
            {greeting}
          </h2>
        </div>
        {/* Description text */}
        <div className="mt-2 mb-4">
          <p className="text-sm text-muted-foreground">
            Ask a question about permits, company activity, or address history
          </p>
        </div>
      </div>
    </div>
  );
}

// NOTE: Default export only; imported by chat-window via named symbol.
export default ChatWelcome;


