# HydraFlow Aqua — Premium Computational Hydration E-Commerce

HydraFlow is a premium, billion-dollar lifestyle hydration platform engineered with cutting-edge computational thermal technology, high-end editorial designs inspired by Apple/LARQ/Stripe, and a complete multi-tier dashboard experience.

---

## 1. System Architecture

```mermaid
graph TD
  Client[Next.js Client App Router] <--> |HTTPS / JSON| Server[Express API Server Node.js]
  Server <--> |Prisma ORM| DB[(Neon Serverless PostgreSQL)]
  Server <--> |Razorpay API| Gateway[Razorpay Sandbox]
  Server <--> |Google GenAI SDK| Gemini[Gemini 1.5 Flash Model]
  Server <--> |Cloudinary SDK| Storage[Cloudinary Asset Storage]
```

### Key Components
- **Web Frontend**: Built using Next.js App Router, Tailwind CSS, Framer Motion, and Zustand. Features a fullscreen 3D image-sequence hero scroll animation.
- **Backend API**: Engineered using Express.js, TypeScript, and Node.js. Uses Helmet, CORS, and Express-Rate-Limit for security hardening.
- **Database**: Serverless PostgreSQL hosted on Neon, managed with Prisma ORM.

---

## 2. Directory Folder Structure

```
├── apps
│   ├── api (Express Backend API)
│   │   ├── prisma (Database schema & migrations)
│   │   └── src
│   │       ├── index.ts (Server initialization)
│   │       ├── prisma.ts (Client instantiation)
│   │       └── routes (Feature routers)
│   └── web (Next.js App Router Frontend)
│       └── src
│           ├── app (Layouts, pages, sitemaps, robots configuration)
│           ├── components (Visual interfaces & floating AI Assistant)
│           └── store (Zustand state managers)
└── packages
    └── shared-types (Workspace shared typescript models)
```

---

## 3. Core API Documentation

### Authentication `/auth`
- `POST /auth/register`: Register customer or seller credentials.
- `POST /auth/login`: Authenticate email and password.
- `POST /auth/logout`: Discard secure session tokens.
- `GET /auth/me`: Retrieve active profile data.

### Products `/api/products`
- `GET /api/products`: List approved catalog items.
- `GET /api/products/:id`: Fetch unique bottle specifications.

### Custom Portals & Services
- `/api/profile/*`: Address CRUD, notification logs, and warranty activations.
- `/api/seller/*`: Merchant orders, products catalog overrides, and store configuration settings.
- `/api/admin/*`: System overview, user bans, merchant approvals, and audit logs.
- `/api/ai/*`: Google Gemini chat assistant, comparisons, and AI recommendations.
- `/api/payment/*`: Razorpay order creations and invoice generators.

---

## 4. Environment Variables Setup Guide

Create a `.env` file in the root workspace directory with the following properties:

```env
PORT=5001
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
FRONTEND_URL="http://localhost:3000"

JWT_SECRET="your_jwt_secret"
JWT_REFRESH_SECRET="your_jwt_refresh_secret"

GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

RAZORPAY_KEY_ID="rzp_test_your_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"

GEMINI_API_KEY="your_gemini_api_key"
```

---

## 5. Deployment Guide

### Backend & Database (Railway / Render)
1. Link your GitHub repository to your host.
2. Specify the root directory or root package location `/apps/api`.
3. Map environment variables in the settings panel.
4. Run `npx prisma db push` to initialize tables in the production Neon instance.
5. Set start command: `npm run build && npm run start`.

### Frontend (Vercel)
1. Import the Next.js workspace module under `apps/web`.
2. Configure frontend variables (e.g. `NEXT_PUBLIC_API_URL` pointing to your deployed API server).
3. Vercel automatically detects Next.js build options and deploys.

---

## 6. Developer Guidelines

- **Linting & Formatting**: Clean code checks using `npm run lint` and `npm run typecheck`.
- **Database Modifies**: Make updates in `prisma/schema.prisma` and synchronize tables using `npx prisma db push`.
