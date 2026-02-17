import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { healthRouter } from "./routes/health";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/health", healthRouter);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;
