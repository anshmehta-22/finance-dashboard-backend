import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorMiddleware = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ZodError) {
    res
      .status(400)
      .json({ error: err.errors.map((issue) => issue.message).join(", ") });
    return;
  }

  const statusLikeError = err as Error & {
    statusCode?: number;
    status?: number;
  };

  if (statusLikeError.statusCode === 429 || statusLikeError.status === 429) {
    res.status(429).json({
      error:
        statusLikeError.message || "Too many requests, please try again later.",
    });
    return;
  }

  const statusCode =
    err instanceof AppError &&
    [400, 401, 403, 404, 409, 429].includes(err.statusCode)
      ? err.statusCode
      : 500;

  const message =
    statusCode === 500
      ? "Internal server error"
      : err.message || "Unexpected error";

  res.status(statusCode).json({ error: message });
};
