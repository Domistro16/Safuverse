# SafuAcademy Vercel Deployment Guide

Deploy frontend + serverless API functions to Vercel.

---

## Architecture on Vercel

| Component | Location | Description |
|-----------|----------|-------------|
| Frontend | `/frontend` | Vite React app |
| API | `/api/*.ts` | Serverless functions |
| Database | External | PostgreSQL (Supabase, Neon, Railway) |

---

## Step 1: Set Up Database

Vercel doesn't include PostgreSQL - use one of these:

### Recommended: Neon (Free Tier)
1. Go to [neon.tech](https://neon.tech)
2. Create project
3. Copy connection string

### Alternative: Supabase (Free Tier)
1. Go to [supabase.com](https://supabase.com)
2. Create project → Project Settings → Database
3. Copy connection string

---

## Step 2: Push Schema to Database

```bash
cd backend

# Set DATABASE_URL temporarily
$env:DATABASE_URL="postgresql://user:pass@host/db"

# Push schema
npx prisma db push

# Generate client (for local dev)
npx prisma generate
```

---

## Step 3: Deploy to Vercel

### Option A: Via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```

### Option B: Via GitHub
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import repository
4. It will auto-detect Vite

---

## Step 4: Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Random 32+ char string | ✅ |
| `JWT_EXPIRES_IN` | `7d` | No |
| `RPC_URL` | `https://bsc-dataseed.binance.org/` | For blockchain |
| `CHAIN_ID` | `56` | For blockchain |
| `LEVEL3_COURSE_ADDRESS` | Smart contract address | For blockchain |
| `RELAYER_PRIVATE_KEY` | Wallet private key | For blockchain |

---

## API Endpoints on Vercel

| Endpoint | File | Method |
|----------|------|--------|
| `/api/health` | `api/health.ts` | GET |
| `/api/auth/nonce` | `api/auth/nonce.ts` | POST |
| `/api/auth/verify` | `api/auth/verify.ts` | POST |
| `/api/courses` | `api/courses/index.ts` | GET |

---

## Project Structure for Vercel

```
safuacademy/
├── api/                    ← Serverless functions
│   ├── health.ts
│   ├── auth/
│   │   ├── nonce.ts
│   │   └── verify.ts
│   └── courses/
│       └── index.ts
├── frontend/               ← Vite app
│   ├── src/
│   ├── dist/               ← Built by Vercel
│   └── package.json
├── backend/                ← Prisma schema source
│   └── prisma/
│       └── schema.prisma
├── vercel.json             ← Vercel config
└── package.json
```

---

## Vercel-Specific Considerations

### Cold Starts
Serverless functions have cold starts (~500ms). For better performance:
- Use [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions) for simple endpoints
- Consider a persistent backend for complex APIs

### Prisma on Vercel
Add to `package.json` scripts:
```json
{
  "postinstall": "prisma generate"
}
```

Or use `vercel.json`:
```json
{
  "installCommand": "npm install && npx prisma generate"
}
```

### Database Connection Pooling
For production, use connection pooling:
```
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1"
```

---

## Testing Locally

```bash
# Install Vercel CLI
npm install -g vercel

# Run locally (simulates Vercel)
vercel dev
```

---

## Comparison: Vercel vs cPanel

| Feature | Vercel | cPanel |
|---------|--------|--------|
| **Deployment** | Git push → auto deploy | Manual upload |
| **Backend** | Serverless functions | Full Node.js server |
| **Database** | External only | Can host PostgreSQL |
| **Cold starts** | Yes (500ms) | No |
| **Free tier** | Generous | Depends on host |
| **WebSockets** | Limited | Full support |
| **Best for** | Frontend + simple API | Complex backend |

---

## When to Use Which

**Choose Vercel if:**
- ✅ Simple API endpoints
- ✅ Want automatic deployments
- ✅ Frontend-focused app
- ✅ Free hosting is priority

**Choose cPanel/Railway if:**
- ✅ Complex backend logic
- ✅ Need WebSockets
- ✅ Want to avoid cold starts
- ✅ Self-host database
