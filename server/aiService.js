// Multi-Provider Free LLM AI Service
// Supports: NVIDIA NIM, Groq, OpenRouter, Google Gemini, Cerebras
import dotenv from 'dotenv';
dotenv.config();

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

export const SUPPORTED_IMAGE_MODELS = [
  {
    id: 'flux-realism',
    name: 'FLUX Realism 8K',
    badge: '💎 Ultra-Sharp 8K',
    description: 'Masterwork photorealism with razor-sharp lens focus, micro-textures, and cinematic studio lighting'
  },
  {
    id: 'flux',
    name: 'FLUX.1 Schnell',
    badge: '⚡ High Speed',
    description: 'Next-gen balanced diffusion model with crisp lines and fast generation'
  },
  {
    id: 'flux-3d',
    name: 'FLUX 3D Octane',
    badge: '🧊 3D Render',
    description: 'Unreal Engine 5.4 / Octane 8K render with raytracing and depth'
  },
  {
    id: 'flux-anime',
    name: 'FLUX Anime & Manga',
    badge: '🎨 Art & Anime',
    description: 'Stunning Japanese anime aesthetic, vibrant coloring, and sharp illustration'
  },
  {
    id: 'turbo',
    name: 'SDXL Turbo',
    badge: '🚀 Sub-Second',
    description: 'Real-time single-step generation for rapid concept prototyping'
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
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${providerConfig.apiKey}`
      };
      if (providerConfig.name === 'OpenRouter') {
        headers['HTTP-Referer'] = 'http://localhost:5173';
        headers['X-Title'] = 'Nexus AI Full-Stack';
      }
      response = await fetch(providerConfig.url, {
        method: 'POST',
        headers,
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

// Enhance user image prompt with AI reasoning (enforces 100% genuine real-world photography & eliminates anime/CGI look)
export async function enhanceImagePrompt(userPrompt, style = 'photorealistic', options = {}) {
  const isRealPhoto = style === 'photorealistic' || style === 'cinematic';

  const systemPrompt = isRealPhoto
    ? `You are an expert prompt engineer for cutting-edge photorealistic diffusion models (FLUX and SDXL).
Your task is to convert the user's request into an AUTHENTIC, 100% REAL-LIFE PHOTOGRAPH prompt (max 45 words).
MANDATORY REAL PHOTOGRAPHY RULES:
1. Frame as a real camera shot: "A candid RAW 35mm color photograph of a real [subject], natural authentic human skin texture with real pores and subtle imperfections, authentic daylight, shot on Sony A7 IV with 85mm f/1.4 lens, National Geographic documentary photojournalism, natural expressions".
2. ABSOLUTELY FORBIDDEN: Do NOT use words like "anime", "illustration", "digital art", "3d render", "doll", "smooth plastic skin", "painting", "cgi", "unreal engine", "drawing".
3. Add anti-anime enforcement: "real life documentary photograph, authentic real world, not anime, not cartoon, not painting, not 3d render, zero CGI".
4. Output ONLY the raw prompt string.`
    : `You are an elite prompt engineer for diffusion models.
Convert the user's request into a high-clarity visual prompt tailored for style: "${style}" (max 45 words).
Output ONLY the raw prompt string.`;

  try {
    const enhanced = await callNvidiaAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.4, max_tokens: 140, ...options });

    let cleaned = enhanced.replace(/^["']|["']$/g, '').trim();
    if (isRealPhoto && !cleaned.toLowerCase().includes('not anime')) {
      cleaned += ', authentic real life photograph, natural skin pores, realistic daylight, not anime, not cartoon, zero CGI, not 3d render';
    }
    return cleaned || userPrompt;
  } catch (err) {
    console.warn('[AI Image] Failed to enhance prompt with LLM, falling back to realistic photo template:', err.message);
    return `RAW candid color photograph of real ${userPrompt}, natural skin texture with authentic pores, Sony A7 IV 85mm lens, natural daylight, National Geographic documentary quality, real life photo, not anime, not cartoon, zero 3d render`;
  }
}

// Generate image metadata and URL with Together AI FLUX.1, Hugging Face, or Pollinations fallback
export async function generateImageService({ prompt, model = 'flux-realism', width = 1280, height = 720, enhance = true, style = 'photorealistic', seed }) {
  if (!prompt || !prompt.trim()) {
    throw new Error('Image prompt is required');
  }

  const rawPrompt = prompt.trim();
  let finalPrompt = rawPrompt;

  if (enhance) {
    finalPrompt = await enhanceImagePrompt(rawPrompt, style);
  } else {
    if (style === 'photorealistic') {
      finalPrompt = `RAW candid photograph of real ${finalPrompt}, natural skin texture, realistic daylight, Sony A7IV 85mm lens, authentic documentary photo, not anime, not cartoon, not 3d render`;
    } else if (!finalPrompt.toLowerCase().includes('sharp') && !finalPrompt.toLowerCase().includes('8k')) {
      finalPrompt = `${finalPrompt}, ultra-sharp focus, 8k uhd, highly detailed, crisp lighting`;
    }
  }

  const imageSeed = seed !== undefined && seed !== null ? Number(seed) : Math.floor(Math.random() * 1000000);
  const safeWidth = Math.min(Math.max(Number(width) || 1280, 256), 2048);
  const safeHeight = Math.min(Math.max(Number(height) || 720, 256), 2048);

  const togetherApiKey = process.env.TOGETHER_API_KEY;

  // 1. Try Together AI (Professional FLUX.1 Schnell)
  if (togetherApiKey && togetherApiKey.trim()) {
    try {
      console.log('[AI Image Studio] Calling Together AI FLUX.1 Schnell engine...');
      const togetherRes = await fetch('https://api.together.xyz/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${togetherApiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'black-forest-labs/FLUX.1-schnell',
          prompt: finalPrompt,
          width: safeWidth > 1440 ? 1024 : safeWidth,
          height: safeHeight > 1440 ? 768 : safeHeight,
          steps: 4,
          n: 1,
          response_format: 'b64_json'
        })
      });

      if (togetherRes.ok) {
        const togetherData = await togetherRes.json();
        const b64 = togetherData.data?.[0]?.b64_json;
        if (b64) {
          const dataUrl = `data:image/jpeg;base64,${b64}`;
          return {
            id: `img_${Date.now()}_together`,
            imageUrl: dataUrl,
            prompt: rawPrompt,
            enhancedPrompt: finalPrompt,
            isEnhanced: enhance,
            model: 'FLUX.1 [schnell] (Together AI)',
            width: safeWidth,
            height: safeHeight,
            seed: imageSeed,
            quality: 'Commercial Studio FP16',
            createdAt: new Date().toISOString()
          };
        }
      } else {
        const errText = await togetherRes.text();
        console.warn('[AI Image Studio] Together AI request returned non-200:', errText);
      }
    } catch (err) {
      console.warn('[AI Image Studio] Together AI generation failed, falling back:', err.message);
    }
  }

  const hfApiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;

  // 2. Try Hugging Face Serverless FLUX.1 (100% Free Tier)
  if (hfApiKey && hfApiKey.trim()) {
    try {
      console.log('[AI Image Studio] Calling Hugging Face FLUX.1 Schnell engine...');
      const hfRes = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: finalPrompt })
      });

      if (hfRes.ok) {
        const buffer = await hfRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64}`;
        return {
          id: `img_${Date.now()}_hf`,
          imageUrl: dataUrl,
          prompt: rawPrompt,
          enhancedPrompt: finalPrompt,
          isEnhanced: enhance,
          model: 'FLUX.1 [schnell] (Hugging Face)',
          width: safeWidth,
          height: safeHeight,
          seed: imageSeed,
          quality: 'FLUX.1 Native 8K',
          createdAt: new Date().toISOString()
        };
      } else {
        const errText = await hfRes.text();
        console.warn('[AI Image Studio] Hugging Face returned non-200:', errText);
      }
    } catch (err) {
      console.warn('[AI Image Studio] Hugging Face call failed:', err.message);
    }
  }

  // 3. Fallback: Pollinations FLUX Engine
  const safeModel = ['flux-realism', 'flux', 'flux-3d', 'flux-anime', 'turbo'].includes(model) ? model : 'flux-realism';
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?model=${safeModel}&width=${safeWidth}&height=${safeHeight}&seed=${imageSeed}&nologo=true`;

  return {
    id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    imageUrl,
    prompt: rawPrompt,
    enhancedPrompt: finalPrompt,
    isEnhanced: enhance,
    model: safeModel,
    width: safeWidth,
    height: safeHeight,
    seed: imageSeed,
    quality: '8K Ultra HD',
    createdAt: new Date().toISOString()
  };
}




