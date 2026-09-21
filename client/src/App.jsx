import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'Nexus Full-Stack';
const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';

export default function App() {
  const [serverHealth, setServerHealth] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'online' | 'connecting' | 'offline'
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [toast, setToast] = useState(null);
  
  // Task Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('Frontend');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Autofill State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAutofilling, setIsAutofilling] = useState(false);

  // AI Breakdown Modal State
  const [activeBreakdownTask, setActiveBreakdownTask] = useState(null);
  const [breakdownData, setBreakdownData] = useState(null);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);

  // AI Copilot Chat State
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: '👋 Hi! I am Nexus AI Copilot powered by NVIDIA NIM. Ask me anything about your project architecture, code, or tasks!' }
  ]);
  const [userChatInput, setUserChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // AI Model State
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('meta/llama-3.2-11b-vision-instruct');

  // AI Image Studio State
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageModel, setImageModel] = useState('flux-realism');
  const [imageAspectRatio, setImageAspectRatio] = useState('16:9');
  const [imageQuality, setImageQuality] = useState('4k'); // '4k' | '2k' | '1080p'
  const [imageStyle, setImageStyle] = useState('photorealistic'); // 'photorealistic' | 'cinematic' | '3d-render' | 'anime'
  const [isEnhancePrompt, setIsEnhancePrompt] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [activePreviewImage, setActivePreviewImage] = useState(null);
  const [availableImageModels, setAvailableImageModels] = useState([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Fetch Health Status
  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) throw new Error('Health check failed');
      const data = await res.json();
      setServerHealth(data);
      setConnectionStatus('online');
    } catch (err) {
      console.error('Server offline:', err);
      setConnectionStatus('offline');
      setServerHealth(null);
    }
  };

  // Fetch Tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const json = await res.json();
      if (json.success) {
        setTasks(json.data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  // Fetch AI Models
  const fetchModels = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/models`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.models) {
        setAvailableModels(json.models);
        if (json.defaultModel) {
          setSelectedModel(json.defaultModel);
        }
      }
    } catch (err) {
      console.error('Error fetching AI models:', err);
    }
  };

  // Fetch Image Diffusion Models
  const fetchImageModels = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/image-models`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.models) {
        setAvailableImageModels(json.models);
        if (json.defaultModel) {
          setImageModel(json.defaultModel);
        }
      }
    } catch (err) {
      console.error('Error fetching AI image models:', err);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchTasks();
    fetchModels();
    fetchImageModels();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Compute High-Clarity Dimensions
  const getClarityDimensions = (ratio, quality) => {
    if (quality === '4k') {
      if (ratio === '16:9') return { width: 1920, height: 1080 };
      if (ratio === '9:16') return { width: 1080, height: 1920 };
      if (ratio === '4:3') return { width: 1600, height: 1200 };
      return { width: 1536, height: 1536 };
    }
    if (quality === '2k') {
      if (ratio === '16:9') return { width: 1536, height: 864 };
      if (ratio === '9:16') return { width: 864, height: 1536 };
      if (ratio === '4:3') return { width: 1280, height: 960 };
      return { width: 1280, height: 1280 };
    }
    // 1080p Standard
    if (ratio === '16:9') return { width: 1280, height: 720 };
    if (ratio === '9:16') return { width: 720, height: 1280 };
    if (ratio === '4:3') return { width: 1024, height: 768 };
    return { width: 1024, height: 1024 };
  };

  // Handle AI Image Generation
  const handleGenerateImage = async (customPrompt) => {
    const promptToUse = typeof customPrompt === 'string' ? customPrompt : imagePrompt;
    if (!promptToUse || !promptToUse.trim()) {
      showToast('⚠️ Please enter an image description prompt');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const dims = getClarityDimensions(imageAspectRatio, imageQuality);

      const res = await fetch(`${API_BASE_URL}/ai/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse.trim(),
          model: imageModel,
          width: dims.width,
          height: dims.height,
          enhance: isEnhancePrompt,
          style: imageStyle
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setActivePreviewImage(json.data);
        setGeneratedImages((prev) => [json.data, ...prev.filter((x) => x.id !== json.data.id)]);
        showToast(`✨ Crystal-clear image rendered with ${json.data.model.toUpperCase()} (${json.data.width}x${json.data.height})!`);
      } else {
        showToast(`Error: ${json.error || 'Failed to generate image'}`);
      }
    } catch (err) {
      console.error('Image generation failed:', err);
      showToast('Image generation failed. Please check network connection.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Download Image Helper
  const handleDownloadImage = async (imgObj) => {
    if (!imgObj?.imageUrl) return;
    try {
      showToast('⏳ Downloading high-res image...');
      const response = await fetch(imgObj.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus-art-${imgObj.model}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('✅ Image downloaded to your PC!');
    } catch (err) {
      window.open(imgObj.imageUrl, '_blank');
    }
  };

  // Handle Add Task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          priority,
          category,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setTasks((prev) => [json.data, ...prev]);
        setTitle('');
        setDescription('');
        setAiPrompt('');
        showToast(`Task "${json.data.title}" added to backend!`);
        checkHealth();
      }
    } catch (err) {
      console.error('Error adding task:', err);
      showToast('Error connecting to backend API');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle AI Autofill
  const handleAiAutofill = async () => {
    if (!aiPrompt.trim()) return;
    setIsAutofilling(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai/autofill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, model: selectedModel })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTitle(json.data.title || '');
        setDescription(json.data.description || '');
        setPriority(json.data.priority || 'medium');
        setCategory(json.data.category || 'Frontend');
        showToast('✨ Task details populated by NVIDIA AI!');
      }
    } catch (err) {
      console.error('AI autofill failed:', err);
      showToast('AI Autofill failed, please check connection.');
    } finally {
      setIsAutofilling(false);
    }
  };

  // Handle AI Task Breakdown
  const handleOpenBreakdown = async (task) => {
    setActiveBreakdownTask(task);
    setBreakdownData(null);
    setIsLoadingBreakdown(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/breakdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          model: selectedModel
        })
      });
      const json = await res.json();
      if (json.success) {
        setBreakdownData(json.data);
      }
    } catch (err) {
      console.error('Failed to generate breakdown:', err);
      showToast('Failed to generate AI breakdown');
    } finally {
      setIsLoadingBreakdown(false);
    }
  };

  // Add all AI Subtasks to board
  const handleAddAllSubtasks = async () => {
    if (!breakdownData?.subtasks?.length) return;

    let addedCount = 0;
    for (const sub of breakdownData.subtasks) {
      try {
        const res = await fetch(`${API_BASE_URL}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: sub.title,
            description: sub.description,
            priority: sub.priority || 'medium',
            category: activeBreakdownTask?.category || 'General'
          })
        });
        const json = await res.json();
        if (json.success) {
          setTasks((prev) => [json.data, ...prev]);
          addedCount++;
        }
      } catch (err) {
        console.error('Error adding subtask:', err);
      }
    }

    showToast(`Added ${addedCount} AI subtasks to board!`);
    setActiveBreakdownTask(null);
    checkHealth();
  };

  // Handle Copilot Chat Send
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!userChatInput.trim() || isChatLoading) return;

    const newMessages = [
      ...chatMessages,
      { role: 'user', content: userChatInput }
    ];

    setChatMessages(newMessages);
    setUserChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, model: selectedModel })
      });
      const json = await res.json();
      if (json.success && json.reply) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: json.reply }]);
      }
    } catch (err) {
      console.error('Copilot chat error:', err);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an issue connecting to NVIDIA NIM. Please try again.' }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handle Apply Code Snippet to Project
  const handleApplyCode = async (filePath, code) => {
    if (!filePath || !filePath.trim()) {
      showToast('❌ Please specify a target file path');
      return false;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/ai/apply-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: filePath.trim(), code })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`🚀 Successfully wrote ${json.filePath} to your project!`);
        return true;
      } else {
        showToast(`❌ Failed to write file: ${json.error}`);
        return false;
      }
    } catch (err) {
      console.error('Failed to apply code:', err);
      showToast(`❌ Error: ${err.message}`);
      return false;
    }
  };

  // Handle Toggle Task
  const handleToggleTask = async (task) => {
    try {
      const updatedStatus = !task.completed;
      const res = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: updatedStatus }),
      });

      const json = await res.json();
      if (json.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, completed: updatedStatus } : t))
        );
        showToast(`Task marked as ${updatedStatus ? 'completed' : 'active'}`);
        checkHealth();
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (id, taskTitle) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (json.success) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        showToast(`Task "${taskTitle}" deleted`);
        checkHealth();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Filtered Tasks
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-notice" id="toast-message" role="status">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <header className="header-nav">
        <div className="brand-badge-wrapper">
          <div className="brand-icon-box" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span className="brand-title">{APP_TITLE}</span>
              <span className="tag-badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.4)', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                {APP_ENV}
              </span>
              {serverHealth?.nvidiaApiConfigured && (
                <span className="ai-badge" id="badge-nvidia-ai" title={`Active Model: ${selectedModel}`}>
                  ⚡ {availableModels.find((m) => m.id === selectedModel)?.name || 'NVIDIA NIM'}
                </span>
              )}
            </div>
            <div className="brand-subtitle">React 19 + Node.js Express + NVIDIA NIM</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            id="btn-toggle-studio"
            className="btn-studio"
            onClick={() => setIsImageStudioOpen(true)}
            title="Open AI Image Studio (FLUX.1 & SDXL)"
          >
            <span>🎨</span>
            <span>AI Image Studio</span>
          </button>

          <button
            id="btn-toggle-copilot"
            className="btn-ai"
            onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>{isCopilotOpen ? 'Close Copilot' : '🤖 AI Copilot'}</span>
          </button>

          <div 
            id="server-status-pill"
            className={`status-pill ${connectionStatus}`}
            title={`Backend Status: ${connectionStatus}`}
          >
            <span className="pulse-dot"></span>
            <span>
              {connectionStatus === 'online' && 'API Connected'}
              {connectionStatus === 'connecting' && 'Connecting to API...'}
              {connectionStatus === 'offline' && 'Backend Offline'}
            </span>
          </div>
          
          <button 
            id="btn-refresh-health"
            className="filter-btn" 
            onClick={checkHealth}
            title="Refresh backend status"
            style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}
          >
            ↻ Ping API
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-heading">
          Full-Stack <span className="gradient-text">React & Node.js</span> AI Workspace
        </h1>
        <p className="hero-desc">
          High-performance full-stack platform featuring Vite HMR, Express REST API, server-side telemetry, 
          Groq / NVIDIA LLM orchestration, and FLUX.1 high-speed AI image synthesis.
        </p>
      </section>

      {/* Server Telemetry Cards */}
      <section className="telemetry-grid" aria-label="System Diagnostics">
        <div className="telemetry-card" id="telemetry-uptime">
          <div className="telemetry-label">Server Uptime</div>
          <div className="telemetry-val">
            {serverHealth ? `${serverHealth.uptimeSeconds}s` : '--'}
          </div>
          <div className="telemetry-meta">
            {serverHealth ? 'Node.js Express Server' : 'Connecting to port 5000'}
          </div>
        </div>

        <div className="telemetry-card" id="telemetry-runtime">
          <div className="telemetry-label">LLM Speed</div>
          <div className="telemetry-val" style={{ color: '#38bdf8' }}>
            {serverHealth?.groqApiConfigured ? '⚡ 500+ tok/s' : 'Standard'}
          </div>
          <div className="telemetry-meta">
            {serverHealth?.groqApiConfigured ? 'Groq LPU Engine Active' : 'NVIDIA NIM Provider'}
          </div>
        </div>

        <div className="telemetry-card" id="telemetry-ai">
          <div className="telemetry-label">Text & Code AI</div>
          <div className="telemetry-val" style={{ color: '#34d399' }}>
            {availableModels.find((m) => m.id === selectedModel)?.name || 'Llama 3.3'}
          </div>
          <div className="telemetry-meta">
            {availableModels.find((m) => m.id === selectedModel)?.badge || 'Active Model'}
          </div>
        </div>

        <div className="telemetry-card" id="telemetry-images" style={{ cursor: 'pointer' }} onClick={() => setIsImageStudioOpen(true)} title="Click to open AI Image Studio">
          <div className="telemetry-label">AI Image Studio</div>
          <div className="telemetry-val" style={{ color: '#ec4899' }}>
            FLUX.1
          </div>
          <div className="telemetry-meta">
            🎨 Diffusion Studio Active
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="content-layout">
        {/* Task Management Panel */}
        <section className="glass-panel" aria-label="Task Management System">
          <div className="panel-header">
            <h2 className="panel-title">Task Orchestration</h2>
            
            {/* Filter Buttons */}
            <div className="task-filters" role="group" aria-label="Filter Tasks">
              <button
                id="filter-all"
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({tasks.length})
              </button>
              <button
                id="filter-active"
                className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                onClick={() => setFilter('active')}
              >
                Active ({tasks.filter(t => !t.completed).length})
              </button>
              <button
                id="filter-completed"
                className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completed ({tasks.filter(t => t.completed).length})
              </button>
            </div>
          </div>

          {/* AI Quick Generator Prompt Bar */}
          <div style={{ background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              ✨ AI Generator:
            </span>
            <input
              id="input-ai-prompt"
              type="text"
              placeholder="Type any idea (e.g. Implement Redis Caching or Setup OAuth Login)..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="input-field"
              style={{ flex: 1, minWidth: '220px', padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAiAutofill())}
            />
            <button
              id="btn-ai-autofill"
              type="button"
              className="btn-ai"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
              onClick={handleAiAutofill}
              disabled={isAutofilling || !aiPrompt.trim()}
            >
              {isAutofilling ? '✨ Thinking...' : '✨ Auto-Fill Task'}
            </button>
          </div>

          {/* Create Task Form */}
          <form className="task-form" id="create-task-form" onSubmit={handleAddTask}>
            <div className="form-inputs">
              <input
                id="input-task-title"
                className="input-field"
                type="text"
                placeholder="Task title (e.g. Build authentication route)..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <input
                id="input-task-desc"
                className="input-field"
                type="text"
                placeholder="Description or requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                id="select-task-category"
                className="select-field"
                style={{ flex: 1, minWidth: '130px' }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Database">Database</option>
                <option value="Architecture">Architecture</option>
                <option value="DevOps">DevOps</option>
              </select>

              <select
                id="select-task-priority"
                className="select-field"
                style={{ flex: 1, minWidth: '130px' }}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>

              <button
                id="btn-submit-task"
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || !title.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>{isSubmitting ? 'Saving...' : 'Add Task'}</span>
              </button>
            </div>
          </form>

          {/* Task List */}
          <div className="task-list" id="tasks-container">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No tasks found for this filter. Use the AI Generator above to create one!</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  id={`task-item-${task.id}`}
                  className={`task-card ${task.completed ? 'is-completed' : ''}`}
                >
                  <div className="task-main">
                    <input
                      type="checkbox"
                      id={`checkbox-task-${task.id}`}
                      className="custom-checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task)}
                      aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                    />
                    <div className="task-details">
                      <div className="task-title">{task.title}</div>
                      {task.description && (
                        <div className="task-desc">{task.description}</div>
                      )}
                      <div className="task-tags">
                        <span className={`tag-badge priority-${task.priority}`}>
                          {task.priority}
                        </span>
                        <span className="tag-badge category">
                          {task.category}
                        </span>
                        <button
                          id={`btn-breakdown-${task.id}`}
                          className="btn-ai-outline"
                          onClick={() => handleOpenBreakdown(task)}
                          title="Generate subtasks using NVIDIA AI"
                        >
                          ✨ AI Breakdown
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="task-actions">
                    <button
                      id={`btn-delete-task-${task.id}`}
                      className="btn-icon-danger"
                      onClick={() => handleDeleteTask(task.id, task.title)}
                      title="Delete task"
                      aria-label={`Delete task ${task.title}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="sidebar">
          {/* AI Copilot Card */}
          <div className="glass-panel" style={{ border: '1px solid rgba(6, 182, 212, 0.3)', background: 'rgba(6, 182, 212, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                🤖 AI Copilot
              </h3>
              <span className="ai-badge" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                Llama 3.2
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Your integrated coding and architectural assistant ready to answer questions or review your codebase.
            </p>
            <button
              id="btn-open-copilot-sidebar"
              className="btn-ai"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setIsCopilotOpen(true)}
            >
              💬 Open AI Chat Assistant
            </button>
          </div>

          {/* Architecture Card */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.9rem', color: '#ffffff' }}>
              Stack Architecture
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }}></span>
                <strong>Frontend:</strong> React 19 + Vite (port 5173)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)' }}></span>
                <strong>Backend:</strong> Node.js Express (port 5000)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }}></span>
                <strong>AI Engine:</strong> NVIDIA NIM ({availableModels.find((m) => m.id === selectedModel)?.name || 'Active'})
              </div>
            </div>
          </div>

          {/* API Endpoints Reference Card */}
          <div className="glass-panel api-endpoints-card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ffffff' }}>
              AI & REST Endpoints
            </h3>
            <div className="endpoint-row">
              <span className="method-tag get">GET</span>
              <span className="endpoint-path">/api/health</span>
            </div>
            <div className="endpoint-row">
              <span className="method-tag post">POST</span>
              <span className="endpoint-path">/api/ai/autofill</span>
            </div>
            <div className="endpoint-row">
              <span className="method-tag post">POST</span>
              <span className="endpoint-path">/api/ai/breakdown</span>
            </div>
            <div className="endpoint-row">
              <span className="method-tag post">POST</span>
              <span className="endpoint-path">/api/ai/chat</span>
            </div>
          </div>
        </aside>
      </main>

      {/* AI Task Breakdown Modal */}
      {activeBreakdownTask && (
        <div className="modal-backdrop" id="modal-breakdown" onClick={() => setActiveBreakdownTask(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span>✨ AI Architecture Breakdown</span>
              </div>
              <button
                id="btn-close-breakdown-modal"
                className="btn-close"
                onClick={() => setActiveBreakdownTask(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                {activeBreakdownTask.title}
              </div>

              {isLoadingBreakdown ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#38bdf8' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem', animation: 'pulse-anim 1s infinite' }}>⚡</div>
                  <p>Generating architectural plan with NVIDIA Llama 3.2...</p>
                </div>
              ) : breakdownData ? (
                <>
                  {breakdownData.summary && (
                    <div className="ai-summary-box">
                      <strong>Architecture Strategy:</strong> {breakdownData.summary}
                    </div>
                  )}

                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                      Recommended Subtasks ({breakdownData.subtasks?.length || 0})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {breakdownData.subtasks?.map((sub, idx) => (
                        <div key={idx} className="subtask-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>
                              {idx + 1}. {sub.title}
                            </span>
                            <span className={`tag-badge priority-${sub.priority || 'medium'}`}>
                              {sub.priority}
                            </span>
                          </div>
                          {sub.description && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {sub.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {breakdownData.codeSnippet && (
                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                        Code / Implementation Reference
                      </h4>
                      <CodeSnippetCard
                        lang="javascript"
                        initialPath={`client/src/features/${(activeBreakdownTask?.title || 'feature').toLowerCase().replace(/[^a-z0-9]/g, '_')}.js`}
                        code={breakdownData.codeSnippet}
                        onApplyCode={handleApplyCode}
                        showToast={showToast}
                      />
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="modal-footer">
              <button
                id="btn-cancel-modal"
                className="filter-btn"
                style={{ border: '1px solid var(--border-subtle)' }}
                onClick={() => setActiveBreakdownTask(null)}
              >
                Close
              </button>
              {breakdownData?.subtasks?.length > 0 && (
                <button
                  id="btn-add-all-subtasks"
                  className="btn-ai"
                  onClick={handleAddAllSubtasks}
                >
                  ➕ Add Subtasks to Board
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Copilot Chat Modal / Drawer */}
      {isCopilotOpen && (
        <div className="modal-backdrop" id="modal-copilot" onClick={() => setIsCopilotOpen(false)}>
          <div className="modal-card copilot-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span>🤖 Nexus AI Copilot</span>
                {availableModels.length > 0 && (
                  <select
                    id="select-ai-model"
                    className="model-select-dropdown"
                    value={selectedModel}
                    onChange={(e) => {
                      const newModel = e.target.value;
                      setSelectedModel(newModel);
                      const modelObj = availableModels.find((m) => m.id === newModel);
                      showToast(`AI Model set to: ${modelObj?.name || newModel}`);
                    }}
                    title="Select AI Model"
                  >
                    {Array.from(new Set(availableModels.map((m) => m.provider))).map((providerName) => (
                      <optgroup key={providerName} label={providerName}>
                        {availableModels
                          .filter((m) => m.provider === providerName)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.badge})
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                )}
              </div>
              <button
                id="btn-close-copilot-modal"
                className="btn-close"
                onClick={() => setIsCopilotOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="chat-history">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`chat-bubble ${msg.role}`}>
                  {msg.role === 'assistant' ? (
                    <InteractiveChatContent
                      content={msg.content}
                      onApplyCode={handleApplyCode}
                      showToast={showToast}
                    />
                  ) : (
                    msg.content
                  )}
                </div>
              ))}
              {isChatLoading && (
                <div className="chat-bubble assistant" style={{ color: '#38bdf8' }}>
                  ⚡ Nexus AI is generating response...
                </div>
              )}
            </div>

            <form className="chat-input-box" onSubmit={handleSendChatMessage}>
              <input
                id="input-copilot-message"
                type="text"
                placeholder="Ask about project code, architecture, or task advice..."
                className="input-field"
                value={userChatInput}
                onChange={(e) => setUserChatInput(e.target.value)}
                disabled={isChatLoading}
              />
              <button
                id="btn-copilot-send"
                type="submit"
                className="btn-ai"
                disabled={isChatLoading || !userChatInput.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Image Studio Modal */}
      {isImageStudioOpen && (
        <div className="modal-backdrop" id="modal-image-studio" onClick={() => setIsImageStudioOpen(false)}>
          <div className="modal-card studio-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🎨</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>AI Image Studio</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Powered by FLUX.1 & SDXL Diffusion Models
                  </div>
                </div>
              </div>
              <button
                id="btn-close-studio-modal"
                className="btn-close"
                onClick={() => setIsImageStudioOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="studio-grid">
              {/* Left Column: Controls */}
              <div className="studio-controls">
                {/* Prompt Input */}
                <div className="studio-field-group">
                  <div className="studio-label">
                    <span>Describe what to create</span>
                    <span style={{ color: '#ec4899', fontSize: '0.75rem' }}>✨ Instant Generation</span>
                  </div>
                  <textarea
                    id="input-image-prompt"
                    className="studio-textarea"
                    placeholder="E.g. A futuristic cybernetic city with glowing neon skyscrapers in the rain, cinematic lighting, 8k..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    disabled={isGeneratingImage}
                  />
                </div>

                {/* Quick Inspiration Chips */}
                <div className="studio-field-group">
                  <div className="studio-label">
                    <span>💡 Quick Inspiration Prompts</span>
                  </div>
                  <div className="prompt-chips-wrapper">
                    {[
                      { label: '📸 Real Kyoto Street Portrait', prompt: 'RAW candid color photo of a real woman holding umbrella on Kyoto street, natural skin texture, visible pores, Sony A7IV 85mm lens, natural daylight, National Geographic documentary portrait, real life photo' },
                      { label: '🏎️ Real Supercar Commercial', prompt: 'Authentic 8k automotive photography of a luxury carbon hypercar in dark studio, wet ground reflections, crisp sharp lines, Hasselblad 50mm, real car photo' },
                      { label: '🏔️ Alpine Lake Nature', prompt: 'Real documentary landscape photograph of snow-capped mountains reflected in a clear alpine lake at sunrise, Canon EOS R5, ultra-sharp detail, real life' },
                      { label: '☕ Cafe Lifestyle', prompt: 'Authentic lifestyle photograph of a barista brewing artisan pour-over coffee in a sunlit modern cafe, natural morning light, real photo' },
                      { label: '🏙️ Modern Skyscraper', prompt: 'Real architectural photograph of a sleek glass skyscraper reflecting warm golden hour clouds, Leica M11, crisp geometric lines' },
                      { label: '🐆 Wildlife Safari', prompt: 'Real wildlife documentary photograph of a leopard resting on an acacia tree in the Serengeti, 400mm telephoto lens, National Geographic' }
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="prompt-chip"
                        onClick={() => {
                          setImagePrompt(chip.prompt);
                          handleGenerateImage(chip.prompt);
                        }}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model Selection */}
                <div className="studio-field-group">
                  <div className="studio-label">
                    <span>Diffusion Model</span>
                  </div>
                  <select
                    id="select-image-model"
                    className="model-select-dropdown"
                    style={{ width: '100%' }}
                    value={imageModel}
                    onChange={(e) => setImageModel(e.target.value)}
                  >
                    {availableImageModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.badge})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Aspect Ratio & Resolution Grid */}
                <div className="studio-field-group">
                  <div className="studio-label">
                    <span>Aspect Ratio & Resolution</span>
                    <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700 }}>{imageQuality.toUpperCase()} RENDER</span>
                  </div>
                  <div className="aspect-ratio-selector">
                    {[
                      { id: '16:9', label: '16:9', sub: 'Landscape', w: 22, h: 13 },
                      { id: '1:1', label: '1:1', sub: 'Square', w: 16, h: 16 },
                      { id: '9:16', label: '9:16', sub: 'Portrait', w: 13, h: 22 },
                      { id: '4:3', label: '4:3', sub: 'Standard', w: 18, h: 14 }
                    ].map((ratio) => (
                      <button
                        key={ratio.id}
                        type="button"
                        className={`ratio-btn ${imageAspectRatio === ratio.id ? 'active' : ''}`}
                        onClick={() => setImageAspectRatio(ratio.id)}
                      >
                        <span className="ratio-box-icon" style={{ width: ratio.w, height: ratio.h }}></span>
                        <span>{ratio.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Quality Tier Selector */}
                  <div className="quality-tier-grid" style={{ marginTop: '0.5rem' }}>
                    {[
                      { id: '4k', label: '💎 4K Ultra HD', desc: 'Maximum pixel density & razor sharpness' },
                      { id: '2k', label: '🚀 2K Crisp', desc: 'High definition balanced render' },
                      { id: '1080p', label: '⚡ 1080p Fast', desc: 'Standard preview speed' }
                    ].map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        className={`quality-pill-btn ${imageQuality === q.id ? 'active' : ''}`}
                        onClick={() => setImageQuality(q.id)}
                        title={q.desc}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clarity & Rendering Style */}
                <div className="studio-field-group">
                  <div className="studio-label">
                    <span>Clarity & Rendering Style</span>
                  </div>
                  <div className="style-chips-grid">
                    {[
                      { id: 'photorealistic', label: '📸 8K Photorealism' },
                      { id: 'cinematic', label: '🎬 Cinematic IMAX' },
                      { id: '3d-render', label: '🧊 Octane 3D Raytrace' },
                      { id: 'anime', label: '🎨 Sharp Anime Art' }
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`style-chip-btn ${imageStyle === s.id ? 'active' : ''}`}
                        onClick={() => setImageStyle(s.id)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Prompt Enhancer Toggle */}
                <label className="enhance-toggle-box">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f8fafc' }}>
                      ⚡ Groq AI Optical Sharpness Enhancer
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      Injects 8K clarity, razor-sharp focus & deep depth of field (removes blur)
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isEnhancePrompt}
                    onChange={(e) => setIsEnhancePrompt(e.target.checked)}
                  />
                </label>

                {/* Generate Button */}
                <button
                  id="btn-generate-image"
                  className="btn-generate-art"
                  type="button"
                  onClick={() => handleGenerateImage()}
                  disabled={isGeneratingImage || !imagePrompt.trim()}
                >
                  {isGeneratingImage ? (
                    <>
                      <div className="spinner-glow" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
                      <span>Synthesizing Ultra-HD Image...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Generate Ultra-Sharp Image</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Preview & History */}
              <div className="studio-preview-section">
                <div 
                  className="studio-canvas-card"
                  onClick={() => activePreviewImage && setIsLightboxOpen(true)}
                  style={{ cursor: activePreviewImage ? 'zoom-in' : 'default' }}
                  title={activePreviewImage ? 'Click to inspect in 4K Fullscreen' : ''}
                >
                  {isGeneratingImage ? (
                    <div className="studio-canvas-loading">
                      <div className="spinner-glow"></div>
                      <div style={{ fontWeight: 600 }}>Synthesizing 8K Razor-Sharp Visual...</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Eliminating blur & applying high-frequency raytraced textures
                      </div>
                    </div>
                  ) : activePreviewImage ? (
                    <>
                      <img
                        src={activePreviewImage.imageUrl}
                        alt={activePreviewImage.prompt}
                        className="studio-main-image"
                        loading="eager"
                      />
                      <div className="preview-zoom-tag">🔍 Click for 4K Zoom</div>
                    </>
                  ) : (
                    <div className="studio-canvas-empty">
                      <span style={{ fontSize: '2.5rem' }}>🖼️</span>
                      <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                        No Image Generated Yet
                      </div>
                      <div style={{ fontSize: '0.82rem' }}>
                        Type a prompt or choose an inspiration chip on the left to create your first visual art!
                      </div>
                    </div>
                  )}
                </div>

                {activePreviewImage && (
                  <>
                    <div className="image-meta-banner">
                      <div>
                        <strong>Prompt:</strong> "{activePreviewImage.prompt}"
                      </div>
                      {activePreviewImage.isEnhanced && activePreviewImage.enhancedPrompt !== activePreviewImage.prompt && (
                        <div style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                          <strong>✨ AI Enhanced:</strong> {activePreviewImage.enhancedPrompt}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                        <span>Model: <strong>{activePreviewImage.model.toUpperCase()}</strong></span>
                        <span>Resolution: <strong style={{ color: '#38bdf8' }}>{activePreviewImage.width} × {activePreviewImage.height}</strong></span>
                        <span>Seed: <strong>{activePreviewImage.seed}</strong></span>
                      </div>
                    </div>

                    <div className="image-action-bar">
                      <button
                        className="btn-img-action primary"
                        onClick={() => handleDownloadImage(activePreviewImage)}
                        title="Download high-resolution image to your device"
                      >
                        💾 Download 4K JPG
                      </button>
                      <button
                        className="btn-img-action"
                        onClick={() => setIsLightboxOpen(true)}
                        title="View at 100% full screen scale"
                      >
                        🔍 Fullscreen
                      </button>
                      <button
                        className="btn-img-action"
                        onClick={() => {
                          navigator.clipboard.writeText(activePreviewImage.imageUrl);
                          showToast('🔗 Image URL copied!');
                        }}
                        title="Copy direct image URL"
                      >
                        🔗 Copy Link
                      </button>
                      <button
                        className="btn-img-action"
                        onClick={() => handleGenerateImage(activePreviewImage.prompt)}
                        title="Generate again with a new random seed"
                      >
                        🎲 Re-roll
                      </button>
                    </div>
                  </>
                )}

                {/* Session Gallery */}
                {generatedImages.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
                      Recent Session Creations ({generatedImages.length})
                    </div>
                    <div className="studio-gallery-strip">
                      {generatedImages.map((img) => (
                        <div
                          key={img.id}
                          className={`gallery-thumb-item ${activePreviewImage?.id === img.id ? 'active' : ''}`}
                          onClick={() => setActivePreviewImage(img)}
                          title={`"${img.prompt}"`}
                        >
                          <img src={img.imageUrl} alt={img.prompt} className="gallery-thumb-img" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4K Fullscreen Lightbox Modal */}
      {isLightboxOpen && activePreviewImage && (
        <div className="modal-backdrop lightbox-backdrop" onClick={() => setIsLightboxOpen(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontWeight: 700 }}>🔍 Ultra 4K Pixel Inspection</span>
                <span className="ai-badge" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                  {activePreviewImage.width} × {activePreviewImage.height}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-img-action primary"
                  onClick={() => handleDownloadImage(activePreviewImage)}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                  💾 Save 4K
                </button>
                <button className="btn-close" onClick={() => setIsLightboxOpen(false)}>✕</button>
              </div>
            </div>
            <div className="lightbox-img-wrapper">
              <img
                src={activePreviewImage.imageUrl}
                alt={activePreviewImage.prompt}
                className="lightbox-img"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Interactive Markdown Parser for Chat Messages with Code Action Cards
function InteractiveChatContent({ content, onApplyCode, showToast }) {
  if (!content) return null;

  // Regex to match markdown code fences: ```[lang] [filename] ... ```
  const codeBlockRegex = /```(?:(\w+)(?:\s+(?:filename=)?["']?([^"'\n]+)["']?)?)?\n([\s\S]*?)```/g;
  const elements = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.slice(lastIndex, match.index);
    if (textBefore) {
      elements.push(<span key={`text-${lastIndex}`}>{textBefore}</span>);
    }

    const lang = match[1] || 'javascript';
    const suggestedFile = match[2] || (
      lang === 'jsx' || lang === 'react' ? 'client/src/components/GeneratedComponent.jsx' :
      lang === 'css' ? 'client/src/custom.css' :
      lang === 'html' ? 'client/index.html' :
      'server/utils/ai_generated.js'
    );
    const code = match[3];

    elements.push(
      <CodeSnippetCard
        key={`code-${match.index}`}
        lang={lang}
        initialPath={suggestedFile}
        code={code}
        onApplyCode={onApplyCode}
        showToast={showToast}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  const remainingText = content.slice(lastIndex);
  if (remainingText) {
    elements.push(<span key={`text-end`}>{remainingText}</span>);
  }

  return elements.length > 0 ? <>{elements}</> : <span>{content}</span>;
}

// Code Card with Copy and Apply to Project buttons
function CodeSnippetCard({ lang, initialPath, code, onApplyCode, showToast }) {
  const [filePath, setFilePath] = useState(initialPath);
  const [applied, setApplied] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast('📋 Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = async () => {
    const success = await onApplyCode(filePath, code);
    if (success) {
      setApplied(true);
      setTimeout(() => setApplied(false), 3000);
    }
  };

  return (
    <div className="chat-code-card">
      <div className="chat-code-header">
        <span className="code-lang-tag">{lang}</span>
        <input
          className="code-path-input"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="Target file path in project..."
          title="Edit target file path to save code to"
        />
        <div className="code-actions-group">
          <button className="btn-code-action" onClick={handleCopy} type="button">
            {copied ? 'Copied ✓' : '📋 Copy'}
          </button>
          <button
            className={`btn-code-action apply ${applied ? 'applied' : ''}`}
            onClick={handleApply}
            type="button"
          >
            {applied ? 'Applied ✅' : '🚀 Apply to Project'}
          </button>
        </div>
      </div>
      <pre className="chat-code-body">
        <code>{code}</code>
      </pre>
    </div>
  );
}
