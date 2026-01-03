"use client";

import { Logo } from '@/components/ui/atoms/logo';

type ChatWelcomeProps = {
  firstName?: string;
  onPreset: (text: string) => void;
  className?: string;
};

function ChatWelcome({ onPreset: _onPreset, className }: ChatWelcomeProps) {
  return (
    <div className={["w-full", className].filter(Boolean).join(' ')}>
      <div className="pt-8 md:pt-12 lg:pt-16 pb-4 text-center mb-4">
        <div className="flex items-center justify-center">
          <Logo width={200} height={67} />
        </div>
      </div>
    </div>
  );
}

// NOTE: Default export only; imported by chat-window via named symbol.
export default ChatWelcome;


