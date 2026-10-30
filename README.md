# TaskFlow

TaskFlow is a project and task management app. The React/Vite frontend connects to the Express/MongoDB API for authentication, projects, tasks, comments, and notifications.

## Requirements

- Node.js 20.19 or newer
- MongoDB Community Server running locally, or a MongoDB Atlas deployment

## Run the frontend

From the project root:

```bash
npm install
npm run dev
```

The Vite development server uses `http://localhost:5173` by default.
The frontend API client defaults to `http://localhost:5000/api`. To change it, copy `.env.example` to `.env` in the project root and set `VITE_API_BASE_URL`.

## Configure and run the backend

Install backend dependencies:

```bash
cd server
npm install
```

Copy `server/.env.example` to `server/.env` and set:

- `PORT` — API port; defaults to `5000`.
- `MONGODB_URI` — your own local MongoDB or Atlas connection URI.
- `JWT_SECRET` — a private random secret of at least 32 characters.
- `CLIENT_URL` — allowed frontend origin(s), comma-separated if needed.

Do not commit `server/.env` or share its secret values. Start the API from the `server` directory:

```bash
npm run dev
```

Use `npm start` for a non-watch run. `GET /api/health` reports whether MongoDB is connected; it returns HTTP 503 while the database is unavailable.

## API overview

All endpoints use JSON. Authenticated endpoints require `Authorization: Bearer <token>`.

The browser stores the JWT in `localStorage` so sessions can be restored after refresh. This is not equivalent to an HttpOnly cookie; protect the app against script injection and use an appropriate cookie/session design before production deployment.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API and MongoDB readiness |
| POST | `/api/auth/register` | Register and receive a JWT |
| POST | `/api/auth/login` | Authenticate and receive a JWT |
| GET | `/api/auth/me` | Get the authenticated user's safe profile |
| GET, POST | `/api/projects` | List accessible projects or create one |
| GET | `/api/projects/:id` | Read an owned/member project |
| PUT, DELETE | `/api/projects/:id` | Update or delete a project as its owner |
| GET, POST | `/api/tasks` | List accessible tasks or create one |
| GET, PUT, DELETE | `/api/tasks/:id` | Read, update, or delete an accessible task |
| GET, POST | `/api/tasks/:taskId/comments` | List or add task comments |
| DELETE | `/api/tasks/:taskId/comments/:commentId` | Delete an authorized comment |
| GET | `/api/notifications` | List the current user's notifications |
| PATCH | `/api/notifications/:id/read` | Mark the current user's notification as read |

Task listing supports `project`, `status`, `priority`, `assignedTo` (a user ID or `me`), `page`, and `limit` query parameters. Project and task collections are paginated.

## Validation

From the project root:

```bash
npm run build
npm run lint
```

For backend syntax checks, run `npm run check` from `server`.

## Current scope

- Dashboard counts, task lists, project cards, and deadline views use data returned by the API. Project progress is derived from completed tasks.
- Project owners can edit/delete their projects. The backend has no user directory endpoint, so the current UI displays existing project members but does not invite new members.
- The backend has no activity-history or profile-update API. Recent activity is identified as unavailable; profile fields are read-only.
- No Socket.IO or real-time updates are included.
- Database-backed flows require a configured MongoDB instance and are not verified as part of this source-only setup.
