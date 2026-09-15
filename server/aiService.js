// NVIDIA NIM AI Service using Meta Llama 3.2
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const DEFAULT_MODEL = 'meta/llama-3.2-11b-vision-instruct';

export async function callNvidiaAI(messages, options = {}) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY is not configured in server/.env');
  }

  const model = options.model || DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.3;
  const max_tokens = options.max_tokens ?? 1024;

  const response = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`NVIDIA API returned ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Generate subtasks and implementation guide
export async function generateTaskBreakdown(title, description = '') {
  const systemPrompt = `You are Nexus AI, a senior full-stack software architect.
Given a task title and optional description, return a JSON object with:
1. "summary": Brief explanation of the technical approach.
2. "subtasks": Array of 3-5 structured subtasks, each with "title", "description", and "priority" ("high" | "medium" | "low").
3. "codeSnippet": An optional brief code snippet or terminal command if applicable.

Return ONLY valid JSON matching this schema, with NO markdown code block wrappers around the JSON:
{
  "summary": "...",
  "subtasks": [
    { "title": "...", "description": "...", "priority": "high" }
  ],
  "codeSnippet": "..."
}`;

  const userPrompt = `Task Title: "${title}"\nTask Context: "${description}"`;

  try {
    const rawContent = await callNvidiaAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.2 });

    // Sanitize JSON output (strip ```json and ``` if present)
    const sanitized = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(sanitized);
  } catch (err) {
    console.error('Error generating AI breakdown:', err.message);
    // Intelligent local fallback if API fails
    return {
      summary: `Automated architecture breakdown for "${title}"`,
      subtasks: [
        { title: `Design interface & contracts for ${title}`, description: 'Define API models, schema validation, and props', priority: 'high' },
        { title: `Implement core logic for ${title}`, description: 'Build functional components and backend endpoints', priority: 'medium' },
        { title: `Write tests & verify ${title}`, description: 'Run end-to-end and integration verification tests', priority: 'low' }
      ],
      codeSnippet: `// Example stub for ${title}\nexport const handler = async () => {\n  console.log('Executing ${title}');\n};`
    };
  }
}

// Autofill task fields from a quick prompt
export async function autofillTask(prompt) {
  const systemPrompt = `You are Nexus AI. Given a quick idea or feature prompt, convert it into a structured task definition.
Return ONLY valid JSON with no markdown formatting:
{
  "title": "Clear, concise task title (max 8 words)",
  "description": "Detailed explanation of requirements and deliverables (1-2 sentences)",
  "priority": "high" | "medium" | "low",
  "category": "Frontend" | "Backend" | "Database" | "Architecture" | "DevOps"
}`;

  try {
    const rawContent = await callNvidiaAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], { temperature: 0.3 });

    const sanitized = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(sanitized);
  } catch (err) {
    console.error('Error in AI autofill:', err.message);
    return {
      title: prompt.slice(0, 40),
      description: `Implement and configure ${prompt}`,
      priority: 'medium',
      category: 'Frontend'
    };
  }
}

// AI Copilot conversational assistant
export async function chatCopilot(messages) {
  const systemMessage = {
    role: 'system',
    content: `You are Nexus AI Copilot, an expert AI assistant embedded in a React 19 and Node.js Express full-stack application.
You are powered by NVIDIA NIM (Meta Llama 3.2).
Help developers design architectures, write clean code, troubleshoot issues, and manage project tasks.
Keep responses concise, helpful, and cleanly formatted in Markdown.`
  };

  const formattedMessages = [
    systemMessage,
    ...messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }))
  ];

  return await callNvidiaAI(formattedMessages, { temperature: 0.6, max_tokens: 800 });
}
