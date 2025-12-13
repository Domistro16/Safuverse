# SafuAcademy Backend

Express.js backend for the SafuAcademy Web3 course platform with PostgreSQL and BSC blockchain integration.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain**: BSC (Binance Smart Chain) via ethers.js v6
- **Auth**: Wallet-based authentication with JWT

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- BSC RPC endpoint
- Relayer wallet with BNB for gas

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values
# - DATABASE_URL
# - JWT_SECRET
# - LEVEL3_COURSE_ADDRESS
# - RELAYER_PRIVATE_KEY

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Start development server
npm run dev
```

## API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/nonce` | POST | Get nonce for wallet to sign |
| `/api/auth/verify` | POST | Verify signature and get JWT |
| `/api/auth/me` | GET | Get current user info |

### Courses

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/courses` | GET | List all courses |
| `/api/courses/:id` | GET | Get course with lessons |
| `/api/courses/:id/progress` | GET | Get user's progress |
| `/api/courses/:id/enroll` | POST | Enroll in course |
| `/api/courses/:id/sync` | POST | Sync to blockchain |

### Lessons

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/lessons/:id` | GET | Get lesson details |
| `/api/lessons/:id/start` | POST | Start lesson session |
| `/api/lessons/:id/complete` | POST | Complete lesson |
| `/api/lessons/:id/progress` | POST | Update progress |
| `/api/lessons/:id/quiz` | GET | Get quiz questions |
| `/api/lessons/:id/quiz/submit` | POST | Submit quiz |

### User

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/profile` | GET | Get user profile |
| `/api/user/blockchain-status` | GET | Check on-chain status |
| `/api/user/transactions` | GET | Get transaction history |
| `/api/user/stats` | GET | Get user statistics |

### Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with relayer status |

## Environment Variables

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
RPC_URL=https://bsc-dataseed.binance.org/
CHAIN_ID=56
LEVEL3_COURSE_ADDRESS=0x...
RELAYER_PRIVATE_KEY=0x...
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Prisma Studio
