const AI_ASSISTANT_NAME = 'Sage';

/** Agent Router WAF only accepts known client fingerprints (e.g. Claude Code). */
const AGENTROUTER_USER_AGENT = 'claude-cli/1.0.0 (external, cli)';

const SAGE_MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

/** Models on Agent Router that accept OpenAI-style image_url content (not glm/deepseek). */
const AGENTROUTER_VISION_MODELS = [
  'gpt-5.6-sol',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4.1',
  'gpt-4.1-mini',
];

const SAGE_SYSTEM = `You are Sage, the friendly AI learning assistant for CPS Academy LMS.
Help students understand concepts, break down difficult topics, suggest study strategies, and encourage their learning journey.
Be warm, clear, and concise. Use short paragraphs and bullet points when helpful.
Guide students to think for themselves — do not complete assignments, quizzes, or exams for them.
When course context is provided, tailor examples to those subjects.
When the student shares an image or PDF, describe what you see and explain it in learner-friendly language.
If you are unsure, say so honestly and suggest where the student can look in their course materials.
You are in a multi-turn chat: read the full conversation history and answer follow-up questions in context.`;

export type SageAttachment = {
  name: string;
  mimeType: string;
  kind: 'image' | 'pdf';
  dataBase64: string;
};

export type SageChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  attachment?: SageAttachment;
};

type SageContext = {
  studentName?: string | null;
  enrolledCourses?: string[];
};

function buildSystemMessage(context?: SageContext) {
  const lines = [SAGE_SYSTEM];
  if (context?.studentName) {
    lines.push(`The student's name is ${context.studentName}.`);
  }
  if (context?.enrolledCourses?.length) {
    lines.push(`Enrolled courses: ${context.enrolledCourses.join(', ')}.`);
  }
  return lines.join('\n');
}

async function readJsonResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('<')) {
    throw new Error(
      'AI provider returned HTML instead of JSON. Verify AGENTROUTER_API_KEY and AGENTROUTER_BASE_URL on the server, then redeploy.'
    );
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error(`AI provider returned invalid JSON: ${trimmed.slice(0, 160)}`);
  }
}

function fallbackReply(messages: SageChatMessage[], context?: SageContext): string {
  const lastUser =
    [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const lastLower = lastUser.toLowerCase();
  const courseHint = context?.enrolledCourses?.[0];
  const name = AI_ASSISTANT_NAME;

  if (lastLower.includes('hello') || lastLower.includes('hi')) {
    return `Hi${context?.studentName ? ` ${String(context.studentName).split(' ')[0]}` : ''}! I'm ${name}, your CPS Academy learning assistant. What would you like to explore today?`;
  }
  if (lastLower.includes('study') || lastLower.includes('learn')) {
    return `Great mindset! Try this:\n\n• Skim lesson headings first, then read or watch actively.\n• Write one question per section.\n• Explain the idea out loud in 60 seconds.\n\n${courseHint ? `Want help with ${courseHint}? Tell me the topic or module.` : 'Tell me which course you are working on.'}`;
  }
  if (lastLower.includes('quiz') || lastLower.includes('exam') || lastLower.includes('test')) {
    return `For quizzes, focus on understanding why an answer is correct:\n\n• Review missed questions from past attempts.\n• Make a short cheat sheet of key rules.\n• Practice explaining each concept without notes.\n\nI can help you study — I will not solve graded work for you.`;
  }

  return `I'm ${name}, here to help you learn step by step. You asked about "${lastUser || 'your topic'}".\n\nTry breaking it into:\n1. What you already know\n2. What is confusing\n3. One small example to test your understanding\n\n${courseHint ? `Since you are enrolled in ${courseHint}, share a lesson name for more specific help.` : 'Share your course or lesson name for tailored guidance.'}`;
}

function findLastUserAttachmentIndex(messages: SageChatMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user' && messages[i].attachment) return i;
  }
  return -1;
}

function lastUserAttachment(messages: SageChatMessage[]): SageAttachment | undefined {
  const index = findLastUserAttachmentIndex(messages);
  return index >= 0 ? messages[index].attachment : undefined;
}

function normalizeAttachment(attachment: SageAttachment): SageAttachment {
  const size = Buffer.byteLength(attachment.dataBase64, 'base64');
  if (size > SAGE_MAX_ATTACHMENT_BYTES) {
    throw new Error('File too large for Sage (max 4MB). Try a smaller image or PDF.');
  }
  const mime = attachment.mimeType.toLowerCase();
  const isImage = mime.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(attachment.name);
  const isPdf = mime === 'application/pdf' || attachment.name.toLowerCase().endsWith('.pdf');
  if (!isImage && !isPdf) {
    throw new Error('Sage only accepts images and PDF files.');
  }
  return {
    ...attachment,
    kind: isPdf ? 'pdf' : 'image',
  };
}

function visionModelForAgentRouter() {
  const preferred = process.env.AGENTROUTER_VISION_MODEL?.trim();
  if (preferred && AGENTROUTER_VISION_MODELS.includes(preferred)) {
    return preferred;
  }
  return AGENTROUTER_VISION_MODELS[0];
}

function buildOpenAIMessages(
  messages: SageChatMessage[],
  context?: SageContext,
  withVision = false
) {
  const lastAttachmentId = findLastUserAttachmentIndex(messages);

  return [
    { role: 'system', content: buildSystemMessage(context) },
    ...messages.map((m, index) => {
      const attachment =
        withVision && m.role === 'user' && m.attachment && index === lastAttachmentId
          ? normalizeAttachment(m.attachment)
          : null;

      if (attachment?.kind === 'image') {
        const text =
          m.content.trim() ||
          'Please explain what you see in this image in simple study-friendly terms.';
        return {
          role: 'user',
          content: [
            { type: 'text', text },
            {
              type: 'image_url',
              image_url: {
                url: `data:${attachment.mimeType};base64,${attachment.dataBase64}`,
              },
            },
          ],
        };
      }

      const suffix =
        m.attachment && index !== lastAttachmentId
          ? ` [shared ${m.attachment.kind}: ${m.attachment.name}]`
          : '';
      return { role: m.role, content: `${m.content}${suffix}`.trim() };
    }),
  ];
}

async function callAgentRouter(
  messages: SageChatMessage[],
  context?: SageContext,
  options?: { vision?: boolean }
) {
  const apiKey = process.env.AGENTROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('AGENTROUTER_API_KEY is not set on the server');
  }

  const baseUrl = (process.env.AGENTROUTER_BASE_URL || 'https://agentrouter.org/v1').replace(
    /\/+$/,
    ''
  );
  const model = options?.vision
    ? visionModelForAgentRouter()
    : process.env.AGENTROUTER_MODEL || 'deepseek-v4-flash';

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'User-Agent': AGENTROUTER_USER_AGENT,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 1024,
      messages: buildOpenAIMessages(messages, context, Boolean(options?.vision)),
    }),
  });

  const payload = (await readJsonResponse(res)) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
    message?: string;
  };

  if (!res.ok) {
    throw new Error(
      payload?.error?.message || payload?.message || `Agent Router failed (${res.status})`
    );
  }

  const text = payload?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty response from Agent Router');
  return text;
}

async function callGemini(messages: SageChatMessage[], context?: SageContext): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set on the server');

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const lastAttachmentId = findLastUserAttachmentIndex(messages);

  const contents = messages.map((m, index) => {
    const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];
    const text = m.content?.trim();
    if (text) parts.push({ text });

    if (m.role === 'user' && m.attachment && index === lastAttachmentId) {
      const attachment = normalizeAttachment(m.attachment);
      parts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.dataBase64,
        },
      });
      if (!text) {
        parts.unshift({
          text: 'Please explain what you see in this file in simple study-friendly terms.',
        });
      }
    } else if (m.attachment) {
      parts.push({ text: `[Student shared ${m.attachment.kind}: ${m.attachment.name}]` });
    }

    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts,
    };
  });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemMessage(context) }] },
        contents,
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
    throw new Error(payload?.error?.message || 'Gemini request failed');
  }

  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

const VISION_SETUP_HINT =
  'To read images/PDFs, add GEMINI_API_KEY on Railway (free key: https://aistudio.google.com/apikey). Agent Router models like deepseek-v4-flash and glm-5.3 are text-only.';

export async function generateSageReply(
  messages: SageChatMessage[],
  context?: SageContext
): Promise<{ reply: string; provider: string; assistantName: string }> {
  const attachment = lastUserAttachment(messages);
  if (attachment) normalizeAttachment(attachment);

  const hasVision = Boolean(attachment);
  const errors: string[] = [];

  if (hasVision) {
    if (process.env.GEMINI_API_KEY?.trim()) {
      try {
        const reply = await callGemini(messages, context);
        return { reply, provider: 'gemini', assistantName: AI_ASSISTANT_NAME };
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Gemini failed');
      }
    }

    if (attachment?.kind === 'image' && process.env.AGENTROUTER_API_KEY?.trim()) {
      try {
        const reply = await callAgentRouter(messages, context, { vision: true });
        return { reply, provider: 'agentrouter-vision', assistantName: AI_ASSISTANT_NAME };
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Agent Router vision failed');
      }
    }

    throw new Error(
      errors[0]
        ? `${errors[0]} ${VISION_SETUP_HINT}`
        : VISION_SETUP_HINT
    );
  }

  if (process.env.AGENTROUTER_API_KEY?.trim()) {
    try {
      const reply = await callAgentRouter(messages, context);
      return { reply, provider: 'agentrouter', assistantName: AI_ASSISTANT_NAME };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Agent Router failed');
    }
  }

  if (process.env.GEMINI_API_KEY?.trim()) {
    try {
      const reply = await callGemini(messages, context);
      return { reply, provider: 'gemini', assistantName: AI_ASSISTANT_NAME };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Gemini failed');
    }
  }

  return {
    reply: fallbackReply(messages, context),
    provider: 'fallback',
    assistantName: AI_ASSISTANT_NAME,
  };
}
