import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { auth } from "./lib/auth";
import { toNodeHandler } from "better-auth/node";
import { healthRouter } from "./routes/health";
import { airportRouter } from "./routes/airports";
import { servicesRouter } from "./routes/services";
import { pricingRouter } from "./routes/pricing";
import { availabilityRouter } from "./routes/availability";
import { bookingsRouter } from "./routes/bookings";
import { customersRouter } from "./routes/customers";
import { stripeRouter } from "./routes/stripe";
import { techJobsRouter } from "./routes/tech-jobs";
import { photosRouter } from "./routes/photos";
import { errorHandler } from "./middleware/errorHandler";
import { resolveTenant } from "./middleware/tenant";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000", credentials: true }));
app.use(express.json());

// Better Auth handler
app.all("/api/auth/*", toNodeHandler(auth));

// Routes
app.use("/api/health", healthRouter);

// Tenant-scoped routes
app.use("/api/airports", airportRouter);
app.use("/api/services", resolveTenant, servicesRouter);
app.use("/api/pricing", resolveTenant, pricingRouter);
app.use("/api/availability", resolveTenant, availabilityRouter);
app.use("/api/bookings", resolveTenant, bookingsRouter);
app.use("/api/customers", resolveTenant, customersRouter);
app.use("/api/stripe", express.raw({ type: "application/json" }), stripeRouter);
app.use("/api/tech/jobs", techJobsRouter);
app.use("/api/photos", photosRouter);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;
