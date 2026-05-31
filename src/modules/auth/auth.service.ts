import prisma from '../../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { RegisterInput } from './auth.schema';
import { AppError } from '../../middleware/error.middleware';

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const createdUser = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role || 'VIEWER',
      },
    });

    const { passwordHash: _passwordHash, ...userWithoutPassword } = createdUser;
    void _passwordHash;
    return userWithoutPassword;
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw new AppError('User account is inactive', 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = this.generateToken(user.id, user.email, user.role);

    const { passwordHash: _passwordHash, ...safeUser } = user;
    void _passwordHash;

    return { token, user: safeUser };
  }

  private generateToken(userId: string, email: string, role: string): string {
    return jwt.sign({ userId, email, role }, env.JWT_SECRET, {
      expiresIn: '7d',
    });
  }
}
