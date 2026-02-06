'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function APIDocsPage() {
  const router = useRouter()

  return (
    <div className="landing-page-container">
      <div className="api-container">
        <button
          className="mb-8 flex items-center gap-2 text-gray-500 hover:text-black transition-colors"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="w-4 h-4" /> Back Home
        </button>

        <h2 className="text-4xl font-extrabold mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Developer API.
        </h2>
        <p className="text-xl text-gray-500 mb-12">
          Integrate Safuverse identity directly into your dApps and agents.
        </p>

        {/* Identity Resolution */}
        <div className="api-section">
          <h3 className="api-header">Identity Resolution</h3>
          <p className="api-sub">Resolve .safu names to addresses and fetch metadata.</p>

          <div className="endpoint-card">
            <div className="ep-header">
              <span className="ep-method get">GET</span>
              <span className="ep-url">https://api.safuverse.com/v1/resolve/&#123;name&#125;</span>
            </div>
            <div className="ep-body">
              <p className="ep-desc">Returns the wallet address and metadata associated with a .safu name.</p>
              <pre className="ep-code">{`curl https://api.safuverse.com/v1/resolve/nadya.safu \\
  -H "Authorization: Bearer YOUR_API_KEY"

// Response
{
  "name": "nadya.safu",
  "address": "0x71C9...8A21",
  "owner": "0x71C9...8A21",
  "attributes": {
    "is_human": true,
    "trust_score": 98
  }
}`}</pre>
            </div>
          </div>
        </div>

        {/* Agent Minting */}
        <div className="api-section">
          <h3 className="api-header">Agent Minting</h3>
          <p className="api-sub">Programmatic minting for autonomous agents via x402 standard.</p>

          <div className="endpoint-card">
            <div className="ep-header">
              <span className="ep-method post">POST</span>
              <span className="ep-url">https://api.safuverse.com/v1/mint/agent</span>
            </div>
            <div className="ep-body">
              <p className="ep-desc">Mints a new agent identity. Requires Agent-Auth signature.</p>
              <pre className="ep-code">{`curl -X POST https://api.safuverse.com/v1/mint/agent \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "defi-bot-01",
    "agent_standard": "x402",
    "owner_address": "0x..."
  }'`}</pre>
            </div>
          </div>
        </div>

        {/* Registration Relay */}
        <div className="api-section">
          <h3 className="api-header">Registration Relay</h3>
          <p className="api-sub">For non-native agents (Claude, Grok, etc.) that need gasless registration via relay.</p>

          <div className="endpoint-card">
            <div className="ep-header">
              <span className="ep-method post">POST</span>
              <span className="ep-url">/api/register/relay</span>
            </div>
            <div className="ep-body">
              <p className="ep-desc">Builds and submits a UserOperation for domain registration. Supports EIP-2612 permit for gasless USDC approval.</p>
              <pre className="ep-code">{`curl -X POST /api/register/relay \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "my-agent",
    "owner": "0x...",
    "deployWallet": true,
    "walletSalt": 12345
  }'

// Response
{
  "success": true,
  "txHash": "0x...",
  "walletAddress": "0x..."
}`}</pre>
            </div>
          </div>

          <div className="endpoint-card">
            <div className="ep-header">
              <span className="ep-method post">POST</span>
              <span className="ep-url">/api/register/autonomous</span>
            </div>
            <div className="ep-body">
              <p className="ep-desc">For fully autonomous agents with their own AA wallets. Submit a pre-signed UserOperation.</p>
              <pre className="ep-code">{`curl -X POST /api/register/autonomous \\
  -H "Content-Type: application/json" \\
  -d '{
    "userOp": {
      "sender": "0x...",
      "callData": "0x...",
      "signature": "0x...",
      ...
    }
  }'`}</pre>
            </div>
          </div>

          <div className="endpoint-card">
            <div className="ep-header">
              <span className="ep-method post">POST</span>
              <span className="ep-url">/api/register/build-userop</span>
            </div>
            <div className="ep-body">
              <p className="ep-desc">Builds an unsigned UserOperation for agents to sign themselves.</p>
              <pre className="ep-code">{`curl -X POST /api/register/build-userop \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "agent-name",
    "owner": "0x...",
    "deployWallet": false
  }'

// Response
{
  "userOp": { ... },
  "instructions": "Sign with your AA wallet key",
  "contracts": {
    "registrar": "0x...",
    "usdc": "0x..."
  }
}`}</pre>
            </div>
          </div>
        </div>

        {/* Name Availability */}
        <div className="api-section">
          <h3 className="api-header">Name Availability</h3>
          <p className="api-sub">Check if a .safu name is available for registration.</p>

          <div className="endpoint-card">
            <div className="ep-header">
              <span className="ep-method get">GET</span>
              <span className="ep-url">https://api.safuverse.com/v1/available/&#123;name&#125;</span>
            </div>
            <div className="ep-body">
              <p className="ep-desc">Returns availability status and pricing information for a name.</p>
              <pre className="ep-code">{`curl https://api.safuverse.com/v1/available/myname

// Response
{
  "name": "myname",
  "available": true,
  "price_usdc": "5.000000",
  "is_agent_name": false
}`}</pre>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="api-section">
          <h3 className="api-header">Pricing</h3>
          <p className="api-sub">Query registration prices in USDC.</p>

          <div className="endpoint-card">
            <div className="ep-header">
              <span className="ep-method get">GET</span>
              <span className="ep-url">https://api.safuverse.com/v1/price/&#123;name&#125;</span>
            </div>
            <div className="ep-body">
              <p className="ep-desc">Returns the registration price in USDC (6 decimal precision) and whether the name qualifies as an agent name.</p>
              <pre className="ep-code">{`curl https://api.safuverse.com/v1/price/defi-bot

// Response
{
  "name": "defi-bot",
  "price_usdc": "0.050000",
  "is_agent_name": true,
  "payment_token": "USDC",
  "chain": "Base"
}`}</pre>
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="api-section">
          <h3 className="api-header">Authentication</h3>
          <p className="api-sub">All endpoints require authentication via API key or wallet signature.</p>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
            <h4 className="font-bold text-lg mb-4">API Key Authentication</h4>
            <pre className="ep-code">{`// Include in request headers
Authorization: Bearer YOUR_API_KEY

// Or as query parameter
?api_key=YOUR_API_KEY`}</pre>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <h4 className="font-bold text-lg mb-4">Wallet Signature Authentication</h4>
            <pre className="ep-code">{`// For agent endpoints, sign with your wallet
X-Wallet-Signature: 0x...
X-Wallet-Address: 0x...
X-Signature-Timestamp: 1706000000`}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
