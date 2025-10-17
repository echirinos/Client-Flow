import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const createJobSchema = z.object({
  orgId: z.string(),
  clientName: z.string().min(1),
  clientEmail: z.string().email().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  pipeline: z.string().optional(),
  dealstage: z.string().optional(),
});

export const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z
    .enum(['NEW', 'IN_PROGRESS', 'AWAITING_CLIENT', 'COMPLETED', 'CANCELED'])
    .optional(),
});

export const createMessageSchema = z.object({
  senderType: z.enum(['owner', 'client', 'system']),
  body: z.string().min(1),
});

export const presignAttachmentSchema = z.object({
  contentType: z.string().refine(
    (val) => {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      return allowedTypes.includes(val);
    },
    { message: 'Invalid content type' }
  ),
  uploadedByClient: z.boolean().optional(),
});

export const invoiceItemSchema = z.object({
  description: z.string().min(1),
  qty: z.number().int().positive(),
  unitAmount: z.number().int().positive(),
});

export const createInvoiceSchema = z.object({
  jobId: z.string(),
  items: z.array(invoiceItemSchema).min(1),
  currency: z.string().default('usd'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type PresignAttachmentInput = z.infer<typeof presignAttachmentSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
