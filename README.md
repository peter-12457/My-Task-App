# TaskFlow React Application

A React and TypeScript task dashboard integrated with the deployed TaskFlow Next.js API.

## Technologies

- React 19
- TypeScript
- Vite
- Auth.js Credentials session authentication
- TaskFlow REST API

## Installation

Requirements: Node.js and npm.

```sh
npm install
```

Copy the public environment template:

```sh
cp .env.example .env
```

On Windows PowerShell, you can instead run:

```powershell
Copy-Item .env.example .env
```

The default Vite configuration uses the same-origin `/api` path:

```text
VITE_API_BASE_URL=/api
```

## Development

Start the Vite development server:

```sh
npm run dev
```

Vite proxies `/api` requests to:

```text
https://task-flow-six-rouge.vercel.app
```

The development proxy preserves browser cookies while keeping API calls same-origin from the React application.

## Available Features

- Credentials registration and login
- Auth.js session restoration
- Logout
- Protected task dashboard
- Task create, edit, and delete operations
- Debounced title and description search
- Status, priority, assignee, and due-date filters
- Server-side pagination
- Loading, success, empty, validation, and network error states
- Responsive task and form layout

## Authentication

Authentication uses Auth.js cookie-based Credentials sessions, not personal access tokens.

Registration uses `POST /api/register`.

Login uses:

- `GET /api/auth/providers`
- `GET /api/auth/csrf`
- `POST /api/auth/callback/credentials`
- `GET /api/auth/session`

Logout uses a fresh CSRF token and `POST /api/auth/signout`.

Passwords are submitted through the supported API and are cleared from form state after successful or failed submission where appropriate. Passwords and other secrets must not be added to browser environment variables.

Do not mix `/api/v1` Bearer-token routes with these `/api/tasks` session routes.

## API Integration

Reusable API code is in `src/services/`.

Session and task calls use `credentials: "include"`. Task routes are authenticated and require a valid Auth.js session.

Integrated routes:

- `GET /api/auth/providers`
- `GET /api/auth/csrf`
- `POST /api/auth/callback/credentials`
- `GET /api/auth/session`
- `POST /api/auth/signout`
- `POST /api/register`
- `GET /api/tasks`
- `GET /api/tasks/{id}`
- `POST /api/tasks`
- `PATCH /api/tasks/{id}`
- `DELETE /api/tasks/{id}`
- `GET /api/profile`
- `PATCH /api/profile`
- `POST /api/profile/password`

Profile endpoints are documented by the backend but are not currently included in the React UI.

## Environment and Security

Only public Vite values should use the `VITE_` prefix. Never place private keys, database credentials, passwords, or personal access tokens in Vite environment variables.

`.env`, `.env.*`, and local environment files are ignored. `.env.example` is intentionally public and contains no secrets.

The application does not store passwords or personal access tokens in localStorage or sessionStorage. It does not disable CSRF protection or bypass backend origin checks.

## Quality Checks

```sh
npm run build
npm run lint
```

There is currently no configured automated test runner or test suite.

## Known Limitations

- Browser authentication must be tested with valid TaskFlow credentials.
- Registration, login, logout, refresh persistence, and task CRUD flows are deployment-dependent.
- The Vite development proxy only works during local Vite development.
- A static-only production build cannot expose TaskFlow API routes or preserve session authentication without a compatible same-origin reverse proxy.
- Profile and password-management screens are not yet included.
- Automated browser tests are not currently configured.

## Deployment

Before production deployment:

1. Provide a same-origin `/api` proxy on the production host.
2. Configure TaskFlow to trust the exact production frontend origin.
3. Preserve Secure, HttpOnly Auth.js cookies and CSRF cookies.
4. Deploy the frontend and proxy without exposing secrets.
5. Test registration, login, session refresh, logout, and task CRUD with the production proxy.

Do not rely on `vite.config.ts` proxy settings in the generated static build. No deployment, commit, or push should occur without approval.
