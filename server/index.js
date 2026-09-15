import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateTaskBreakdown, autofillTask, chatCopilot, SUPPORTED_MODELS } from './aiService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

// Middleware
app.use(cors({
  origin: CLIENT_ORIGIN === '*' ? '*' : [CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// In-memory data store with seed items
let tasks = [
  {
    id: '1',
    title: 'Initialize Full-Stack Architecture',
    description: 'Establish monorepo structure with React Vite frontend and Express backend',
    priority: 'high',
    category: 'Architecture',
    completed: true,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: '2',
    title: 'Configure RESTful Health & Telemetry Endpoints',
    description: 'Set up real-time server diagnostics and memory statistics',
    priority: 'medium',
    category: 'Backend',
    completed: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    title: 'Design Dark-Mode Dashboard Interface',
    description: 'Implement modern glassmorphism styling, responsive layout, and interactive micro-animations',
    priority: 'high',
    category: 'Frontend',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Verify Client-Server Proxy Integration',
    description: 'Test seamless API routing without CORS hurdles during development',
    priority: 'low',
    category: 'DevOps',
    completed: false,
    createdAt: new Date().toISOString(),
  }
];

// Simple logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health & System Telemetry Endpoint
app.get('/api/health', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'online',
    message: 'Backend server is running smoothly',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: NODE_ENV,
    nvidiaApiConfigured: Boolean(NVIDIA_API_KEY),
    nvidiaModel: process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct',
    nodeVersion: process.version,
    platform: process.platform,
    memoryUsage: {
      rssMb: (mem.rss / (1024 * 1024)).toFixed(2),
      heapUsedMb: (mem.heapUsed / (1024 * 1024)).toFixed(2),
    },
    totalTasksCount: tasks.length,
    activeTasksCount: tasks.filter(t => !t.completed).length,
  });
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
  const { category, completed } = req.query;
  let filtered = [...tasks];

  if (category && category !== 'All') {
    filtered = filtered.filter(t => t.category.toLowerCase() === category.toLowerCase());
  }

  if (completed !== undefined) {
    const isCompleted = completed === 'true';
    filtered = filtered.filter(t => t.completed === isCompleted);
  }

  res.json({
    success: true,
    count: filtered.length,
    data: filtered,
  });
});

// Create new task
app.post('/api/tasks', (req, res) => {
  const { title, description = '', priority = 'medium', category = 'General' } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Task title is required',
    });
  }

  const newTask = {
    id: Date.now().toString(),
    title: title.trim(),
    description: description.trim(),
    priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
    category: category.trim() || 'General',
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.unshift(newTask);

  res.status(201).json({
    success: true,
    data: newTask,
  });
});

// Update task / toggle status
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: `Task with id '${id}' not found`,
    });
  }

  const updated = {
    ...tasks[index],
    ...req.body,
    id: tasks[index].id, // Prevent overriding ID
  };

  tasks[index] = updated;

  res.json({
    success: true,
    data: updated,
  });
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = tasks.length;
  tasks = tasks.filter(t => t.id !== id);

  if (tasks.length === initialLength) {
    return res.status(404).json({
      success: false,
      error: `Task with id '${id}' not found`,
    });
  }

  res.json({
    success: true,
    message: `Task ${id} deleted successfully`,
  });
});

// --- NVIDIA AI ENDPOINTS ---

// AI Models Catalog
app.get('/api/ai/models', (req, res) => {
  res.json({
    success: true,
    defaultModel: process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct',
    models: SUPPORTED_MODELS
  });
});

// AI Task Breakdown
app.post('/api/ai/breakdown', async (req, res) => {
  const { title, description = '', model } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: 'Task title is required' });
  }

  try {
    const breakdown = await generateTaskBreakdown(title, description, { model });
    res.json({ success: true, data: breakdown });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Autofill from prompt
app.post('/api/ai/autofill', async (req, res) => {
  const { prompt, model } = req.body;
  if (!prompt) {
    return res.status(400).json({ success: false, error: 'Prompt is required' });
  }

  try {
    const autofillData = await autofillTask(prompt, { model });
    res.json({ success: true, data: autofillData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Copilot Chat
app.post('/api/ai/chat', async (req, res) => {
  const { messages = [], model } = req.body;
  if (!messages.length) {
    return res.status(400).json({ success: false, error: 'Messages array is required' });
  }

  try {
    const reply = await chatCopilot(messages, { model });
    res.json({
      success: true,
      reply,
      model: model || process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 404 Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Node.js Express server running at http://localhost:${PORT}`);
  console.log(`📡 Health check available at http://localhost:${PORT}/api/health`);
  console.log(`🤖 NVIDIA API Key: ${NVIDIA_API_KEY ? 'Configured (nvapi-***)' : 'Not configured'}`);
});
