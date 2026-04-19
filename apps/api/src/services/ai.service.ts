import type { SummaryType } from "@lms/shared";

/**
 * Phase 1 STUB. Returns canned responses so the frontend and routes can be
 * built against the real shape before wiring Google Gemini.
 *
 * Phase 2 will replace the bodies with real `@google/generative-ai` calls
 * using `gemini-1.5-flash` (free tier). The class shape stays identical —
 * swapping providers is a one-file change.
 */

export interface GenerateQuizOptions {
  content: string;
  questionCount?: number;
  difficulty?: "beginner" | "medium" | "advanced";
  questionTypes?: Array<"multiple-choice" | "true-false" | "short-answer">;
}

export interface ChatOptions {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  context?: string;
}

export interface StubGeneratedQuiz {
  title: string;
  questions: Array<{
    questionText: string;
    questionType: "multiple-choice" | "true-false" | "short-answer";
    options?: string[];
    correctAnswer: string;
    explanation: string;
    points: number;
  }>;
}

export class AiService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly _apiKey?: string) {}

  async summarizeContent(content: string, summaryType: SummaryType = "detailed"): Promise<string> {
    const preview = content.slice(0, 120).replace(/\s+/g, " ");
    if (summaryType === "brief") {
      return `[STUB brief] This content covers: ${preview}…`;
    }
    if (summaryType === "bullet-points") {
      return [
        "• Key concept #1 from the provided content",
        "• Key concept #2 from the provided content",
        "• Key concept #3 from the provided content",
        "• How these concepts connect",
        "• Suggested next steps for the learner",
      ].join("\n");
    }
    return (
      `[STUB detailed] The provided material introduces several key ideas. ` +
      `It opens with "${preview}…" and develops them with examples. ` +
      `A learner should walk away understanding the core terminology, the ` +
      `relationships between concepts, and how to apply them in practice.`
    );
  }

  async generateQuiz(options: GenerateQuizOptions): Promise<StubGeneratedQuiz> {
    const count = options.questionCount ?? 5;
    const questions: StubGeneratedQuiz["questions"] = Array.from({ length: count }, (_, i) => ({
      questionText: `[STUB] Sample question ${i + 1} about the provided content`,
      questionType: "multiple-choice",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option B",
      explanation: "Option B is correct because the stub said so.",
      points: 10,
    }));
    return {
      title: "[STUB] Auto-generated Quiz",
      questions,
    };
  }

  async chat(options: ChatOptions): Promise<string> {
    const last = options.messages.at(-1)?.content ?? "";
    const ctx = options.context ? ` (context: ${options.context.slice(0, 60)}…)` : "";
    return `[STUB tutor reply]${ctx} I hear you asking about "${last.slice(0, 80)}". Let's break it down step by step.`;
  }
}
