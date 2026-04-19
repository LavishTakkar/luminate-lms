import { describe, expect, it } from "vitest";
import { parseQuizJSON } from "../src/services/ai.service.js";

describe("parseQuizJSON", () => {
  it("parses a clean JSON payload", () => {
    const input = JSON.stringify({
      title: "Basics",
      questions: [
        {
          questionText: "Is TS typed?",
          questionType: "true-false",
          correctAnswer: "True",
          explanation: "It has a static type system.",
          points: 10,
        },
      ],
    });
    const quiz = parseQuizJSON(input);
    expect(quiz.title).toBe("Basics");
    expect(quiz.questions).toHaveLength(1);
  });

  it("strips ```json ... ``` fences that Gemini often wraps", () => {
    const wrapped = "```json\n" +
      JSON.stringify({ title: "Fenced", questions: [] }) +
      "\n```";
    const quiz = parseQuizJSON(wrapped);
    expect(quiz.title).toBe("Fenced");
    expect(quiz.questions).toEqual([]);
  });

  it("throws a descriptive error on malformed JSON", () => {
    expect(() => parseQuizJSON("not json at all")).toThrow(/Invalid quiz format/);
  });

  it("throws when required fields are missing", () => {
    expect(() => parseQuizJSON(JSON.stringify({ title: "Only title" }))).toThrow(
      /Invalid quiz format/,
    );
  });
});
