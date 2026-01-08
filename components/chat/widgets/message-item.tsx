"use client";

import { cn } from '@/styles';
import type { ChatMessage } from '@/types/chat';
import { memo, useMemo } from 'react';
import { ChatTable } from './chat-table';
import { FollowUpChips } from './follow-up-chips';
import { formatMarkdown } from '../utils/markdown-formatter';
import DOMPurify from 'dompurify';

type Props = {
  message: ChatMessage;
  onSelectFollowUp?: (text: string) => void;
  scrollParentEl?: HTMLElement | null;
};

function MessageItemImpl({ message, onSelectFollowUp }: Props) {
  const isUser = message.type === 'user';

  // Format markdown content for assistant messages (especially Deep Research)
  const formattedContent = useMemo(() => {
    if (isUser || !message.content) return message.content;
    
    // Check if content contains markdown-like patterns (headings, bold, code, tables, links, etc.)
    const hasMarkdown = /^#+\s|^\*\*|^\d+\.\s|^[\-\*]\s|^```|^\|.*\|$|\[.*\]\(.*\)|`[^`]+`/.test(message.content) || 
                        /\*\*[^*]+\*\*|__[^_]+__/.test(message.content);
    
    if (!hasMarkdown) {
      return message.content;
    }

    // Format markdown to HTML
    const html = formatMarkdown(message.content);
    
    // Sanitize HTML to prevent XSS
    try {
      // Ensure target="_blank" links get rel="noopener" for security
      DOMPurify.addHook('afterSanitizeAttributes', (node) => {
        if ((node as unknown as Element).tagName === 'A') {
          const el = node as unknown as HTMLAnchorElement;
          const href = el.getAttribute('href');
          if (href && /^https?:/i.test(href)) {
            // External link: ensure rel="noopener noreferrer"
            el.setAttribute('rel', 'noopener noreferrer');
            el.setAttribute('target', '_blank');
          }
        }
      });

      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'a'],
        ALLOWED_ATTR: ['href', 'rel', 'target'],
        ALLOW_DATA_ATTR: false,
        ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/(?!\/)|#)/,
        FORBID_TAGS: ['script', 'style'],
      });
    } catch {
      // Fallback to original content if sanitization fails
      return message.content;
    }
  }, [message.content, isUser]);

  const shouldRenderAsHTML = useMemo(() => {
    if (isUser || !message.content) return false;
    const hasMarkdown = /^#+\s|^\*\*|^\d+\.\s|^[\-\*]\s/.test(message.content) || 
                        /\*\*[^*]+\*\*|__[^_]+__/.test(message.content);
    return hasMarkdown;
  }, [message.content, isUser]);

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
          // Normal assistant message bubble (with error styling if isError)
          <div
            className={cn(
              "relative my-2 flex w-full items-start rounded-xl border p-4 max-w-[70%]",
              message.isError
                ? "border-destructive bg-destructive/10"
                : "border-border bg-surface"
            )}
            role={message.isError ? "alert" : "article"}
            aria-live={message.isError ? "assertive" : "off"}
          >
            <div className={cn("w-full", message.isError ? "text-destructive" : "text-foreground")}>
              {formattedContent && (
                shouldRenderAsHTML ? (
                  <div 
                    className="leading-relaxed prose prose-sm max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground prose-h1:text-xl prose-h1:mt-4 prose-h1:mb-2 prose-h2:text-lg prose-h2:mt-3 prose-h2:mb-2 prose-h3:text-base prose-h3:mt-3 prose-h3:mb-1 prose-p:text-foreground prose-p:mb-2 prose-strong:text-foreground prose-strong:font-semibold prose-ul:list-disc prose-ul:ml-4 prose-ul:mb-2 prose-li:mb-1"
                    dangerouslySetInnerHTML={{ __html: formattedContent }}
                  >
                    <span className="sr-only">Assistant: </span>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed">
                    <span className="sr-only">Assistant: </span>
                    {formattedContent}
                  </p>
                )
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






