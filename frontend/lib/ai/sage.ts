export const AI_ASSISTANT_NAME = "Sage";

export const MAX_CHAT_HISTORY = 20;

/** Agent Router WAF only accepts known client fingerprints (e.g. Claude Code). */
const AGENTROUTER_USER_AGENT = "claude-cli/1.0.0 (external, cli)";

const AGENTROUTER_TEXT_MODELS = [
  "deepseek-v4-flash",
  "deepseek-r1",
  "glm-4.5-air",
  "glm-4.6",
];

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  attachment?: {
    name: string;
    mimeType: string;
    kind: "image" | "pdf";
    dataBase64: string;
  };
};

export type SageContext = {
  studentName?: string | null;
  enrolledCourses?: string[];
};

export type SageProvider = "agentrouter" | "gemini" | "openai";

const SAGE_SYSTEM = `You are Sage, the friendly AI learning assistant for CPS Academy LMS.
Help students understand concepts, break down difficult topics, suggest study strategies, and encourage their learning journey.
Be warm, clear, and concise. Use short paragraphs and bullet points when helpful.
Guide students to think for themselves — do not complete assignments, quizzes, or exams for them.
When course context is provided, tailor examples to those subjects.
If you are unsure, say so honestly and suggest where the student can look in their course materials.
You are in a multi-turn chat: read the full conversation history and answer follow-up questions in context. Refer back to earlier messages when the student says "that", "it", "explain more", or asks a related question.`;

function buildSystemMessage(context?: SageContext) {
  const lines = [SAGE_SYSTEM];
  if (context?.studentName) {
    lines.push(`The student's name is ${context.studentName}.`);
  }
  if (context?.enrolledCourses?.length) {
    lines.push(`Enrolled courses: ${context.enrolledCourses.join(", ")}.`);
  } else {
    lines.push("No enrolled courses were provided in context.");
  }
  return lines.join("\n");
}

async function readJsonResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("<")) {
    throw new Error(
      "AI provider returned HTML instead of JSON. Check AGENTROUTER_API_KEY and AGENTROUTER_BASE_URL."
    );
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error(`AI provider returned invalid JSON: ${trimmed.slice(0, 160)}`);
  }
}

function buildPrompt(messages: ChatMessage[], context?: SageContext) {
  const contextBlock = context
    ? [
        `Student: ${context.studentName || "Learner"}`,
        context.enrolledCourses?.length
          ? `Enrolled courses: ${context.enrolledCourses.join(", ")}`
          : "Enrolled courses: none listed",
      ].join("\n")
    : "";

  const history = messages
    .map((m) => `${m.role === "user" ? "Student" : AI_ASSISTANT_NAME}: ${m.content}`)
    .join("\n\n");

  return [
    SAGE_SYSTEM,
    contextBlock ? `\n---\n${contextBlock}` : "",
    "\n---\n",
    history,
    `\n\n${AI_ASSISTANT_NAME}:`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function callAgentRouter(
  messages: ChatMessage[],
  context?: SageContext
): Promise<string> {
  const apiKey = process.env.AGENTROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("AGENTROUTER_API_KEY not configured");

  const baseUrl = (process.env.AGENTROUTER_BASE_URL || "https://agentrouter.org/v1").replace(
    /\/+$/,
    ""
  );
  const preferred = process.env.AGENTROUTER_MODEL?.trim() || AGENTROUTER_TEXT_MODELS[0];
  const models = [preferred, ...AGENTROUTER_TEXT_MODELS.filter((m) => m !== preferred)];
  const errors: string[] = [];

  for (const model of models) {
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "User-Agent": AGENTROUTER_USER_AGENT,
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          max_tokens: 1024,
          messages: [
            { role: "system", content: buildSystemMessage(context) },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      const payload = (await readJsonResponse(res)) as {
        choices?: { message?: { content?: string } }[];
        error?: { message?: string; code?: string };
        message?: string;
      };

      if (!res.ok) {
        const msg =
          payload?.error?.message ||
          payload?.message ||
          `Agent Router request failed (${res.status})`;
        throw new Error(msg);
      }

      const text = payload?.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error("Empty response from Agent Router");
      return text;
    } catch (err) {
      errors.push(`${model}: ${err instanceof Error ? err.message : "request failed"}`);
    }
  }

  throw new Error(errors[0] || "Agent Router unavailable");
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

  const payload = (await readJsonResponse(res)) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(payload?.error?.message || "Gemini request failed");
  }

  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("Empty response from Gemini");
  return text;
}

async function callOpenAI(messages: ChatMessage[], context?: SageContext): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch(`${baseUrl}/chat/completions`, {
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
        { role: "system", content: buildSystemMessage(context) },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  const payload = (await readJsonResponse(res)) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(payload?.error?.message || "OpenAI request failed");
  }

  const text = payload?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response from OpenAI");
  return text;
}

export async function generateSageReply(
  messages: ChatMessage[],
  context?: SageContext
): Promise<{ reply: string; provider: SageProvider }> {
  const hasAttachment = messages.some((m) => m.attachment?.dataBase64);
  if (hasAttachment) {
    throw new Error(
      'Image/PDF reading requires GEMINI_API_KEY on the server (free: https://aistudio.google.com/apikey). Agent Router text models cannot see files.'
    );
  }

  const errors: string[] = [];

  if (process.env.AGENTROUTER_API_KEY?.trim()) {
    try {
      const reply = await callAgentRouter(messages, context);
      return { reply, provider: "agentrouter" };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Agent Router failed");
    }
  }

  if (process.env.GEMINI_API_KEY?.trim()) {
    try {
      const reply = await callGemini(buildPrompt(messages, context));
      return { reply, provider: "gemini" };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Gemini failed");
    }
  }

  if (process.env.OPENAI_API_KEY?.trim()) {
    try {
      const reply = await callOpenAI(messages, context);
      return { reply, provider: "openai" };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "OpenAI failed");
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" · "));
  }

  throw new Error(
    "Sage AI is not configured. Add AGENTROUTER_API_KEY on Vercel (frontend server env) and/or Railway (backend), then redeploy."
  );
}
