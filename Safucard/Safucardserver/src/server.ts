import "dotenv/config";
import express from "express";
import cors from "cors"; // Import cors
import routes from "./router";
const app = express();

const ORIGIN = process.env.FRONTEND_ORIGIN || "https://safucard.xyz";

app.use(
  cors({
    origin: ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
const port = process.env.PORT || 800;
console.log(
  "routes type",
  typeof routes,
  Array.isArray(routes),
  routes && routes.stack ? "is Router" : "not Router"
);
app.use("/api", routes);

app.listen(port, () => console.log(`Server is running on port ${port}`));
