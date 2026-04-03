import { z } from 'zod';

export const CreateRecordSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'Category is required'),
  date: z.coerce.date({
    invalid_type_error: 'Invalid date format',
    required_error: 'Date is required',
  }),
  notes: z.string().optional(),
});

export const UpdateRecordSchema = CreateRecordSchema.partial();

export const FilterSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().min(1, 'Category is required').optional(),
  search: z.string().min(1, 'Search query is required').optional(),
  startDate: z.coerce.date({ invalid_type_error: 'Invalid start date format' }).optional(),
  endDate: z.coerce.date({ invalid_type_error: 'Invalid end date format' }).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

export const createRecordSchema = z.object({
  body: z.object({
    amount: CreateRecordSchema.shape.amount,
    type: CreateRecordSchema.shape.type,
    category: CreateRecordSchema.shape.category,
    date: z.coerce.date({
      invalid_type_error: 'Invalid date format',
      required_error: 'Date is required',
    }),
    notes: CreateRecordSchema.shape.notes,
  }),
});

export const updateRecordSchema = z.object({
  body: z.object({
    amount: UpdateRecordSchema.shape.amount,
    type: UpdateRecordSchema.shape.type,
    category: UpdateRecordSchema.shape.category,
    date: z.coerce.date({ invalid_type_error: 'Invalid date format' }).optional(),
    notes: UpdateRecordSchema.shape.notes,
  }),
  params: z.object({
    id: z.string().uuid('Invalid record ID'),
  }),
});

export const getRecordSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid record ID'),
  }),
});

export const listRecordsSchema = z.object({
  query: z.object({
    type: FilterSchema.shape.type,
    category: FilterSchema.shape.category,
    search: FilterSchema.shape.search,
    startDate: z.coerce.date({ invalid_type_error: 'Invalid start date format' }).optional(),
    endDate: z.coerce.date({ invalid_type_error: 'Invalid end date format' }).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
  }),
});

export type CreateRecordInput = z.infer<typeof CreateRecordSchema>;
export type UpdateRecordInput = z.infer<typeof UpdateRecordSchema>;
export type RecordParamsInput = z.infer<typeof getRecordSchema>['params'];
export type FilterInput = z.infer<typeof FilterSchema>;
