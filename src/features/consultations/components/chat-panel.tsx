"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatMessage } from "../types";
import { cn, formatTime } from "@/lib/utils";

export function ChatPanel({
  messages,
  me,
  onSend,
  disabled,
  className,
  placeholder = "Type a message…",
}: {
  messages: ChatMessage[];
  me: ChatMessage["from"];
  onSend: (text: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length]);

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Messages appear here. Useful for spelling medicine names or sharing notes.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.from === me ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                m.from === me ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted",
              )}
            >
              <p className="whitespace-pre-wrap break-words">{m.text}</p>
              <p className={cn("mt-0.5 text-[10px] opacity-70", m.from === me && "text-right")}>{formatTime(m.at)}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          const t = text.trim();
          if (!t) return;
          onSend(t);
          setText("");
        }}
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} disabled={disabled} />
        <Button type="submit" size="icon" disabled={disabled || !text.trim()} aria-label="Send">
          <SendHorizontalIcon />
        </Button>
      </form>
    </div>
  );
}
