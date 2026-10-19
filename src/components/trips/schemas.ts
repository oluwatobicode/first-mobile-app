import { z } from 'zod';

export const CANCEL_REASONS = ['Change of plans', 'Found a different place', 'Host asked me to cancel', 'Other'] as const;

export const cancelSchema = z
  .object({
    reason: z.enum(CANCEL_REASONS, { error: 'Choose a reason to continue.' }),
    details: z.string().trim().max(300, 'Keep it under 300 characters.'),
  })
  .refine((v) => v.reason !== 'Other' || v.details.length > 0, {
    path: ['details'],
    message: 'Tell us a little more.',
  });
export type CancelForm = z.input<typeof cancelSchema>;

export const REVIEW_MIN = 20;
export const REVIEW_MAX = 500;

export const reviewTextSchema = z.object({
  text: z
    .string()
    .trim()
    .min(REVIEW_MIN, `Write at least ${REVIEW_MIN} characters.`)
    .max(REVIEW_MAX, `Keep it under ${REVIEW_MAX} characters.`),
});
export type ReviewTextForm = z.infer<typeof reviewTextSchema>;
