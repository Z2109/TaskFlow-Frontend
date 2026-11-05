# TaskFlow Frontend

A modern project and team management workspace built with **Next.js, React, JavaScript, and Tailwind CSS**. TaskFlow helps teams organize organizations, projects, tasks, members, permissions, and productivity from one dashboard.

**Live application:** https://task-flow-frontend-virid.vercel.app  
**Backend API:** https://taskflow-backend-i7ax.onrender.com  
**Backend repository:** https://github.com/Z2109/Task-Flow

---

## Features

- **Authentication:** registration, login, protected workspace, and JWT-based API authentication.
- **Organization workspace:** organization context and member-oriented workflows.
- **Projects:** create, view, update, and manage project information and status.
- **Tasks:** task creation, assignment, status and priority workflows.
- **Team management:** view members and work with role-based access.
- **RBAC:** permission-aware navigation and access to workspace features.
- **Dashboard and analytics:** project/task metrics and visual reporting.
- **Notifications and activity:** in-app feedback and notification workflows.
- **AI Assistant:** chat interface connected to the backend AI endpoint.
- **Responsive interface:** application layout and reusable UI components.

> Feature availability in the interface depends on the permissions assigned to the signed-in user. AI chat history is currently handled in the client experience; persistent chat history is not documented as a backend feature.

## Tech Stack

| Technology | Usage |
|---|---|
| Next.js 16 | React framework and App Router |
| React 19 | UI components |
| JavaScript | Application language |
| Tailwind CSS 4 | Styling |
| Redux Toolkit | Application state |
| React Redux | Redux integration |
| Axios | Backend HTTP requests |
| React Toastify | Toast notifications |
| Recharts | Charts and analytics |
| Lucide React | Icons |
| React Hook Form | Form handling |

## Repository Structure

The frontend is maintained separately from the backend.

```text
TaskFlow-Frontend/
├── public/
├── src/
│   ├── app/                 # App Router pages and layouts
│   ├── components/          # Reusable UI components
│   ├── services/            # Axios/API service layer
│   ├── store/                # Redux store and slices
│   └── ...
├── .env.local               # Local environment variables (not committed)
├── package.json
└── README.md
```

The exact folders may evolve as the application grows.

## Getting Started

### Prerequisites

- Node.js and npm
- Git
- A running TaskFlow backend, either locally or the deployed API

### 1. Clone the repository

```bash
git clone https://github.com/Z2109/TaskFlow-Frontend.git
cd TaskFlow-Frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the frontend project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

For the deployed backend, use:

```env
NEXT_PUBLIC_API_URL=https://taskflow-backend-i7ax.onrender.com/api
```

Use the local URL when running a local backend. Do not commit environment files or secrets.

### 4. Start the development server

The backend uses port `3000` in the local setup, so run the frontend on `3001`:

```bash
npm run dev -- -p 3001
```

Open http://localhost:3001 in your browser.

### 5. Create a production build

```bash
npm run build
npm run start
```

## Backend Integration

The frontend communicates with the TaskFlow REST API through Axios. Configure `NEXT_PUBLIC_API_URL` to point to the backend API base URL, including the `/api` prefix.

- **Backend source:** https://github.com/Z2109/Task-Flow
- **Production API:** https://taskflow-backend-i7ax.onrender.com
- **Production frontend:** https://task-flow-frontend-virid.vercel.app

Authentication uses a JWT token stored in the browser's local storage in the current implementation. Treat this as a client-side credential and never expose it in logs or public code.

## Deployment

The frontend is deployed on **Vercel**.

When configuring the Vercel project, set the environment variable:

```env
NEXT_PUBLIC_API_URL=https://taskflow-backend-i7ax.onrender.com/api
```

Ensure the backend CORS configuration allows the deployed frontend origin. Redeploy the frontend after changing build-time environment variables.

## Related Repository

The backend API, data models, authentication, organization logic, permissions, and business rules are maintained in the [Task-Flow backend repository](https://github.com/Z2109/Task-Flow).

## Developer

**Zaid Zafar**  
GitHub: https://github.com/Z2109

---

**TaskFlow — Plan Smarter. Collaborate Better. Deliver Faster.**
