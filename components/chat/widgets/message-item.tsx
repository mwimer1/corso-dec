"use client";

import { cn } from '@/styles/utils';
import type { ChatMessage } from '@/types/chat';
import { memo } from 'react';
import { ChatTable } from './chat-table';
import { FollowUpChips } from './follow-up-chips';

type Props = {
  message: ChatMessage;
  onSelectFollowUp?: (text: string) => void;
  scrollParentEl?: HTMLElement | null;
};

function MessageItemImpl({ message, onSelectFollowUp }: Props) {
  const isUser = message.type === 'user';

  return (
    <div className={cn(
      "flex w-full mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "rounded-2xl px-4 py-3 max-w-[70%]",
        isUser
          ? "bg-blue-600 text-white ml-12"
      : "bg-gray-100 text-gray-900 mr-12 border-[var(--chat-bubble-asst-border)] border-gray-200"
      )}>
        <p className="whitespace-pre-wrap leading-relaxed">
          {message.content}
        </p>

        {/* Charts and tables only for assistant messages */}
        {!isUser && message.visualizationType === 'table' && message.tableData && message.tableColumns && (
          <div className="mt-3">
            <ChatTable
              columns={message.tableColumns.map((c: { name: string }) => ({ id: c.name, label: c.name }))}
              rows={message.tableData}
              compact
              stickyHeader
            />
          </div>
        )}


        {/* Follow-up chips only for assistant messages */}
        {!isUser && (
          <div className="mt-3">
            <FollowUpChips
              items={message.followUpQuestions || []}
              onClick={onSelectFollowUp ?? (() => {})}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const MessageItem = memo(MessageItemImpl);






