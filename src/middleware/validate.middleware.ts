import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validateMiddleware = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const bodyValidation = schema.safeParse(req.body);
    if (bodyValidation.success) {
      req.body = bodyValidation.data;
      next();
      return;
    }

    // Backward compatibility for existing route schemas that validate body/query/params together.
    const compositeValidation = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (compositeValidation.success) {
      next();
      return;
    }

    const bodyLooksWrappedSchema = bodyValidation.error.errors.every((issue) => {
      const key = issue.path[0];
      return key === 'body' || key === 'query' || key === 'params';
    });

    const selectedErrors = bodyLooksWrappedSchema
      ? compositeValidation.error.errors
      : bodyValidation.error.errors;

    const errors = selectedErrors.map((issue) => issue.message);
    res.status(400).json({ errors });
  };
};
