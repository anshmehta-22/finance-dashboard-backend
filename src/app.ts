import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { authLimiter, generalLimiter } from "./config/rateLimiter";
import { errorMiddleware } from "./middleware/error.middleware";

import authRouter from "./modules/auth/auth.router";
import usersRouter from "./modules/users/users.router";
import recordsRouter from "./modules/records/records.router";
import dashboardRouter from "./modules/dashboard/dashboard.router";

export const createApp = (): Application => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(generalLimiter);

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use("/api/auth", authLimiter, authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/records", recordsRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use("*", (_req: Request, res: Response) => {
    res.status(404).json({ error: "Route not found" });
  });

  app.use(errorMiddleware);

  return app;
};
