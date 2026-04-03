import { z } from 'zod';

const roleEnum = z.enum(['VIEWER', 'ANALYST', 'ADMIN']);

export const CreateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    role: roleEnum,
  }),
});

export const UpdateRoleSchema = z.object({
  body: z.object({
    role: roleEnum,
  }),
});

export const UpdateStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean(),
  }),
});

export const UserIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>['body'];
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>['body'];
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>['body'];
