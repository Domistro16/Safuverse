/**
 * server.js
 *
 * Enhanced Express server with tiered GPT access based on .safu domain characteristics.
 *
 * Tier Structure:
 * - 5 char: 1yr=2 calls/day (all agents), lifetime=5 calls/day (all agents)
 * - 4 char: 1yr=5 calls/day (all agents), lifetime=10 calls/day (all agents)
 * - 3 char: 1yr=20 calls/day (all agents), lifetime=50 calls/day (all agents)
 * - 2 char: 1yr=100 calls/day (all agents), lifetime=200 calls/day (all agents)
 * - No domain: 5 lifetime calls (IP tracked), only "Be The Replyooor" agent
 */
import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import sqlite3 from "sqlite3";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import cors from "cors";
import OpenAI from "openai";
import { ethers } from "ethers";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const DB_FILE = process.env.DB_FILE || path.join(process.cwd(), "data.db");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const provider = new ethers.JsonRpcProvider(
  "https://bsc-dataseed.binance.org/"
);

// Contract ABIs and addresses
const REVERSE_ABI = [
  "function node(address addr) public pure override returns (bytes32)",
];
const REVERSE_ADDRESS =
  process.env.REVERSE_ADDRESS || "0x1D0831eA9486Fada3887a737E8d6f8C6Ad72a125";

const REGISTRY_ABI = [
  {
    inputs: [{ internalType: "bytes32", name: "node", type: "bytes32" }],
    name: "resolver",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];
const REGISTRY_ADDRESS =
  process.env.REGISTRY_ADDRESS || "0xa886B8897814193f99A88701d70b31b4a8E27a1E";

const RESOLVER_ABI = [
  {
    inputs: [{ internalType: "bytes32", name: "node", type: "bytes32" }],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];

const BASE_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "nameExpires",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

const base = new ethers.Contract(
  process.env.BASE_ADDRESS || "0x4c797EbaA64Cc7f1bD2a82A36bEE5Cf335D1830c",
  BASE_ABI,
  provider
);
const reverse = new ethers.Contract(REVERSE_ADDRESS, REVERSE_ABI, provider);
const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);

// ----- Prepare DB (sqlite3 with promise wrappers) -----
if (!fs.existsSync(path.dirname(DB_FILE))) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(DB_FILE);
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Create enhanced tables
await dbRun(`
  CREATE TABLE IF NOT EXISTS users (
    public_key TEXT PRIMARY KEY,
    domain_name TEXT,
    domain_tier INTEGER DEFAULT 0,
    is_lifetime BOOLEAN DEFAULT FALSE,
    daily_limit INTEGER DEFAULT 0,
    daily_calls INTEGER DEFAULT 0,
    last_reset_date TEXT,
    gpt_access TEXT DEFAULT '[]',
    all_access BOOLEAN DEFAULT FALSE,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Table for IP-based tracking (no domain users)
await dbRun(`
  CREATE TABLE IF NOT EXISTS ip_users (
    ip_address TEXT PRIMARY KEY,
    total_calls INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// ----- Helpers -----
function isValidPublicKey(pk) {
  return typeof pk === "string" && pk.length >= 10 && pk.length <= 200;
}

const prompts = {
  "Your GPT": "prompt_id", // ... and so on
};

/**
 * Determine tier based on domain character count (excluding .safu)
 * Returns { tier: number, dailyLimit: number }
 */
function calculateTier(domainName, isLifetime) {
  const baseName = domainName.replace(".safu", "");
  const charCount = baseName.length;

  const tierMap = {
    2: { year: 100, lifetime: 200 },
    3: { year: 20, lifetime: 50 },
    4: { year: 5, lifetime: 10 },
    5: { year: 2, lifetime: 5 },
  };

  if (tierMap[charCount]) {
    return {
      tier: charCount,
      dailyLimit: isLifetime
        ? tierMap[charCount].lifetime
        : tierMap[charCount].year,
    };
  }

  // For 6+ characters, treat as 5-char tier
  return {
    tier: 5,
    dailyLimit: isLifetime ? 5 : 2,
  };
}

/**
 * Check if we need to reset daily counter (new day)
 */
function shouldResetDailyCounter(lastResetDate) {
  if (!lastResetDate) return true;

  const today = new Date().toISOString().split("T")[0];
  const lastReset = lastResetDate.split("T")[0];

  return today !== lastReset;
}

/**
 * Get or create IP user record
 */
async function getIpUser(ipAddress) {
  let row = await dbGet(
    "SELECT * FROM ip_users WHERE ip_address = ?",
    ipAddress
  );

  if (!row) {
    await dbRun(
      `INSERT INTO ip_users (ip_address, total_calls, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
      [ipAddress, 0, new Date().toISOString(), new Date().toISOString()]
    );
    row = await dbGet("SELECT * FROM ip_users WHERE ip_address = ?", ipAddress);
  }

  return {
    ipAddress: row.ip_address,
    totalCalls: row.total_calls,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Load user row from DB
 */
async function getUser(publicKey) {
  const row = await dbGet(
    "SELECT * FROM users WHERE public_key = ?",
    publicKey
  );
  if (!row) return null;

  return {
    publicKey: row.public_key,
    domainName: row.domain_name,
    domainTier: row.domain_tier,
    isLifetime: !!row.is_lifetime,
    dailyLimit: row.daily_limit,
    dailyCalls: row.daily_calls,
    lastResetDate: row.last_reset_date,
    all_access: !!row.all_access,
    gpt_access: (() => {
      try {
        return JSON.parse(row.gpt_access || "[]");
      } catch {
        return [];
      }
    })(),
    updated_at: row.updated_at,
  };
}

/**
 * Check and reset daily counter if needed
 */
async function checkAndResetDailyCounter(publicKey) {
  const user = await getUser(publicKey);
  if (!user) return;

  if (shouldResetDailyCounter(user.lastResetDate)) {
    await dbRun(
      `UPDATE users SET daily_calls = 0, last_reset_date = ? WHERE public_key = ?`,
      [new Date().toISOString(), publicKey]
    );
    return 0; // Reset counter
  }

  return user.dailyCalls;
}

/**
 * Increment daily call counter
 */
async function incrementDailyCalls(publicKey) {
  await dbRun(
    `UPDATE users SET daily_calls = daily_calls + 1, updated_at = ? WHERE public_key = ?`,
    [new Date().toISOString(), publicKey]
  );
}

/**
 * Increment IP user total calls
 */
async function incrementIpCalls(ipAddress) {
  await dbRun(
    `UPDATE ip_users SET total_calls = total_calls + 1, updated_at = ? WHERE ip_address = ?`,
    [new Date().toISOString(), ipAddress]
  );
}

/**
 * Get client IP address
 */
function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

// ----- Express app -----
const app = express();
app.use(bodyParser.json());
app.use(cors());

// POST /api/assistant - Handle chat requests with rate limiting
app.post("/api/assistant", async (req, res) => {
  try {
    if (req.headers["x-api-key"] !== process.env.KEY) {
      return res.status(403).json({ error: "Forbidden: Invalid API Key" });
    }
    const { profile, messages, gpt, publicKey } = req.body ?? {};

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array required" });
    }

    // Get client IP
    const clientIp = getClientIp(req);

    // Check if user has a domain or is IP-based
    let user = null;
    let isIpUser = false;

    if (publicKey && isValidPublicKey(publicKey)) {
      user = await getUser(publicKey);
    }

    // If no valid user with domain, treat as IP user
    if (!user || !user.domainName) {
      isIpUser = true;
      const ipUser = await getIpUser(clientIp);

      // IP users have lifetime limit of 5 calls total
      if (ipUser.totalCalls >= 5) {
        return res.status(201).json({
          error: "Rate limit exceeded",
          reply:
            "You have used all 5 free calls. Please register a .safu domain for continued access.",
          limit: 5,
          used: ipUser.totalCalls,
        });
      }

      // IP users can only access "Be The Replyooor"
      if (gpt !== "Be The Replyooor") {
        console.log("a");
        return res.status(201).json({
          error: "Access denied",
          reply:
            'Free users can only access "Be The Replyooor" agent. Register a .safu domain for full access.',
          allowedAgent: "Be The Replyooor",
        });
      }
    } else {
      // Domain user - check daily rate limit
      const currentCalls = await checkAndResetDailyCounter(publicKey);

      if (currentCalls >= user.dailyLimit) {
        return res.status(201).json({
          error: "Daily rate limit exceeded",
          reply: `You have reached your daily limit of ${user.dailyLimit} calls. Reset at midnight UTC.`,
          limit: user.dailyLimit,
          used: currentCalls,
          tier: user.domainTier,
          isLifetime: user.isLifetime,
        });
      }

      // Check if user has access to requested GPT
      if (!user.all_access) {
        console.log("b");
        return res.status(201).json({
          error: "Access denied",
          reply:
            "You don't have access to any GPT agents. Please verify your domain.",
        });
      }
    }

    // Normalize messages
    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Call OpenAI API
    const systemInstruction =
      (profile?.prefs?.tone === "gen-z"
        ? "You are a friendly, encouraging, assistant. Keep answers short, upbeat, and helpful."
        : "You are a helpful assistant.") +
      " Behave like the user's custom GPT. Use concise bullets when useful.";

    const messagesPayload = [
      { role: "system", content: systemInstruction },
      ...formattedMessages,
    ];

    const r = await openai.responses.create({
      input: messagesPayload,
      prompt: {
        id: prompts[gpt] || undefined,
      },
    });

    const replyText = r?.output_text;

    // Increment counters after successful call
    if (isIpUser) {
      await incrementIpCalls(clientIp);
      const updatedIpUser = await getIpUser(clientIp);

      return res.status(200).json({
        reply: replyText,
        rateLimit: {
          type: "ip",
          limit: 5,
          remaining: 5 - updatedIpUser.totalCalls,
          used: updatedIpUser.totalCalls,
        },
      });
    } else {
      await incrementDailyCalls(publicKey);
      const updatedUser = await getUser(publicKey);

      return res.status(200).json({
        reply: replyText,
        rateLimit: {
          type: "domain",
          limit: updatedUser.dailyLimit,
          remaining: updatedUser.dailyLimit - updatedUser.dailyCalls,
          used: updatedUser.dailyCalls,
          resetDate: new Date(
            new Date().setUTCHours(24, 0, 0, 0)
          ).toISOString(),
          tier: updatedUser.domainTier,
          isLifetime: updatedUser.isLifetime,
        },
      });
    }
  } catch (error) {
    console.error("assistant error:", error);
    return res.status(500).json({ error: error?.message ?? String(error) });
  }
});

// POST /api/verify - Verify domain and set tier, or fallback to IP verification
app.post("/api/verify", async (req, res) => {
  try {
    if (req.headers["x-api-key"] !== process.env.KEY) {
      return res.status(403).json({ error: "Forbidden: Invalid API Key" });
    }

    const { publicKey, gpt } = req.body ?? {};
    const clientIp = getClientIp(req);
    let domainVerified = false;

    // Try domain verification first if publicKey is provided
    if (publicKey && isValidPublicKey(publicKey)) {
      try {
        await dbRun("BEGIN IMMEDIATE TRANSACTION");

        // Ensure user exists
        let row = await dbGet(
          "SELECT * FROM users WHERE public_key = ?",
          publicKey
        );
        if (!row) {
          await dbRun(
            `INSERT INTO users (public_key, gpt_access, all_access, updated_at)
             VALUES (?, ?, ?, ?)`,
            [publicKey, "[]", false, new Date().toISOString()]
          );
          row = await dbGet(
            "SELECT * FROM users WHERE public_key = ?",
            publicKey
          );
        }

        // Check for .safu domain
        const node = await reverse.node(publicKey);
        const resolverAddress = await registry.resolver(node);

        if (resolverAddress && resolverAddress !== ethers.ZeroAddress) {
          const resolver = new ethers.Contract(
            resolverAddress,
            RESOLVER_ABI,
            provider
          );
          const name = await resolver.name(node);

          if (name && name.endsWith(".safu")) {
            console.log("Found .safu name:", name);

            // Check expiry
            const expiry = await base.nameExpires(
              BigInt(
                ethers.keccak256(ethers.toUtf8Bytes(name.split(".safu")[0]))
              )
            );

            const isLifetime = expiry == 31536000000n;

            // Calculate tier and daily limit
            const { tier, dailyLimit } = calculateTier(name, isLifetime);

            // Update user with tier information
            await dbRun(
              `UPDATE users SET 
                domain_name = ?,
                domain_tier = ?,
                is_lifetime = ?,
                daily_limit = ?,
                all_access = ?,
                last_reset_date = ?,
                updated_at = ?
               WHERE public_key = ?`,
              [
                name,
                tier,
                isLifetime,
                dailyLimit,
                true, // All domain users get all_access
                new Date().toISOString(),
                new Date().toISOString(),
                publicKey,
              ]
            );

            await dbRun("COMMIT");
            const fresh = await getUser(publicKey);
            domainVerified = true;

            return res.json({
              success: true,
              verificationType: "domain",
              message: `Access granted! ${tier}-character domain with ${
                isLifetime ? "lifetime" : "1-year"
              } registration.`,
              user: fresh,
              access: true,
              tier: {
                type: "domain",
                characters: tier,
                isLifetime: isLifetime,
                dailyLimit: dailyLimit,
                description: `${dailyLimit} calls per day, access to all agents`,
              },
            });
          }
        }

        // If we reach here, no valid domain found
        await dbRun("ROLLBACK");
        console.log(
          "No valid .safu domain found, falling back to IP verification"
        );
      } catch (txErr) {
        await dbRun("ROLLBACK");
        console.error("Domain verification error:", txErr);
        // Fall through to IP verification
      }
    }

    // IP Verification - If we reach here, either no publicKey or domain verification failed
    if (!domainVerified) {
      console.log(`Setting up IP-based access for: ${clientIp}`);

      const ipUser = await getIpUser(clientIp);

      return res.json({
        success: true,
        verificationType: "ip",
        message:
          ipUser.totalCalls === 0
            ? "Welcome! You have 5 free calls with limited access. Register a .safu domain for unlimited agents and more calls."
            : `IP verification complete. ${
                5 - ipUser.totalCalls
              } free calls remaining.`,
        access: true,
        tier: {
          type: "ip",
          totalLimit: 5,
          remaining: 5 - ipUser.totalCalls,
          used: ipUser.totalCalls,
          allowedAgents: ["Be The Replyooor"],
          description: "5 lifetime calls, limited to Be The Replyooor agent",
        },
        ipUser: {
          ipAddress: ipUser.ipAddress,
          totalCalls: ipUser.totalCalls,
          remaining: 5 - ipUser.totalCalls,
        },
        upgradeMessage:
          "Register a .safu domain to unlock all agents and get daily call limits!",
      });
    }
  } catch (err) {
    console.error("POST /api/verify error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
});

// GET /api/user?publicKey=...
app.get("/api/user", async (req, res) => {
  try {
    const publicKey = req.query.publicKey;
    if (!publicKey || !isValidPublicKey(publicKey)) {
      return res
        .status(400)
        .json({ error: "Invalid or missing publicKey query parameter" });
    }

    const user = await getUser(publicKey);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check and reset counter if needed
    await checkAndResetDailyCounter(publicKey);
    const freshUser = await getUser(publicKey);

    return res.json({
      success: true,
      user: freshUser,
      rateLimit: {
        limit: freshUser.dailyLimit,
        remaining: freshUser.dailyLimit - freshUser.dailyCalls,
        used: freshUser.dailyCalls,
        resetDate: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString(),
      },
    });
  } catch (err) {
    console.error("GET /api/user error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
});

// GET /api/ip-status - Check IP user status
app.get("/api/ip-status", async (req, res) => {
  try {
    const clientIp = getClientIp(req);
    const ipUser = await getIpUser(clientIp);

    return res.json({
      success: true,
      ipUser,
      rateLimit: {
        limit: 5,
        remaining: 5 - ipUser.totalCalls,
        used: ipUser.totalCalls,
        type: "lifetime",
      },
      allowedAgent: "Be The Replyooor",
    });
  } catch (err) {
    console.error("GET /api/ip-status error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
});

// Health check
app.get("/", (req, res) => res.send("LV-GPT access server running"));

// Start
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`DB file: ${DB_FILE}`);
});
