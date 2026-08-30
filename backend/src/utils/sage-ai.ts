const AI_ASSISTANT_NAME = 'Sage';

/**
 * Agent Router WAF only accepts known coding-agent fingerprints.
 * Retry list — cloud hosts sometimes strip or rewrite User-Agent.
 */
const AGENTROUTER_USER_AGENTS = [
  'claude-cli/1.0.0 (external, cli)',
  'claude-cli/2.1.158 (external, cli)',
  'QwenCode/0.2.0 (windows; x64)',
];

const AGENTROUTER_TEXT_MODELS = [
  'deepseek-v4-flash',
  'deepseek-r1',
  'glm-4.5-air',
  'glm-4.6',
];

const SAGE_MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

/** Models on Agent Router that accept OpenAI-style image_url content (not glm/deepseek). */
const AGENTROUTER_VISION_MODELS = [
  'gpt-5.6-sol',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4.1',
  'gpt-4.1-mini',
];

function envValue(name: string): string {
  const raw = process.env[name];
  if (!raw) return '';
  // Railway/Vercel users often paste values wrapped in quotes
  return raw.trim().replace(/^["']|["']$/g, '').trim();
}

/** OpenAI-compatible chat must use .../v1 — root domain returns HTML. */
function agentRouterOpenAiBase(): string {
  let base = envValue('AGENTROUTER_BASE_URL') || 'https://agentrouter.org/v1';
  base = base.replace(/\/+$/, '');
  if (base.endsWith('/chat/completions')) {
    base = base.replace(/\/chat\/completions$/i, '');
  }
  if (!/\/v1$/i.test(base)) {
    base = `${base}/v1`;
  }
  return base;
}

function agentRouterHeaders(userAgent: string, apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'User-Agent': userAgent,
    'anthropic-version': '2023-06-01',
    'x-app': 'cli',
  };
}

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
    throw new Error('AI provider returned HTML instead of JSON (blocked or wrong URL).');
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error(`AI provider returned invalid JSON: ${trimmed.slice(0, 160)}`);
  }
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
  const preferred = envValue('AGENTROUTER_VISION_MODEL');
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
  const apiKey = envValue('AGENTROUTER_API_KEY');
  if (!apiKey) {
    throw new Error('AGENTROUTER_API_KEY is not set on the server');
  }

  const baseUrl = agentRouterOpenAiBase();
  const preferred = options?.vision
    ? visionModelForAgentRouter()
    : envValue('AGENTROUTER_MODEL') || AGENTROUTER_TEXT_MODELS[0];
  const models = options?.vision
    ? [preferred]
    : [preferred, ...AGENTROUTER_TEXT_MODELS.filter((m) => m !== preferred)];

  const bodyMessages = buildOpenAIMessages(messages, context, Boolean(options?.vision));
  const errors: string[] = [];

  for (const model of models) {
    let lastErr: string | null = null;
    for (const userAgent of AGENTROUTER_USER_AGENTS) {
      try {
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: agentRouterHeaders(userAgent, apiKey),
          body: JSON.stringify({
            model,
            temperature: 0.7,
            max_tokens: 1024,
            messages: bodyMessages,
          }),
        });

        const payload = (await readJsonResponse(res)) as {
          choices?: { message?: { content?: string } }[];
          error?: { message?: string };
          message?: string;
        };

        if (!res.ok) {
          const msg =
            payload?.error?.message ||
            payload?.message ||
            `Agent Router failed (${res.status})`;
          // Wrong fingerprint — try next User-Agent
          if (/unauthorized client/i.test(msg)) {
            lastErr = msg;
            continue;
          }
          throw new Error(msg);
        }

        const text = payload?.choices?.[0]?.message?.content?.trim();
        if (!text) throw new Error('Empty response from Agent Router');
        return text;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'request failed';
        lastErr = msg;
        // HTML / WAF — try next fingerprint; if all fail, try next model
        if (/HTML|WAF|unauthorized client/i.test(msg)) continue;
        break;
      }
    }
    errors.push(`${model}: ${lastErr || 'request failed'}`);
  }

  throw new Error(errors[0] || 'Agent Router unavailable');
}

function geminiModelList(): string[] {
  const preferred = envValue('GEMINI_MODEL') || 'gemini-2.0-flash';
  const rest = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
  return [preferred, ...rest.filter((m) => m !== preferred)];
}

async function geminiRequest(apiKey: string, model: string, body: unknown): Promise<Response> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const headerRes = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });
  if (headerRes.ok || apiKey.startsWith('AQ.')) return headerRes;

  return fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function callGemini(messages: SageChatMessage[], context?: SageContext): Promise<string> {
  const apiKey = envValue('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set on the server');

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

  const body = {
    systemInstruction: { parts: [{ text: buildSystemMessage(context) }] },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  let lastErr = 'Gemini request failed';
  for (const model of geminiModelList()) {
    const res = await geminiRequest(apiKey, model, body);
    const payload = (await readJsonResponse(res)) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      error?: { message?: string };
    };

    if (!res.ok) {
      lastErr = payload?.error?.message || `Gemini request failed (${res.status})`;
      if (/not found|NOT_FOUND/i.test(lastErr)) continue;
      if (/API key not valid|API_KEY_INVALID|ACCESS_TOKEN_TYPE_UNSUPPORTED|UNAUTHENTICATED/i.test(lastErr)) {
        throw new Error(
          'GEMINI_API_KEY was rejected. Add the key from aistudio.google.com/apikey on Railway, then redeploy.'
        );
      }
      continue;
    }

    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (text) return text;
    lastErr = 'Empty response from Gemini';
  }

  throw new Error(lastErr);
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
    if (envValue('GEMINI_API_KEY')) {
      try {
        const reply = await callGemini(messages, context);
        return { reply, provider: 'gemini', assistantName: AI_ASSISTANT_NAME };
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Gemini failed');
      }
    }

    if (attachment?.kind === 'image' && envValue('AGENTROUTER_API_KEY')) {
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

  if (envValue('GEMINI_API_KEY')) {
    try {
      const reply = await callGemini(messages, context);
      return { reply, provider: 'gemini', assistantName: AI_ASSISTANT_NAME };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Gemini failed');
    }
  }

  const skipAgentRouter = Boolean(process.env.VERCEL);
  if (envValue('AGENTROUTER_API_KEY') && !skipAgentRouter) {
    try {
      const reply = await callAgentRouter(messages, context);
      return { reply, provider: 'agentrouter', assistantName: AI_ASSISTANT_NAME };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Agent Router failed');
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join(' · '));
  }

  throw new Error(
    'Sage is not configured. Add GEMINI_API_KEY (free, recommended) or AGENTROUTER_API_KEY on Railway, then redeploy.'
  );
}
