import {
  GoogleGenerativeAI,
  type GenerativeModel,
  type Content,
} from "@google/generative-ai";
import type { SummaryType } from "@lms/shared";

/**
 * Google Gemini-backed AI service.
 *
 * Behavior:
 *  - If `apiKey` is provided, calls `gemini-1.5-flash` (free tier).
 *  - If `apiKey` is missing, returns canned STUB responses so the app
 *    still demos without a key. The route shapes are identical.
 *
 * This is the only file you need to touch to swap AI providers.
 */

const MODEL = "gemini-1.5-flash";

export type QuizDifficulty = "beginner" | "medium" | "advanced";
export type AIQuestionType = "multiple-choice" | "true-false" | "short-answer";

export interface GenerateQuizOptions {
  content: string;
  questionCount?: number;
  difficulty?: QuizDifficulty;
  questionTypes?: AIQuestionType[];
}

export interface GeneratedQuiz {
  title: string;
  questions: Array<{
    questionText: string;
    questionType: AIQuestionType;
    options?: string[];
    correctAnswer: string;
    explanation: string;
    points: number;
  }>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  context?: string;
}

const LENGTH_GUIDE: Record<SummaryType, string> = {
  brief: "2-3 sentences",
  detailed: "1-2 paragraphs",
  "bullet-points": "5-7 bullet points",
};

export class AiService {
  private model: GenerativeModel | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      const client = new GoogleGenerativeAI(apiKey);
      this.model = client.getGenerativeModel({ model: MODEL });
    }
  }

  get isStubbed(): boolean {
    return this.model === null;
  }

  async summarizeContent(
    content: string,
    summaryType: SummaryType = "detailed",
  ): Promise<string> {
    if (!this.model) return stubSummary(content, summaryType);
    const prompt = buildSummarizePrompt(content, summaryType);
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      console.error("[ai] summarize failed:", err);
      throw new Error("Failed to generate summary");
    }
  }

  async generateQuiz(options: GenerateQuizOptions): Promise<GeneratedQuiz> {
    if (!this.model) return stubQuiz(options);
    const prompt = buildQuizPrompt(options);
    try {
      const result = await this.model.generateContent(prompt);
      return parseQuizJSON(result.response.text());
    } catch (err) {
      console.error("[ai] generateQuiz failed:", err);
      throw new Error("Failed to generate quiz");
    }
  }

  async chat(options: ChatOptions): Promise<string> {
    if (!this.model) return stubChat(options);
    if (options.messages.length === 0) return "";

    const lastMsg = options.messages.at(-1);
    if (!lastMsg) return "";

    const priorHistory: Content[] = options.messages.slice(0, -1).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    try {
      const chatSession = this.model.startChat({
        history: priorHistory,
        generationConfig: { maxOutputTokens: 1024 },
      });
      const system = buildTutorSystemPrompt(options.context);
      const prompt = `${system}\n\nStudent: ${lastMsg.content}`;
      const result = await chatSession.sendMessage(prompt);
      return result.response.text().trim();
    } catch (err) {
      console.error("[ai] chat failed:", err);
      throw new Error("Failed to get AI response");
    }
  }
}

// ── Prompt builders ─────────────────────────────────────────────────────────

function buildSummarizePrompt(content: string, summaryType: SummaryType): string {
  const length = LENGTH_GUIDE[summaryType];
  const format =
    summaryType === "bullet-points"
      ? "Format as bullet points beginning with '• '."
      : "Write in flowing prose.";
  return (
    `You are an expert educational summarizer. Produce a ${summaryType} summary of the material below.\n\n` +
    `MATERIAL:\n${content}\n\n` +
    `Requirements:\n` +
    `- Focus on key concepts and main ideas\n` +
    `- Use clear, simple language suitable for learners\n` +
    `- Highlight important terms and definitions\n` +
    `- Target length: ${length}\n` +
    `- ${format}\n\n` +
    `Output only the summary — no preamble, no trailing commentary.`
  );
}

function buildQuizPrompt(opts: GenerateQuizOptions): string {
  const count = opts.questionCount ?? 5;
  const difficulty = opts.difficulty ?? "medium";
  const types = (opts.questionTypes ?? ["multiple-choice", "true-false"]).join(", ");
  return (
    `You are an expert quiz creator. Generate exactly ${count} questions of ${difficulty} difficulty.\n\n` +
    `CONTENT:\n${opts.content}\n\n` +
    `Requirements:\n` +
    `- Question types to include: ${types}\n` +
    `- Each question tests understanding, not pure recall\n` +
    `- For multiple-choice: exactly 4 options, exactly one correct answer\n` +
    `- For true-false: statement + correct answer\n` +
    `- Include a clear explanation for why the answer is right\n\n` +
    `Output ONLY a valid JSON object — no markdown, no commentary — matching this schema:\n` +
    `{\n` +
    `  "title": "Quiz title based on the content",\n` +
    `  "questions": [\n` +
    `    {\n` +
    `      "questionText": "...",\n` +
    `      "questionType": "multiple-choice" | "true-false" | "short-answer",\n` +
    `      "options": ["A","B","C","D"],\n` +
    `      "correctAnswer": "B",\n` +
    `      "explanation": "...",\n` +
    `      "points": 10\n` +
    `    }\n` +
    `  ]\n` +
    `}`
  );
}

function buildTutorSystemPrompt(context?: string): string {
  const ctx = context ? `\n\nCurrent lesson context:\n${context}\n` : "";
  return (
    `You are an enthusiastic, patient, and knowledgeable AI tutor. Your goal is to help the learner ` +
    `understand the material through Socratic questioning and clear explanations.${ctx}\n\n` +
    `Teaching approach:\n` +
    `- Encourage and celebrate progress\n` +
    `- Break complex concepts into digestible pieces\n` +
    `- Use concrete examples and analogies\n` +
    `- If the student seems confused, try an alternative explanation\n` +
    `- Stay focused on educational topics\n` +
    `- Admit when you don't know something\n` +
    `- Respond naturally in a conversational tone`
  );
}

// ── JSON parser ─────────────────────────────────────────────────────────────

export function parseQuizJSON(text: string): GeneratedQuiz {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned) as GeneratedQuiz;
    if (!parsed.title || !Array.isArray(parsed.questions)) {
      throw new Error("Missing required fields");
    }
    return parsed;
  } catch (err) {
    console.error("[ai] parseQuizJSON failed:", err, "raw:", cleaned.slice(0, 200));
    throw new Error("Invalid quiz format from AI");
  }
}

// ── Stub fallbacks (no API key present) ─────────────────────────────────────

function stubSummary(content: string, summaryType: SummaryType): string {
  const preview = content.slice(0, 120).replace(/\s+/g, " ");
  if (summaryType === "brief") return `[STUB brief] This content covers: ${preview}…`;
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
    `It opens with "${preview}…" and develops them with examples.`
  );
}

function stubQuiz(options: GenerateQuizOptions): GeneratedQuiz {
  const count = options.questionCount ?? 5;
  return {
    title: "[STUB] Auto-generated Quiz",
    questions: Array.from({ length: count }, (_, i) => ({
      questionText: `[STUB] Sample question ${i + 1} about the provided content`,
      questionType: "multiple-choice" as const,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option B",
      explanation: "Option B is correct because the stub said so.",
      points: 10,
    })),
  };
}

function stubChat(options: ChatOptions): string {
  const last = options.messages.at(-1)?.content ?? "";
  const ctx = options.context ? ` (context: ${options.context.slice(0, 60)}…)` : "";
  return `[STUB tutor reply]${ctx} I hear you asking about "${last.slice(0, 80)}". Let's break it down step by step.`;
}
