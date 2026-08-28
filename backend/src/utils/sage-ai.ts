const AI_ASSISTANT_NAME = 'Sage';

const SAGE_SYSTEM = `You are Sage, the friendly AI learning assistant for CPS Academy LMS.
Help students understand concepts, break down difficult topics, suggest study strategies, and encourage their learning journey.
Be warm, clear, and concise. Use short paragraphs and bullet points when helpful.
Guide students to think for themselves — do not complete assignments, quizzes, or exams for them.
When course context is provided, tailor examples to those subjects.
If you are unsure, say so honestly and suggest where the student can look in their course materials.
You are in a multi-turn chat: read the full conversation history and answer follow-up questions in context.`;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

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

async function callAgentRouter(messages: ChatMessage[], context?: SageContext) {
  const apiKey = process.env.AGENTROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('AGENTROUTER_API_KEY is not set on the server');
  }

  const baseUrl = (process.env.AGENTROUTER_BASE_URL || 'https://agentrouter.org/v1').replace(
    /\/+$/,
    ''
  );
  const model = process.env.AGENTROUTER_MODEL || 'deepseek-v4-flash';

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: buildSystemMessage(context) },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
    message?: string;
  };

  if (!res.ok) {
    throw new Error(
      payload.error?.message || payload.message || `Agent Router failed (${res.status})`
    );
  }

  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty response from Agent Router');
  return text;
}

export async function generateSageReply(
  messages: ChatMessage[],
  context?: SageContext
): Promise<{ reply: string; provider: string; assistantName: string }> {
  const reply = await callAgentRouter(messages, context);
  return { reply, provider: 'agentrouter', assistantName: AI_ASSISTANT_NAME };
}
