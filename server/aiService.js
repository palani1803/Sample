// Multi-Provider Free LLM AI Service
// Supports: NVIDIA NIM, Groq, OpenRouter, Google Gemini, Cerebras

export const SUPPORTED_MODELS = [
  // --- NVIDIA NIM (Pre-configured) ---
  {
    id: 'meta/llama-3.2-11b-vision-instruct',
    name: 'Llama 3.2 11B Vision',
    provider: 'NVIDIA NIM',
    badge: 'Active Default',
    description: 'Fast multimodal model with vision, tasks & chat'
  },
  {
    id: 'meta/llama-3.2-90b-vision-instruct',
    name: 'Llama 3.2 90B Vision',
    provider: 'NVIDIA NIM',
    badge: 'High Intelligence',
    description: 'Deep multimodal reasoning & analysis'
  },
  {
    id: 'mistralai/codestral-22b-instruct-v0.1',
    name: 'Codestral 22B',
    provider: 'NVIDIA NIM',
    badge: 'Code Specialist',
    description: 'Dedicated model for programming & system design'
  },

  // --- Groq (Ultra-Fast Free Tier) ---
  {
    id: 'groq/llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'Groq',
    badge: '⚡ 500 tok/s',
    description: 'Top-tier Llama model running at extreme speed on Groq LPU'
  },
  {
    id: 'groq/deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 70B',
    provider: 'Groq',
    badge: 'Reasoning',
    description: 'Deep reasoning chain-of-thought running on Groq LPU'
  },
  {
    id: 'groq/llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    provider: 'Groq',
    badge: '⚡ 800 tok/s',
    description: 'Instant response time for real-time applications'
  },
  {
    id: 'groq/qwen-2.5-32b',
    name: 'Qwen 2.5 32B',
    provider: 'Groq',
    badge: 'Code & Math',
    description: 'Exceptional open model for technical problem solving'
  },

  // --- OpenRouter (Free Router Catalog) ---
  {
    id: 'openrouter/deepseek/deepseek-r1:free',
    name: 'DeepSeek R1 (Free)',
    provider: 'OpenRouter',
    badge: 'Free Tier',
    description: 'Full DeepSeek R1 671B reasoning on OpenRouter'
  },
  {
    id: 'openrouter/meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B (Free)',
    provider: 'OpenRouter',
    badge: 'Free Tier',
    description: 'High performance open weights on OpenRouter free router'
  },
  {
    id: 'openrouter/google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash Exp (Free)',
    provider: 'OpenRouter',
    badge: 'Free Tier',
    description: 'Google next-gen experimental flash model'
  },
  {
    id: 'openrouter/qwen/qwen-2.5-coder-32b-instruct:free',
    name: 'Qwen 2.5 Coder 32B (Free)',
    provider: 'OpenRouter',
    badge: 'Code Free',
    description: 'Dedicated coding model with 32k context'
  },

  // --- Google Gemini (AI Studio Free Tier) ---
  {
    id: 'gemini/gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google Gemini',
    badge: '1M Context',
    description: 'Google high-speed multimodal model with massive context'
  },
  {
    id: 'gemini/gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google Gemini',
    badge: 'Fast & Free',
    description: 'Standard workhorse model on Google AI Studio'
  },

  // --- Cerebras (Wafer-Scale Inference) ---
  {
    id: 'cerebras/llama3.3-70b',
    name: 'Llama 3.3 70B (Cerebras)',
    provider: 'Cerebras',
    badge: '1M Tokens/Day',
    description: 'High throughput wafer-scale compute engine'
  }
];

// Determine endpoint, API key, and target model identifier
function resolveProvider(modelId) {
  // Groq models
  if (modelId.startsWith('groq/')) {
    const rawModel = modelId.replace('groq/', '');
    return {
      url: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: process.env.GROQ_API_KEY,
      model: rawModel,
      name: 'Groq',
      requiresKeyEnv: 'GROQ_API_KEY'
    };
  }

  // OpenRouter models
  if (modelId.startsWith('openrouter/')) {
    const rawModel = modelId.replace('openrouter/', '');
    return {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: process.env.OPENROUTER_API_KEY,
      model: rawModel,
      name: 'OpenRouter',
      requiresKeyEnv: 'OPENROUTER_API_KEY'
    };
  }

  // Google Gemini models (OpenAI-compatible endpoint)
  if (modelId.startsWith('gemini/')) {
    const rawModel = modelId.replace('gemini/', '');
    return {
      url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      apiKey: process.env.GEMINI_API_KEY,
      model: rawModel,
      name: 'Google Gemini',
      requiresKeyEnv: 'GEMINI_API_KEY'
    };
  }

  // Cerebras models
  if (modelId.startsWith('cerebras/')) {
    const rawModel = modelId.replace('cerebras/', '');
    return {
      url: 'https://api.cerebras.ai/v1/chat/completions',
      apiKey: process.env.CEREBRAS_API_KEY,
      model: rawModel,
      name: 'Cerebras',
      requiresKeyEnv: 'CEREBRAS_API_KEY'
    };
  }

  // Default: NVIDIA NIM
  return {
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    apiKey: process.env.NVIDIA_API_KEY,
    model: modelId || process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct',
    name: 'NVIDIA NIM',
    requiresKeyEnv: 'NVIDIA_API_KEY'
  };
}

export async function callNvidiaAI(messages, options = {}) {
  const requestedModel = options.model || process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct';
  const providerConfig = resolveProvider(requestedModel);
  const temperature = options.temperature ?? 0.3;
  const max_tokens = options.max_tokens ?? 1024;

  let response = null;

  // If provider API key exists, call that provider
  if (providerConfig.apiKey) {
    try {
      response = await fetch(providerConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providerConfig.apiKey}`
        },
        body: JSON.stringify({
          model: providerConfig.model,
          messages,
          temperature,
          max_tokens
        })
      });
    } catch (err) {
      console.warn(`[AI Hub] Request to ${providerConfig.name} failed (${err.message}). Triggering fallback...`);
    }
  } else {
    console.info(`[AI Hub] ${providerConfig.requiresKeyEnv} not set in server/.env for ${providerConfig.name}. Using default NVIDIA NIM model...`);
  }

  // If call failed or no key for selected provider, fallback smoothly to NVIDIA NIM
  if (!response || !response.ok) {
    const nvidiaKey = process.env.NVIDIA_API_KEY;
    if (!nvidiaKey) {
      throw new Error(`Neither ${providerConfig.name} (${providerConfig.requiresKeyEnv}) nor NVIDIA_API_KEY is configured in server/.env`);
    }

    response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nvidiaKey}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.2-11b-vision-instruct',
        messages,
        temperature,
        max_tokens
      })
    });
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API returned ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Generate subtasks and implementation guide
export async function generateTaskBreakdown(title, description = '', options = {}) {
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
    ], { temperature: 0.2, ...options });

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
export async function autofillTask(prompt, options = {}) {
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
    ], { temperature: 0.3, ...options });

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
export async function chatCopilot(messages, options = {}) {
  const selectedModelName = options.model || process.env.NVIDIA_MODEL || DEFAULT_MODEL;
  const systemMessage = {
    role: 'system',
    content: `You are Nexus AI Copilot, an expert AI assistant embedded in a React 19 and Node.js Express full-stack application.
You are running model: ${selectedModelName}.
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

  return await callNvidiaAI(formattedMessages, { temperature: 0.6, max_tokens: 800, ...options });
}
