import express from "express";
import cors from "cors";
import reputationRoutes from "./routes/reputation";
import { CONFIG } from "./constants";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Reputation routes
app.use("/api/reputation", reputationRoutes);

app.listen(CONFIG.PORT, () => {
  console.log(`Domain Reputation API running on port ${CONFIG.PORT}`);
  console.log(`Subgraph URL: ${CONFIG.GOLDSKY_SUBGRAPH_URL}`);
});

export default app;
