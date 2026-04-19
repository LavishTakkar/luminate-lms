import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";
import { apiPost } from "../../lib/api";
import type { ChatResponse } from "@lms/shared";
import { GlassCard } from "../ui/GlassCard";
import { cn } from "../../lib/cn";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AITutorChatProps {
  lessonContext?: {
    content: string;
    title: string;
    lessonId?: string;
  };
}

export function AITutorChat({ lessonContext }: AITutorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: lessonContext?.title
        ? `Hi — I'm here to help you understand "${lessonContext.title}". What's confusing, or what do you want to explore first?`
        : "Hi — ask me anything about what you're learning.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await apiPost<ChatResponse>("/ai/chat", {
        message: trimmed,
        conversationId: conversationId ?? undefined,
        lessonContext,
      });
      if (data.conversationId) setConversationId(data.conversationId);
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err instanceof Error
              ? `Sorry — I hit an error: ${err.message}`
              : "Sorry — I hit an error. Try again?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send();
  }

  return (
    <GlassCard className="flex h-[520px] flex-col p-0">
      <div className="flex items-center gap-2 border-b border-white/30 p-4 dark:border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-serif text-lg font-semibold leading-tight">AI Tutor</h3>
          {lessonContext?.title && (
            <p className="text-xs text-muted-foreground">Studying: {lessonContext.title}</p>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-primary text-primary-foreground shadow-[0_6px_20px_-8px_hsl(var(--primary)/0.6)]"
                  : "bg-white/60 dark:bg-white/5",
              )}
            >
              {m.content}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl bg-white/60 px-4 py-3 dark:bg-white/5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-white/30 p-3 dark:border-white/10"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask a question… (Enter to send, Shift+Enter for newline)"
          rows={1}
          disabled={loading}
          className="flex-1 resize-none rounded-xl border border-border bg-white/70 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none dark:bg-white/5"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </GlassCard>
  );
}
