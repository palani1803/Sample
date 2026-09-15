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
    { role: 'assistant', content: '👋 Hi! I am Nexus AI Copilot powered by NVIDIA Llama 3.2. Ask me anything about your project architecture, code, or tasks!' }
  ]);
  const [userChatInput, setUserChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

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

  useEffect(() => {
    checkHealth();
    fetchTasks();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

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
        body: JSON.stringify({ prompt: aiPrompt })
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
          description: task.description
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
        body: JSON.stringify({ messages: newMessages })
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
                <span className="ai-badge" id="badge-nvidia-ai" title="NVIDIA NIM Llama 3.2 Connected">
                  ⚡ NVIDIA Llama 3.2
                </span>
              )}
            </div>
            <div className="brand-subtitle">React 19 + Node.js Express + NVIDIA NIM</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
          and AI task orchestration powered by NVIDIA NIM Meta Llama 3.2.
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
          <div className="telemetry-label">Node Runtime</div>
          <div className="telemetry-val">
            {serverHealth?.nodeVersion || '--'}
          </div>
          <div className="telemetry-meta">
            Platform: {serverHealth?.platform || 'win32'}
          </div>
        </div>

        <div className="telemetry-card" id="telemetry-ai">
          <div className="telemetry-label">NVIDIA AI Engine</div>
          <div className="telemetry-val" style={{ color: '#34d399' }}>
            {serverHealth?.nvidiaApiConfigured ? 'Active' : 'Offline'}
          </div>
          <div className="telemetry-meta">
            Meta Llama 3.2 Vision
          </div>
        </div>

        <div className="telemetry-card" id="telemetry-tasks">
          <div className="telemetry-label">Backend Tasks</div>
          <div className="telemetry-val">
            {tasks.length}
          </div>
          <div className="telemetry-meta">
            {tasks.filter(t => !t.completed).length} active, {tasks.filter(t => t.completed).length} completed
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
                <strong>AI Engine:</strong> NVIDIA NIM (Meta Llama 3.2)
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
                      <div className="code-box">{breakdownData.codeSnippet}</div>
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
              <div className="modal-title">
                <span>🤖 Nexus AI Copilot</span>
                <span className="ai-badge" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                  Llama 3.2
                </span>
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
                  {msg.content}
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
    </div>
  );
}
