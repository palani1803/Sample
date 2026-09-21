# Full-Stack React + Node.js Application

A unified full-stack application featuring a **React (Vite)** frontend and an **Express (Node.js)** backend with NVIDIA AI integrations.

---

## 🚀 How to Run the Application

### Method 1: Run Both Frontend & Backend Together (Recommended)

From the **root directory** (`Sample/`), run:

```bash
npm run dev
```

This single command uses `concurrently` to launch:
- 🔵 **Backend (Express)**: [http://localhost:5000](http://localhost:5000)
- 🟣 **Frontend (Vite + React)**: [http://localhost:5173](http://localhost:5173)

---

### Method 2: Run Separately in Two Terminals

If you prefer separate terminals:

#### **Terminal 1: Backend Server**
```bash
cd server
npm run dev
```
*(Starts Express on port 5000)*

#### **Terminal 2: Frontend Client**
```bash
cd client
npm run dev
```
*(Starts Vite on port 5173 with proxy to backend)*

---

## 🛠️ Port Conflict Troubleshooting

If you see an error like `Error: listen EADDRINUSE: address already in use :::5000`:

### Why this happens:
1. You ran `npm run dev` in the `server` directory **and** also ran `npm run dev` in the root (which tries to start the server again).
2. A background Node.js process is still holding port 5000 or 5173.

### How to kill the process blocking port 5000:

#### In Windows PowerShell:
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
```

#### In Windows Command Prompt (CMD):
```cmd
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

---

## 📁 Project Structure

```
Sample/
├── package.json        # Root package.json (runs both client & server)
├── server/             # Express.js backend (Port 5000)
│   ├── .env            # Backend environment variables
│   ├── index.js        # Server entry point & REST APIs
│   └── aiService.js    # NVIDIA AI integration
└── client/             # React (Vite) frontend (Port 5173)
    ├── .env            # Client environment variables
    ├── vite.config.js  # Vite config + Proxy to backend
    └── src/            # React components & UI
```
