# GenLink KH — Admin Dashboard

The staff-facing administration portal for **GenLink KH**. It provides platform administrators, moderators, and support staff with a secure, audited, and comprehensive management interface to operate the platform, moderate content, monitor growth, and enforce security policies.

GenLink Admin is an independent web application that communicates with the centralized **Spring Boot backend** through a dedicated `/api/v1/admin/**` API surface.

---

## 📋 Table of Contents

- [About GenLink & The Admin Dashboard](#-about-genlink--the-admin-dashboard)
  - [Core Features & Modules](#core-features--modules)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started & Local Setup](#-getting-started--local-setup)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Development Server](#running-the-development-server)
  - [Backend Integration & CORS](#backend-integration--cors)
- [Available Scripts & Quality Gates](#-available-scripts--quality-gates)
- [Key Conventions](#-key-conventions)
- [Development Team](#-development-team)

---

## 🌟 About GenLink & The Admin Dashboard

**GenLink KH** is a community and intergenerational engagement platform in Cambodia designed to connect youth and seniors through shared activities, mentorship, learning, and cultural exchange.

### Why the Admin Dashboard?
To support the mobile ecosystem (built with Flutter) and safeguard the community, the **Admin Dashboard** provides the administrative control center:

- **Operational Safety**: Eliminates direct database manipulation by giving staff structured, validated, and audited workflows.
- **Actionable Moderation**: Ingests, processes, and tracks community reports (posts, discussions, comments) with standardized resolution workflows.
- **Granular RBAC**: Replaces binary permissions with fine-grained role-based access control, ensuring least-privilege administration.
- **Auditing & Accountability**: Records immutable audit logs for every privileged action taken by administrators.
- **Platform Analytics**: Delivers real-time business and product visibility (growth metrics, DAU/MAU, user demographics, engagement trends).

### Core Features & Modules

| Module | Description |
|---|---|
| **User Management** (`features/users`) | Search, filter, and inspect user profiles; view activity history; issue warnings; ban/suspend/reactivate accounts; reset credentials; trigger forced logouts; perform bulk actions. |
| **Moderation & Enforcement** (`features/enforcement`) | Review reported discussions, posts, and comments; apply strikes, suspensions, content removal, or dismiss reports with resolution logs. |
| **Role-Based Access Control** (`features/roles`) | Manage staff roles, permissions matrices, privilege hierarchies, and administrative assignments. |
| **Admin Directory** (`features/admins`) | Manage staff profiles, onboard administrators, and configure per-admin operational capabilities. |
| **Authentication & 2FA / MFA** (`features/auth`) | Multi-factor authentication (TOTP via QR code), secure session cookie authentication, rate limiting, and credential recovery. |
| **Audit Trails** (`features/audit`) | Query and inspect structured audit records capturing actor, action, target entity, timestamp, IP address, and metadata. |
| **Platform Analytics** (`features/analytics`) | Interactive charts tracking active users (DAU/MAU), community growth, retention curves, demographic distributions, and system throughput. |

---

## 🛠 Technology Stack

### Core Framework & Runtime
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React Server Components & leaf-level Client Components)
- **Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode enabled)
- **Runtime**: [Node.js](https://nodejs.org/) `>= 22` (Pinned in `.nvmrc`)
- **Package Manager**: [pnpm](https://pnpm.io/) `11.x`

### UI & Design System
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/postcss`
- **Component Primitives**: [shadcn/ui](https://ui.shadcn.com/) backed by [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Theming**: [next-themes](https://github.com/pacocoursey/next-themes) (Light/Dark mode support)
- **Animations**: `tw-animate-css`
- **Toast Notifications**: [Sonner](https://sonner.emilkowal.ski/)

### State Management & Data Fetching
- **Server State & Cache**: [@tanstack/react-query v5](https://tanstack.com/query/latest) (with TanStack Query Devtools)
- **Data Tables**: [@tanstack/react-table v8](https://tanstack.com/table/latest) (Sorting, filtering, pagination, and virtualization)
- **Charts & Visualizations**: [Recharts](https://recharts.org/) (Custom accessible chart palettes)

### Forms, Validation & Utilities
- **Form Handling**: [React Hook Form](https://react-hook-form.com/)
- **Schema Validation**: [Zod v4](https://zod.dev/) via `@hookform/resolvers`
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)
- **2FA / MFA Generation**: `qrcode` & `@types/qrcode`

### Testing & Code Quality
- **Unit & Integration Testing**: [Vitest 4](https://vitest.dev/) with JSDOM and Testing Library
- **Network Mocking**: [MSW (Mock Service Worker)](https://mswjs.io/)
- **Linting & Formatting**: ESLint 9 (`eslint-config-next`) with custom module boundary enforcement
- **Accessibility & Contrast**: Custom WCAG 2.1 AA automated contrast validation script (`scripts/check-contrast.mjs`)

---

## 📁 Project Structure

```text
genlink-admin/
├── app/                  # Next.js App Router (pages, layouts, route handlers)
├── components/           # Shared reusable UI components (shadcn/ui & generic widgets)
├── config/               # Application-level configuration & menu definitions
├── features/             # Domain-driven feature modules (Strictly isolated)
│   ├── admins/           # Staff accounts & admin directory
│   ├── analytics/        # Business intelligence & activity charts
│   ├── audit/            # Security audit trail & log inspection
│   ├── auth/             # Login, session cookies, MFA / TOTP setup
│   ├── enforcement/      # Moderation queues, bans, and infractions
│   ├── roles/            # RBAC permissions & role assignments
│   └── users/            # User management, profile drawers & bulk actions
├── hooks/                # Global React hooks
├── i18n/                 # Internationalization configuration
├── lib/                  # Utility libraries, HTTP client, formatters & helpers
│   ├── api/              # Fetch wrapper, error handlers & endpoint mapping
│   ├── config/           # Environment variable parsers (Single point of access)
│   └── ui/               # Formatter functions (Timezone: Asia/Phnom_Penh)
├── messages/             # Localization dictionary JSON files (en, km)
├── mocks/                # Mock Service Worker (MSW) handlers for local testing
├── providers/            # React context providers (QueryClient, ThemeProvider, etc.)
├── schemas/              # Cross-domain Zod schemas
└── types/                # Global TypeScript type definitions
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites

Ensure you have installed:
- **Node.js**: `v22.x` or higher (Verify with `node -v` or run `nvm use`)
- **pnpm**: `v11.x` or higher (`corepack enable` or `npm install -g pnpm`)

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd genlink-admin
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env.local
```

Default settings in `.env.example`:
```env
# Client-side configuration (Public)
NEXT_PUBLIC_BASE_PATH=/admin
NEXT_PUBLIC_API_BASE_URL=/api/v1
NEXT_PUBLIC_TIMEZONE=Asia/Phnom_Penh
NEXT_PUBLIC_API_MOCKING=false
NEXT_PUBLIC_ENVIRONMENT=development

# Server-side configuration
ADMIN_COOKIE_SECURE=false
ADMIN_API_ORIGIN=http://localhost:8888
```

### Running the Development Server

Start the local Next.js dev server:
```bash
pnpm dev
```

Open your browser and navigate to:
👉 **[http://localhost:3000/admin](http://localhost:3000/admin)**

> **Note**: The portal is served under the `/admin` base path. Visiting the root `http://localhost:3000/` will automatically redirect to `/admin`.

### Backend Integration & CORS

In local development, the admin web portal runs on `http://localhost:3000` while the Spring Boot backend runs on `http://localhost:8888`:

1. **Proxying**: `next.config.ts` automatically proxies `/api/v1/**` requests to `ADMIN_API_ORIGIN` (`http://localhost:8888`).
2. **Backend CORS Requirement**: Ensure your local Spring Boot backend specifies the following environment variable:
   ```env
   ADMIN_CORS_ORIGINS=http://localhost:3000
   ```
   *Without this setting, API calls to the backend will be rejected with `403 Invalid CORS request`.*

---

## 🧪 Available Scripts & Quality Gates

Run the following commands to test, lint, and build the application:

| Command | Purpose |
|---|---|
| `pnpm dev` | Starts the Next.js development server with hot-reload at `/admin` |
| `pnpm build` | Builds the production-ready bundle |
| `pnpm start` | Runs the compiled production build locally |
| `pnpm lint` | Runs ESLint 9 checks (including cross-feature boundary rules) |
| `pnpm typecheck` | Validates TypeScript types across the entire codebase (`tsc --noEmit`) |
| `pnpm test` | Runs all unit and integration tests via Vitest |
| `pnpm test:watch` | Runs Vitest in interactive watch mode |
| `pnpm check:contrast` | Audits color tokens against WCAG 2.1 AA accessibility contrast standards |

To run the complete continuous integration (CI) suite locally:
```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm check:contrast && pnpm build
```

---

## 📐 Key Conventions

- **Feature Boundary Isolation**: A feature inside `features/` must **never** import from another feature. Shared code must reside in `components/`, `lib/`, `hooks/`, or `types/`. This is enforced by ESLint.
- **Server Components & Client Leaves**: Keep page routes as Server Components whenever possible. Place `'use client'` strictly at the interactive leaf components.
- **Timezone Standardization**: All timestamps and date displays are pinned to `Asia/Phnom_Penh` via centralized formatters in `lib/ui/`.
- **Environment Isolation**: `lib/config/env.ts` is the single source of truth for `process.env`. Avoid direct references to environment variables in application logic.
- **API Error Handling**: Code logic relies on standardized `errorCode` contracts rather than parsing localized error strings.

---

## 👥 Development Team

### **Full Stack Developers**
- **Ren Makara**
- **Heng Chansela**
- **Sokny Enat**
- **Chhaeng Sokuntheara**

---

*Part of the **GenLink KH** Project — Connecting generations through technology.*
