import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Loader2, Sparkles } from "lucide-react";
import { apiPost } from "../../lib/api";
import type { SummarizeResponse, SummaryType } from "@lms/shared";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { cn } from "../../lib/cn";

const OPTIONS: Array<{ value: SummaryType; label: string }> = [
  { value: "brief", label: "Brief" },
  { value: "detailed", label: "Detailed" },
  { value: "bullet-points", label: "Bullets" },
];

export function AISummarizer({ content }: { content: string }) {
  const [summaryType, setSummaryType] = useState<SummaryType>("detailed");
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost<SummarizeResponse>("/ai/summarize", { content, summaryType });
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to summarize");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
  }

  return (
    <GlassCard>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <h3 className="font-serif text-xl font-semibold">AI Summary</h3>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setSummaryType(o.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              summaryType === o.value
                ? "bg-primary text-primary-foreground"
                : "bg-white/50 text-muted-foreground hover:text-foreground dark:bg-white/5",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      <Button onClick={generate} disabled={loading || !content} className="mt-4" size="sm">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? "Generating" : summary ? "Regenerate" : "Summarize"}
      </Button>

      {error && (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      )}

      <AnimatePresence mode="wait">
        {summary && (
          <motion.div
            key={summary}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="mt-5 rounded-xl bg-white/50 p-4 dark:bg-white/5"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Summary
              </span>
              <button
                onClick={copy}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{summary}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
