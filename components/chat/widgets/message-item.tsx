"use client";

import { cn } from '@/styles';
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
      "flex w-full",
      isUser ? "justify-end" : "justify-start"
    )}>
      {isUser ? (
        // User message bubble with primary styling
        message.content && (
          <div className="relative my-2 flex w-full items-start rounded-xl border border-primary bg-primary p-4 text-primary-foreground text-sm max-w-[70%]">
            <p className="whitespace-pre-wrap leading-relaxed w-full">
              <span className="sr-only">You: </span>
              {message.content}
            </p>
          </div>
        )
      ) : (
        // Assistant message bubble
        (!message.content || message.content.length === 0) && !message.isError ? (
          // Typing indicator bubble
          <div className="relative my-2 flex w-full items-start rounded-xl border border-border bg-surface px-4 py-3 max-w-[70%]">
            <span className="text-sm italic text-muted-foreground">
              Assistant is typing<span className="animate-pulse">…</span>
            </span>
          </div>
        ) : (
          // Normal assistant message bubble
          <div className="relative my-2 flex w-full items-start rounded-xl border border-border bg-surface p-4 max-w-[70%]">
            <div className="w-full text-foreground">
              {message.content && (
                <p className="whitespace-pre-wrap leading-relaxed">
                  <span className="sr-only">Assistant: </span>
                  {message.content}
                </p>
              )}

              {/* Charts and tables only for assistant messages */}
              {message.visualizationType === 'table' && message.tableData && message.tableColumns && (
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
              <div className="mt-3">
                <FollowUpChips
                  items={message.followUpQuestions || []}
                  onClick={onSelectFollowUp ?? (() => {})}
                />
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export const MessageItem = memo(MessageItemImpl);






