# Tax Automation Portal — Frontend

React + Vite frontend for the Tax Automation Portal. Connects to the backend at `https://tax-automation-backend.onrender.com`.

---

## Tech Stack

- **React 18** with React Router v6
- **Vite 5** (build tool)
- **Tailwind CSS** (styling)
- **Axios** with JWT auto-refresh interceptor
- **TanStack Query** (server state)
- **React Hook Form** (form handling)
- **Recharts** (charts/analytics)
- **React Hot Toast** (notifications)

---

## Local Development

### Prerequisites

- Node.js 18+ and npm

### Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
   > For local development, the Vite dev server also proxies `/api` requests to `http://localhost:8000`, so you can leave `VITE_API_BASE_URL` unset and rely on the proxy.

4. **Start the dev server**
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:5173`

5. **Build for production**
   ```bash
   npm run build
   ```
   Output goes to `./dist`

6. **Preview the production build locally**
   ```bash
   npm run preview
   ```

---

## Deploying to Render

### Option A — Automatic via `render.yaml` (Recommended)

The `render.yaml` in this repo defines the static site service. Render will pick it up automatically.

1. Push this repository to GitHub/GitLab.
2. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect your repository. Render will detect `render.yaml` and configure the service.
4. Click **Apply**. The site will build and deploy automatically.

The deployed URL will be something like `https://tax-automation-frontend.onrender.com`.

---

### Option B — Manual Setup via Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Static Site**.
2. Connect your GitHub/GitLab repository.
3. Fill in the settings:

   | Setting | Value |
   |---|---|
   | **Name** | `tax-automation-frontend` |
   | **Branch** | `main` (or your default branch) |
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `dist` |

4. Under **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://tax-automation-backend.onrender.com/api` |

5. Under **Redirects/Rewrites**, add a rewrite rule for SPA routing:

   | Source | Destination | Action |
   |---|---|---|
   | `/*` | `/index.html` | **Rewrite** |

   > This is required so that React Router handles all routes (e.g. `/consultant/dashboard`) instead of Render returning a 404.

6. Click **Create Static Site**. The first build will start immediately.

---

## Environment Variables

| Variable | Description | Default (dev) |
|---|---|---|
| `VITE_API_BASE_URL` | Full base URL of the backend API | `http://localhost:8000/api` |

> **Note:** Vite only exposes variables prefixed with `VITE_` to the browser bundle. Never put secrets in these variables.

---

## CORS Configuration

Since the frontend and backend run on different domains in production, ensure the backend (Django) has the frontend's Render URL in its `CORS_ALLOWED_ORIGINS` setting:

```python
# settings.py (backend)
CORS_ALLOWED_ORIGINS = [
    "https://tax-automation-frontend.onrender.com",
    # add any custom domain here
]
```

---

## Project Structure

```
src/
├── main.jsx              # App entry point, QueryClient setup
├── App.jsx               # Route definitions (client + consultant roles)
├── index.css             # Global styles
├── components/
│   ├── common/           # Shared UI components (FileUpload, Modal, etc.)
│   └── layout/           # Role-specific layouts and navigation
├── contexts/
│   └── AuthContext.jsx   # JWT auth state, login/logout
├── pages/
│   ├── auth/             # Login page
│   ├── client/           # Client dashboard, tax form, confirmation
│   └── consultant/       # Consultant dashboard, client management, archive
├── services/
│   └── api.js            # Axios instance with JWT interceptors
└── utils/
    └── format.js         # Number/date formatting helpers
```

---

## User Roles

| Role | Login | Routes |
|---|---|---|
| **Client** | Email + password | `/client/dashboard`, `/client/tax-form`, `/client/confirm/:id` |
| **Consultant** | Email + password | `/consultant/dashboard`, `/consultant/clients`, `/consultant/archive` |

Routes are protected via `ProtectedRoute` — unauthenticated users are redirected to `/login`.

---

## Auto-Deploy on Push

Once connected to Render, every push to the configured branch triggers a new build and deploy automatically. No manual steps needed.
