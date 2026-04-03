import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { LoginSchema, RegisterSchema } from './auth.schema';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = RegisterSchema.parse(req.body);
      const user = await authService.register(data);
      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = LoginSchema.parse(req.body);
      const result = await authService.login(data.email, data.password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
