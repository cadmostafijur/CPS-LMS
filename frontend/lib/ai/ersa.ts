export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ErsaContext = {
  studentName?: string | null;
  enrolledCourses?: string[];
};

const ERSA_SYSTEM = `You are Ersa, the friendly AI learning assistant for CPS Academy LMS.
Help students understand concepts, break down difficult topics, suggest study strategies, and encourage their learning journey.
Be warm, clear, and concise. Use short paragraphs and bullet points when helpful.
Guide students to think for themselves — do not complete assignments, quizzes, or exams for them.
When course context is provided, tailor examples to those subjects.
If you are unsure, say so honestly and suggest where the student can look in their course materials.`;

function buildPrompt(messages: ChatMessage[], context?: ErsaContext) {
  const contextBlock = context
    ? [
        `Student: ${context.studentName || "Learner"}`,
        context.enrolledCourses?.length
          ? `Enrolled courses: ${context.enrolledCourses.join(", ")}`
          : "Enrolled courses: none listed",
      ].join("\n")
    : "";

  const history = messages
    .map((m) => `${m.role === "user" ? "Student" : "Ersa"}: ${m.content}`)
    .join("\n\n");

  return [ERSA_SYSTEM, contextBlock ? `\n---\n${contextBlock}` : "", "\n---\n", history, "\n\nErsa:"]
    .filter(Boolean)
    .join("\n");
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  const payload = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(payload.error?.message || "Gemini request failed");
  }

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("Empty response from Gemini");
  return text;
}

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 1024,
      messages: [
        { role: "system", content: ERSA_SYSTEM },
        { role: "user", content: prompt },
      ],
    }),
  });

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(payload.error?.message || "OpenAI request failed");
  }

  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response from OpenAI");
  return text;
}

function fallbackReply(messages: ChatMessage[], context?: ErsaContext): string {
  const last = [...messages].reverse().find((m) => m.role === "user")?.content.toLowerCase() || "";
  const courseHint = context?.enrolledCourses?.[0];

  if (last.includes("hello") || last.includes("hi")) {
    return `Hi${context?.studentName ? ` ${context.studentName.split(" ")[0]}` : ""}! I'm Ersa, your CPS Academy learning assistant. What would you like to explore today?`;
  }
  if (last.includes("study") || last.includes("learn")) {
    return `Great mindset! Try this:\n\n• Skim the lesson headings first, then watch or read actively.\n• Write one question per section before moving on.\n• Teach the idea out loud in 60 seconds — if you get stuck, that's your review target.\n\n${courseHint ? `Want help with ${courseHint} specifically? Tell me the topic or module.` : "Tell me which course or topic you're working on."}`;
  }
  if (last.includes("quiz") || last.includes("exam") || last.includes("test")) {
    return `For quizzes, focus on understanding *why* an answer is correct:\n\n• Review missed questions from past attempts.\n• Make a tiny cheat sheet of formulas or rules (for study only).\n• Practice explaining each concept without looking at notes.\n\nI can quiz you with practice questions if you share the topic — I won't solve graded work for you.`;
  }

  return `I'm Ersa, here to help you learn step by step. You asked about "${messages[messages.length - 1]?.content || "your topic"}".\n\nTry breaking it into:\n1. What you already know\n2. What's confusing\n3. One small example to test your understanding\n\n${courseHint ? `Since you're enrolled in ${courseHint}, I can relate examples to that course if you share the lesson name.` : "Share your course or lesson name for more tailored guidance."}\n\nNote: Add GEMINI_API_KEY or OPENAI_API_KEY on the server for full AI answers.`;
}

export async function generateErsaReply(
  messages: ChatMessage[],
  context?: ErsaContext
): Promise<{ reply: string; provider: "gemini" | "openai" | "fallback" }> {
  const prompt = buildPrompt(messages, context);

  if (process.env.GEMINI_API_KEY) {
    try {
      const reply = await callGemini(prompt);
      return { reply, provider: "gemini" };
    } catch {
      /* try next provider */
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const reply = await callOpenAI(prompt);
      return { reply, provider: "openai" };
    } catch {
      /* use fallback */
    }
  }

  return { reply: fallbackReply(messages, context), provider: "fallback" };
}
